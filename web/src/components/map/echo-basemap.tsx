"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { project, unproject, USGS_TOPO, visibleTiles } from "@/lib/map/basemap";
import type { WildfirePoint } from "@/lib/data/wildfire";
import { WildfireZoneOverlay } from "./wildfire-zone-overlay";

const minZoom = 7;
const maxZoom = 16;

type Drag = { pointerId: number; x: number; y: number; center: { x: number; y: number }; moved: boolean };

export function EchoBasemap({ center, point, showWildfireZones, onPan, onSelect, onLayers }: {
  center: WildfirePoint;
  point: WildfirePoint;
  showWildfireZones: boolean;
  onPan: (point: WildfirePoint) => void;
  onSelect: (point: WildfirePoint) => void;
  onLayers: () => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(11);
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

  const pixels = project(center, zoom);
  const left = Math.round(pixels.x - size.width / 2);
  const top = Math.round(pixels.y - size.height / 2);
  const pin = project(point, zoom);
  const tiles = visibleTiles(zoom, left, top, size.width, size.height);
  const hasFailedTile = tiles.some((tile) => failed.has(tile.key));

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

  return <section className="regional-map echo-basemap" aria-label="California wildfire map">
    <div ref={viewport} className="echo-map-viewport" role="region" tabIndex={0}
      aria-label="Point selection map. Use arrows to pan, plus and minus to zoom, and Enter to check the map center."
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}
      onLostPointerCapture={() => { drag.current = null; }} onKeyDown={onKeyDown}>
      <div className="echo-map-tiles" aria-hidden="true" key={retry}>
        {tiles.map((tile) => (
          // eslint-disable-next-line @next/next/no-img-element -- Map tiles have fixed dimensions and load directly from the provider.
          <img key={tile.key} src={tile.url} alt="" width={USGS_TOPO.tileSize} height={USGS_TOPO.tileSize}
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
      <span className="echo-map-pin" aria-hidden="true" style={{ left: pin.x - left, top: pin.y - top }} />
    </div>
    {showWildfireZones && <WildfireZoneOverlay viewport={{ zoom, left, top, ...size }} />}
    <div className="surface-card echo-map-guide">
      <h1>ECHO - California wildfire</h1>
      <p className="caption">Click the map to check a point. Drag to pan.</p>
      {hasFailedTile && <p role="status" className="caption">Some map tiles could not load. <button type="button" className="text-link" onClick={() => {
        setFailed(new Set()); setRetry((value) => value + 1);
      }}>Retry map</button></p>}
    </div>
    <div className="map-controls">
      <div className="zoom-controls surface-card">
        <button type="button" aria-label="Zoom in" disabled={zoom === maxZoom} onClick={() => zoomBy(1)}>+</button>
        <button type="button" aria-label="Zoom out" disabled={zoom === minZoom} onClick={() => zoomBy(-1)}>-</button>
      </div>
      <button type="button" className="surface-card layers-trigger" onClick={onLayers}>Layers</button>
    </div>
    <a className="surface-card echo-map-credit" href={USGS_TOPO.url} target="_blank" rel="noopener noreferrer">{USGS_TOPO.name}</a>
  </section>;
}
