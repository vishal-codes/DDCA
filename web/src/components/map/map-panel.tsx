"use client";

import { useState } from "react";

export function MapPanel({ children }: { children?: React.ReactNode }) {
  const [zoom, setZoom] = useState(1);
  const [layersOpen, setLayersOpen] = useState(false);
  const [land, setLand] = useState(true);
  const [events, setEvents] = useState(true);

  return (
    <section className="map-panel" aria-label="Illustrative world map. Sample data, not a navigable map.">
      <div className="map-artwork" aria-hidden="true" style={{ transform: `scale(${zoom})` }}>
        {land && <div className="map-land-shapes">{["north-america", "south-america", "europe", "africa", "asia", "islands", "australia"].map((name) => <span key={name} className={`land-shape land-${name}`} />)}</div>}
        {events && <div className="map-events">
          <span className="event-dot event-one" /><span className="event-warning event-two" />
          <span className="event-dot event-three" /><span className="event-watch event-four" />
          <span className="event-dot event-five" /><span className="event-dot event-six" />
          <span className="event-warning event-seven" /><span className="event-watch event-eight" />
          <span className="event-watch event-nine" /><span className="event-watch event-ten" />
        </div>}
      </div>
      {children}
      <div className="map-controls">
        <div className="zoom-controls surface-card">
          <button type="button" aria-label="Enlarge illustration" disabled={zoom >= 1.6} onClick={() => setZoom((value) => Math.min(1.6, value + 0.2))}>+</button>
          <button type="button" aria-label="Reduce illustration" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - 0.2))}>-</button>
        </div>
        <button type="button" className="surface-card layers-trigger" aria-expanded={layersOpen} aria-controls="illustration-layers" onClick={() => setLayersOpen(!layersOpen)}>Layers</button>
        {layersOpen && <fieldset id="illustration-layers" className="surface-card illustration-layers">
          <legend className="sr-only">Illustration layers</legend>
          <label><input type="checkbox" checked={land} onChange={(event) => setLand(event.target.checked)} />Land</label>
          <label><input type="checkbox" checked={events} onChange={(event) => setEvents(event.target.checked)} />Sample events</label>
        </fieldset>}
      </div>
      <div className="surface-card event-legend" aria-label="Sample event legend">
        <strong>Sample events</strong>
        <span className="event-key event-key-clear"><span className="legend-shape" aria-hidden="true" />No alert</span>
        <span className="event-key event-key-watch"><span className="legend-shape" aria-hidden="true" />Watch</span>
        <span className="event-key event-key-warning"><span className="legend-shape" aria-hidden="true" />Warning</span>
        <span className="caption">Sample data</span>
      </div>
      <span className="map-caption caption">Illustrative map</span>
    </section>
  );
}
