"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CAL_FIRE_SOURCE, type WildfireCategory } from "@/lib/data/wildfire";
import {
  getCachedWildfirePolygons, getCachedWildfireViewport, getServerWildfirePolygons, getWildfirePolygons,
  subscribeWildfirePolygons, WEB_MERCATOR_HALF_WORLD, wildfireViewportUrl, type MapViewport,
} from "@/lib/data/wildfire-zones";
import { worldSize } from "@/lib/map/basemap";

const zoneColors: Record<WildfireCategory, string> = {
  Moderate: "#ffde3e",
  High: "#ff5500",
  "Very High": "#ff0000",
};

type ZoneResult = { url: string; attempt: number; count?: number; failed?: boolean };

export function WildfireZoneOverlay({ viewport, opacity = 55 }: { viewport: MapViewport; opacity?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [result, setResult] = useState<ZoneResult>();
  const [attempt, setAttempt] = useState(0);
  const url = wildfireViewportUrl(viewport);
  const polygons = useSyncExternalStore(subscribeWildfirePolygons, getCachedWildfirePolygons, getServerWildfirePolygons);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      getWildfirePolygons(url, controller.signal).then(
        (data) => {
          if (!controller.signal.aborted) setResult({ url, attempt, count: data.length });
        },
        () => {
          if (!controller.signal.aborted) setResult({ url, attempt, failed: true });
        },
      );
    }, getCachedWildfireViewport(url) ? 0 : 100);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [url, attempt]);

  const current = result?.url === url && result.attempt === attempt ? result : undefined;
  const paths = useMemo(() => polygons.map(({ category, rings }) => {
    const path = new Path2D();
    for (const ring of rings) {
      path.moveTo(...ring[0]);
      for (let index = 1; index < ring.length; index++) path.lineTo(...ring[index]);
      path.closePath();
    }
    return { path, color: zoneColors[category] };
  }), [polygons]);

  const { zoom, left, top, width, height } = viewport;
  useLayoutEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const density = Math.min(window.devicePixelRatio, 2);
    const pixelWidth = Math.round(width * density);
    const pixelHeight = Math.round(height * density);
    if (element.width !== pixelWidth) element.width = pixelWidth;
    if (element.height !== pixelHeight) element.height = pixelHeight;
    context.resetTransform();
    context.clearRect(0, 0, pixelWidth, pixelHeight);
    const world = worldSize(zoom);
    const pixelsPerMeter = world / (2 * WEB_MERCATOR_HALF_WORLD);
    context.setTransform(
      pixelsPerMeter * density, 0, 0, -pixelsPerMeter * density,
      (world / 2 - left) * density, (world / 2 - top) * density,
    );
    context.lineWidth = 1 / pixelsPerMeter;
    for (const { path, color } of paths) {
      context.fillStyle = color;
      context.strokeStyle = color;
      context.globalAlpha = opacity / 100 * 0.7;
      context.fill(path, "evenodd");
      context.globalAlpha = opacity / 100;
      context.stroke(path);
    }
  }, [paths, zoom, left, top, width, height, opacity]);

  return <>
    <canvas ref={canvas} className="wildfire-zone-overlay" aria-hidden="true" />
    <section className="surface-card wildfire-zone-legend" aria-label="CAL FIRE wildfire zone legend">
      <h2>Wildfire hazard zones</h2>
      <ul>{Object.entries(zoneColors).map(([category, color]) => <li key={category}>
        <span className="wildfire-zone-swatch" style={{ backgroundColor: color }} aria-hidden="true" />{category}
      </li>)}</ul>
      <p className="caption">CAL FIRE. Effective <time dateTime={CAL_FIRE_SOURCE.effectiveDate}>{CAL_FIRE_SOURCE.effectiveDate}</time>.</p>
      <p className="caption" role="status">
        {!url ? polygons.length ? "Loaded zones shown. Zoom in to load more detail." : "Zoom in to load mapped zones."
          : !current ? polygons.length ? "Loaded zones shown. Loading more detail..." : "Loading mapped zones..."
          : current.failed ? polygons.length ? "Previously loaded zones. More zones could not be loaded." : "The CAL FIRE layer could not be loaded."
          : current.count === 0 ? "No mapped zones in this requested area."
          : "State Responsibility Areas."}
      </p>
      {current?.failed && <button type="button" className="text-link" onClick={() => setAttempt((value) => value + 1)}>Retry zones</button>}
    </section>
  </>;
}
