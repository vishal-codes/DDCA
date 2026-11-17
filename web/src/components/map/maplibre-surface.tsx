"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { Map as LibreMap, StyleSpecification } from "maplibre-gl";
import type { MapCamera } from "@/lib/map/cameras";
import type { WildfirePoint } from "@/lib/data/wildfire";
import type { MapViewport } from "@/lib/data/wildfire-zones";
import { fitMapPoints, flatBasemapStyle, mapFailure, MAP_WORKER_PATH, project, type MapFailureKind } from "@/lib/map/basemap";

type Props = {
  camera: MapCamera;
  style: string | StyleSpecification;
  center?: WildfirePoint;
  onViewport?: (viewport: MapViewport) => void;
  onSelect?: (point: WildfirePoint) => void;
  onFailure: (message: string, kind?: MapFailureKind) => void;
  onReady?: () => void;
  retryKey?: number;
  showStatus?: boolean;
  focusPoints?: readonly WildfirePoint[];
  focusRevision?: number;
  focusPadding?: number;
};

export function MapLibreSurface({ camera, style, center, onViewport, onSelect, onFailure, onReady, retryKey = 0, showStatus = true, focusPoints, focusRevision = 0, focusPadding = 112 }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<LibreMap | null>(null);
  const appliedStyle = useRef(style);
  const [map, setMap] = useState<LibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [resourceWarning, setResourceWarning] = useState(false);
  const reportViewport = useEffectEvent((activeMap: LibreMap) => {
    const location = activeMap.getCenter();
    // MapLibre uses a 512px world at zoom zero. The raster overlay uses 256px.
    const zoom = activeMap.getZoom() + 1;
    const pixels = project({ longitude: location.lng, latitude: location.lat }, zoom);
    const { clientWidth: width, clientHeight: height } = activeMap.getContainer();
    onViewport?.({ zoom, left: pixels.x - width / 2, top: pixels.y - height / 2, width, height });
  });
  const configuration = useEffectEvent(() => ({ camera, style }));
  const selectPoint = useEffectEvent((point: WildfirePoint) => onSelect?.(point));
  const fail = useEffectEvent((message: string, kind: MapFailureKind) => onFailure(message, kind));
  const recover = useEffectEvent(() => onReady?.());

  useEffect(() => {
    let disposed = false;
    let instance: LibreMap | undefined;
    let observer: ResizeObserver | undefined;
    let styleLoaded = false;
    let reportedFailure = false;
    const options = configuration();
    const reportFailure = (message: string, kind: MapFailureKind) => {
      if (disposed || reportedFailure) return;
      reportedFailure = true;
      fail(message, kind);
    };
    const timer = window.setTimeout(() => reportFailure(
      "The map is taking too long to load. Check the connection and retry.",
      "provider",
    ), 30000);

    import("maplibre-gl").then(({ Map, NavigationControl, AttributionControl, setWorkerUrl, getVersion }) => {
      if (disposed || !container.current) return;
      // An explicit same-origin worker avoids webpack resolving import.meta.url to a file URL.
      setWorkerUrl(`${MAP_WORKER_PATH}?v=${encodeURIComponent(getVersion())}`);
      setReady(false);
      setResourceWarning(false);
      appliedStyle.current = options.style;
      instance = new Map({
        container: container.current,
        style: options.style,
        center: [options.camera.longitude, options.camera.latitude],
        zoom: options.camera.zoom,
        minZoom: 1,
        maxZoom: 16,
        pitch: 0,
        maxPitch: 0,
        bearing: 0,
        dragRotate: false,
        touchPitch: false,
        renderWorldCopies: false,
        attributionControl: false,
        transformStyle: (_previous, next) => flatBasemapStyle(next),
      });
      const activeMap = instance;
      instanceRef.current = activeMap;
      activeMap.touchZoomRotate.disableRotation();
      activeMap.keyboard.disableRotation();
      activeMap.addControl(new NavigationControl({ showCompass: false }), "top-right");
      activeMap.addControl(new AttributionControl({ compact: true }), "bottom-right");
      activeMap.getCanvas().setAttribute("aria-label", "Interactive map. Arrow keys pan. Plus and minus zoom.");
      activeMap.on("move", () => reportViewport(activeMap));
      activeMap.on("click", (event) => {
        const point = event.lngLat.wrap();
        selectPoint({ latitude: point.lat, longitude: point.lng });
      });
      activeMap.on("style.load", () => { styleLoaded = true; });
      activeMap.on("error", (event) => {
        if (disposed) return;
        const errorUrl = "url" in event.error ? event.error.url : undefined;
        const isStyleRequest = typeof appliedStyle.current === "string" && errorUrl === appliedStyle.current;
        const failure = mapFailure(event.error, styleLoaded && !isStyleRequest, "sourceId" in event);
        if (failure) reportFailure(failure.message, failure.kind);
        else setResourceWarning(true);
      });
      const markReady = () => {
        if (disposed) return;
        window.clearTimeout(timer);
        reportedFailure = false;
        setReady(true);
        setResourceWarning(false);
        recover();
        reportViewport(activeMap);
      };
      activeMap.on("load", markReady);
      activeMap.on("idle", markReady);
      observer = new ResizeObserver(() => { activeMap.resize(); reportViewport(activeMap); });
      observer.observe(container.current);
      setMap(activeMap);
    }).catch(() => reportFailure(
      "The interactive map could not start. Check browser graphics support and retry.",
      "renderer",
    ));

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      observer?.disconnect();
      instanceRef.current = null;
      instance?.remove();
    };
  }, [retryKey]);

  useEffect(() => {
    if (map && map === instanceRef.current && style !== appliedStyle.current) {
      appliedStyle.current = style;
      map.setStyle(style);
    }
  }, [map, style]);

  useEffect(() => {
    if (!map || map !== instanceRef.current || !center) return;
    const current = map.getCenter();
    if (Math.abs(current.lng - center.longitude) > 0.000001 || Math.abs(current.lat - center.latitude) > 0.000001) {
      map.jumpTo({ center: [center.longitude, center.latitude] });
    }
  }, [map, center]);

  useEffect(() => {
    if (!map || map !== instanceRef.current || !focusPoints?.length) return;
    const container = map.getContainer();
    const view = fitMapPoints(focusPoints, container.clientWidth, container.clientHeight, focusPadding);
    if (view) map.jumpTo({ center: [view.center.longitude, view.center.latitude], zoom: view.zoom - 1 });
  }, [map, focusPoints, focusRevision, focusPadding]);

  return <>
    <div ref={container} className="maplibre-surface" />
    {showStatus && !ready && <p className="surface-card basemap-loading" role="status">Loading map...</p>}
    {showStatus && resourceWarning && <p className="surface-card basemap-loading" role="status">
      Some map details could not load. The map remains available.
    </p>}
  </>;
}
