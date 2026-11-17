"use client";

import { useState } from "react";
import type { WildfirePoint } from "@/lib/data/wildfire";
import type { MapViewport } from "@/lib/data/wildfire-zones";
import { openFreeMapStyleUrl, project, protomapsStyleUrl, unproject, type MapFailureKind } from "@/lib/map/basemap";
import { useTheme } from "@/components/theme/theme-provider";
import { EchoRasterMap } from "./echo-raster-map";
import { MapLibreSurface } from "./maplibre-surface";
import { WildfireZoneOverlay } from "./wildfire-zone-overlay";
import { EarthquakeMapLayer } from "./earthquake-map-layer";
import type { ObservedEarthquake } from "@/lib/data/earthquakes";

type Props = {
  center: WildfirePoint;
  point: WildfirePoint;
  showWildfireZones: boolean;
  wildfireOpacity?: number;
  onPan: (point: WildfirePoint) => void;
  onSelect: (point: WildfirePoint) => void;
  onMapIssue: (message: string | null) => void;
  earthquakes: readonly ObservedEarthquake[];
  selectedEarthquakeId: string | null;
  onEarthquakeSelect: (id: string) => void;
  onShowEarthquakes: () => void;
  earthquakesStale?: boolean;
  earthquakesCheckedAt?: string;
  focusPoints?: readonly WildfirePoint[];
  focusRevision?: number;
  preparing?: boolean;
};

export function EchoBasemap(props: Props) {
  const { theme } = useTheme();
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [providerFallback, setProviderFallback] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const [viewport, setViewport] = useState<MapViewport>();
  const { center, point, showWildfireZones, onSelect } = props;
  const configuredStyle = protomapsStyleUrl(theme, process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY);
  const style = providerFallback ? openFreeMapStyleUrl(theme) : configuredStyle ?? openFreeMapStyleUrl(theme);
  const pin = viewport ? project(point, viewport.zoom) : null;

  function switchToRasterFallback(message: string, kind?: MapFailureKind) {
    props.onMapIssue(message);
    if (viewport) {
      props.onPan(unproject(
        viewport.left + viewport.width / 2,
        viewport.top + viewport.height / 2,
        viewport.zoom,
      ));
    }
    if (kind === "provider" && configuredStyle && !providerFallback) {
      setProviderFallback(true);
      setMapAttempt((value) => value + 1);
      return;
    }
    setFallbackReason(message);
  }

  return <section className="regional-map echo-basemap" aria-label="ECHO area map" inert={props.preparing}>
    {fallbackReason ? <EchoRasterMap {...props} initialZoom={viewport?.zoom} onViewport={setViewport} /> : <>
    <MapLibreSurface camera={{ longitude: center.longitude, latitude: center.latitude, zoom: 10 }} style={style} center={center}
      onViewport={setViewport} onSelect={onSelect} onFailure={switchToRasterFallback}
      onReady={() => props.onMapIssue(null)} retryKey={mapAttempt} showStatus={false}
      focusPoints={props.focusPoints} focusRevision={props.focusRevision} focusPadding={showWildfireZones ? 160 : 112} />
    {showWildfireZones && viewport && <WildfireZoneOverlay viewport={viewport} opacity={props.wildfireOpacity} />}
    {viewport && pin && <span className="echo-map-pin" aria-hidden="true"
      style={{ left: pin.x - viewport.left, top: pin.y - viewport.top }} />}
    </>}
    {viewport && <EarthquakeMapLayer events={props.earthquakes} viewport={viewport} selectedId={props.selectedEarthquakeId}
      onSelect={props.onEarthquakeSelect} onShowAll={props.onShowEarthquakes} aboveWildfire={showWildfireZones}
      isStale={props.earthquakesStale} checkedAt={props.earthquakesCheckedAt} />}
  </section>;
}
