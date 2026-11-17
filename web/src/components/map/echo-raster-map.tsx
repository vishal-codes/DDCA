"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { fitMapPoints, OSM_RASTER, project, unproject, visibleTiles } from "@/lib/map/basemap";
import type { WildfirePoint } from "@/lib/data/wildfire";
import type { MapViewport } from "@/lib/data/wildfire-zones";
import { WildfireZoneOverlay } from "./wildfire-zone-overlay";

const minZoom = 1;
const maxZoom = 16;

type Drag = { pointerId: number; x: number; y: number; center: { x: number; y: number }; moved: boolean };

export function EchoRasterMap({ center, point, showWildfireZones, wildfireOpacity, initialZoom = 11, showPoint = true, mapLabel = "ECHO area map", onViewport, onPan, onSelect, onLayers, focusPoints, focusRevision = 0 }: {
  center: WildfirePoint;
  point: WildfirePoint;
  showWildfireZones: boolean;
  wildfireOpacity?: number;
  initialZoom?: number;
  showPoint?: boolean;
  mapLabel?: string;
  onViewport?: (viewport: MapViewport) => void;
  onPan: (point: WildfirePoint) => void;
  onSelect: (point: WildfirePoint) => void;
  onLayers?: () => void;
  focusPoints?: readonly WildfirePoint[];
  focusRevision?: number;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(() => Math.max(minZoom, Math.min(maxZoom, Math.round(initialZoom))));
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(viewport.current!);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!focusPoints?.length) return;
    const view = fitMapPoints(focusPoints, size.width, size.height, showWildfireZones ? 160 : 112);
    if (!view) return;
    const frame = window.requestAnimationFrame(() => { setZoom(Math.floor(view.zoom)); onPan(view.center); });
    return () => window.cancelAnimationFrame(frame);
  }, [focusPoints, size.width, size.height, onPan, focusRevision, showWildfireZones]);

  const pixels = project(center, zoom);
  const left = Math.round(pixels.x - size.width / 2);
  const top = Math.round(pixels.y - size.height / 2);
  const pin = project(point, zoom);
  const tiles = visibleTiles(zoom, left, top, size.width, size.height, "osm");
  const hasFailedTile = tiles.some((tile) => failed.has(tile.key));

  useEffect(() => {
    onViewport?.({ zoom, left, top, ...size });
  }, [zoom, left, top, size, onViewport]);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, center: pixels, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (start?.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < 5) return;
    start.moved = true;
    onPan(unproject(start.center.x - dx, start.center.y - dy, zoom));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (start?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (start.moved) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    onSelect(unproject(left + event.clientX - bounds.left, top + event.clientY - bounds.top, zoom));
  }

  function zoomBy(amount: number) {
    setZoom((value) => Math.max(minZoom, Math.min(maxZoom, value + amount)));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const offsets: Record<string, [number, number]> = {
      ArrowLeft: [-80, 0], ArrowRight: [80, 0], ArrowUp: [0, -80], ArrowDown: [0, 80],
    };
    const offset = offsets[event.key];
    if (offset && Array.isArray(offset)) onPan(unproject(pixels.x + offset[0], pixels.y + offset[1], zoom));
    else if (event.key === "Enter") onSelect(center);
    else if (event.key === "+" || event.key === "=") zoomBy(1);
    else if (event.key === "-") zoomBy(-1);
    else return;
    event.preventDefault();
  }

  function markFailed(key: string) {
    setFailed((previous) => new Set(previous).add(key));
  }

  return <section className="regional-map echo-basemap" aria-label={mapLabel}>
    <div ref={viewport} className="echo-map-viewport" role="region" tabIndex={0}
      aria-label="Point selection map. Use arrows to pan, plus and minus to zoom, and Enter to check the map center."
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}
      onPointerCancel={() => { drag.current = null; }}
      onLostPointerCapture={() => { drag.current = null; }} onKeyDown={onKeyDown}>
      <div className="echo-map-tiles" aria-hidden="true" key={retry}>
        {tiles.map((tile) => (
          // eslint-disable-next-line @next/next/no-img-element -- Map tiles have fixed dimensions and load directly from the provider.
          <img key={tile.key} src={tile.url} alt="" width={OSM_RASTER.tileSize} height={OSM_RASTER.tileSize}
            draggable={false} style={{ left: tile.left, top: tile.top, visibility: failed.has(tile.key) ? "hidden" : undefined }}
            onError={() => markFailed(tile.key)} onLoad={() => {
              setFailed((previous) => {
                if (!previous.has(tile.key)) return previous;
                const next = new Set(previous);
                next.delete(tile.key);
                return next;
              });
            }} />
        ))}
      </div>
      {showPoint && <span className="echo-map-pin" aria-hidden="true" style={{ left: pin.x - left, top: pin.y - top }} />}
    </div>
    {showWildfireZones && <WildfireZoneOverlay viewport={{ zoom, left, top, ...size }} opacity={wildfireOpacity} />}
    {hasFailedTile && <p role="status" className="surface-card native-map-error caption">
      Some map tiles could not load. <button type="button" className="text-link" onClick={() => {
        setFailed(new Set()); setRetry((value) => value + 1);
      }}>Retry map</button>
    </p>}
    <div className="map-controls">
      <div className="zoom-controls surface-card">
        <button type="button" aria-label="Zoom in" disabled={zoom === maxZoom} onClick={() => zoomBy(1)}>+</button>
        <button type="button" aria-label="Zoom out" disabled={zoom === minZoom} onClick={() => zoomBy(-1)}>-</button>
      </div>
      {onLayers && <button type="button" className="surface-card layers-trigger" onClick={onLayers}>Layers</button>}
    </div>
    <a className="surface-card echo-map-credit" href={OSM_RASTER.attributionUrl} target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>
  </section>;
}
