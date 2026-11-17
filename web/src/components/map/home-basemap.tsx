"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { openFreeMapStyleUrl, project, protomapsStyleUrl, unproject } from "@/lib/map/basemap";
import { HOME_CAMERA, REGION_CAMERAS } from "@/lib/map/cameras";
import { getRegions } from "@/lib/data/regions";
import type { MapViewport } from "@/lib/data/wildfire-zones";
import { useTheme } from "@/components/theme/theme-provider";
import { useAppShell } from "@/components/shell/app-shell";
import { MapLibreSurface } from "./maplibre-surface";
import { MapPanel } from "./map-panel";
import { EchoRasterMap } from "./echo-raster-map";

export function HomeBasemap({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const router = useRouter();
  const { previewState, selectRegion } = useAppShell();
  const layersId = useId();
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [rasterFailure, setRasterFailure] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [retry, setRetry] = useState(0);
  const [camera, setCamera] = useState(HOME_CAMERA);
  const [viewport, setViewport] = useState<MapViewport>();
  const [layersOpen, setLayersOpen] = useState(false);
  const [showRegions, setShowRegions] = useState(true);
  const primaryStyle = protomapsStyleUrl(theme, process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY);
  const usingFallback = !primaryStyle || fallback;
  const style = usingFallback ? openFreeMapStyleUrl(theme) : primaryStyle;
  const provider = rasterFailure ? "OpenStreetMap" : usingFallback ? "OpenFreeMap" : "Protomaps";

  function keepCamera() {
    if (viewport) {
      const center = unproject(viewport.left + viewport.width / 2, viewport.top + viewport.height / 2, viewport.zoom);
      setCamera({ ...center, zoom: viewport.zoom - 1 });
    }
  }

  function retryMap() {
    keepCamera();
    setRasterFailure(null);
    setFallbackReason(null);
    setFallback(false);
    setRetry((value) => value + 1);
  }

  if (previewState === "offline") {
    return <MapPanel>{children}
      <p className="surface-card basemap-notice" role="status">Offline preview. Sample map.</p>
    </MapPanel>;
  }

  return <section className="map-panel" aria-label="World map">
    {rasterFailure ? <EchoRasterMap center={camera} point={camera} initialZoom={camera.zoom + 1}
      showWildfireZones={false} showPoint={false} mapLabel="World map"
      onViewport={setViewport} onPan={(center) => setCamera((value) => ({ ...value, ...center }))}
      onSelect={(point) => router.push(`/echo?latitude=${point.latitude.toFixed(5)}&longitude=${point.longitude.toFixed(5)}`)}
      onLayers={() => setLayersOpen((value) => !value)} />
      : <MapLibreSurface key={`${provider}-${retry}`} camera={camera} style={style}
      onViewport={setViewport}
      onSelect={(point) => router.push(`/echo?latitude=${point.latitude.toFixed(5)}&longitude=${point.longitude.toFixed(5)}`)}
      onFailure={(message, kind) => {
        if (!usingFallback && kind === "provider") {
          keepCamera();
          setFallbackReason(message);
          setFallback(true);
          setViewport(undefined);
        } else {
          keepCamera();
          setRasterFailure(message);
        }
      }} />}
    {showRegions && viewport && <div className="home-map-regions" role="group" aria-label="Available regions">
      {getRegions().map((region) => {
        const location = project(REGION_CAMERAS[region.id], viewport.zoom);
        const left = location.x - viewport.left;
        const top = location.y - viewport.top;
        if (left < 0 || left > viewport.width || top < 0 || top > viewport.height) return null;
        return <button type="button" key={region.id} className="home-region-marker"
          style={{ left, top }} aria-label={`Open ${region.name} ECHO`} onClick={() => selectRegion(region.id)}>
          <span aria-hidden="true" />{region.name}
        </button>;
      })}
    </div>}
    {children}
    {!rasterFailure && <button type="button" className="surface-card layers-trigger maplibre-layers-trigger"
      aria-expanded={layersOpen} aria-controls={layersId} onClick={() => setLayersOpen((value) => !value)}>Layers</button>}
    {layersOpen && <fieldset id={layersId} className="surface-card home-map-layers">
      <legend className="sr-only">Map layers</legend>
      <p className="caption">Basemap by {provider}</p>
      <label className="checkbox-label"><input type="checkbox" checked={showRegions}
        onChange={(event) => setShowRegions(event.target.checked)} />Region links</label>
      <p className="caption">Open a region or click a point for its ECHO findings.</p>
    </fieldset>}
    <section className="surface-card home-map-provider" aria-label="Basemap provider">
      <span>Basemap by {provider}</span>
      {(rasterFailure || fallbackReason) && <p role="status">{rasterFailure ?? fallbackReason}</p>}
      {rasterFailure ? <button type="button" className="text-link" onClick={retryMap}>Retry interactive map</button>
        : usingFallback && primaryStyle && <button type="button" className="text-link" onClick={retryMap}>Retry Protomaps</button>}
    </section>
  </section>;
}
