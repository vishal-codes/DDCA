"use client";

import { useState } from "react";
import { MapLegend } from "./map-legend";
import type { LayerState } from "@/types/layers";

export function RegionalMap({ children, onLayers, showLegend = true, layers }: { children: React.ReactNode; onLayers: () => void; showLegend?: boolean; layers?: LayerState }) {
  const [zoomStep, setZoomStep] = useState(0);
  return <section className={`regional-map regional-zoom-${zoomStep}`} aria-label="Sample regional map illustration">
    <div className="regional-base" aria-hidden="true"><span className="regional-terrain" /><span className="regional-water" />{["a", "b", "c", "d"].map((id) => <span key={id} className={`base-road base-road-${id}`} />)}</div>
    {layers?.alerts.enabled && <span className="sample-map-alert" style={{ opacity: layers.alerts.opacity / 100 }} aria-label="Sample alert location">!</span>}
    {layers?.roadClosures.enabled && <span className="sample-closure" style={{ opacity: layers.roadClosures.opacity / 100 }} aria-label="Sample road closure">-</span>}
    {layers?.evacuationZones.enabled && <span className="sample-evacuation" style={{ opacity: layers.evacuationZones.opacity / 100 }} aria-label="Sample evacuation boundary" />}
    {children}
    <div className="map-controls"><div className="zoom-controls surface-card">
      <button type="button" aria-label="Enlarge sample map" disabled={zoomStep === 2} onClick={() => setZoomStep((value) => value + 1)}>+</button>
      <button type="button" aria-label="Reduce sample map" disabled={zoomStep === 0} onClick={() => setZoomStep((value) => value - 1)}>-</button>
    </div><button type="button" className="surface-card layers-trigger" onClick={onLayers}>Layers</button></div>
    {showLegend && <MapLegend />}<span className="map-caption caption">Sample data. Illustrative map.</span>
  </section>;
}
