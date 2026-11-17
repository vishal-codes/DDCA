import type { ObservedEarthquake } from "@/lib/data/earthquakes";
import type { MapViewport } from "@/lib/data/wildfire-zones";
import { project, worldSize } from "@/lib/map/basemap";
import { formatSampleDate } from "@/lib/format-date";

export function EarthquakeMapLayer({ events, viewport, selectedId, onSelect, onShowAll, aboveWildfire = false, isStale = false, checkedAt }: {
  events: readonly ObservedEarthquake[]; viewport: MapViewport; selectedId?: string | null;
  onSelect: (id: string) => void; onShowAll: () => void; aboveWildfire?: boolean; isStale?: boolean; checkedAt?: string;
}) {
  if (!events.length || viewport.width <= 0 || viewport.height <= 0) return null;
  const world = worldSize(viewport.zoom);
  return <>
    <div className="earthquake-map-markers" role="group" aria-label="Observed earthquake locations">
      {events.map((event) => {
        const position = project(event, viewport.zoom);
        const x = position.x + Math.round((viewport.left + viewport.width / 2 - position.x) / world) * world - viewport.left;
        const y = position.y - viewport.top;
        if (x < -22 || y < -22 || x > viewport.width + 22 || y > viewport.height + 22) return null;
        const label = `${event.title}. USGS. ${formatSampleDate(event.occurredAt)}. Select earthquake.`;
        return <button key={event.id} type="button" className="earthquake-map-marker"
          style={{ left: x, top: y }} aria-label={label} title={label} aria-pressed={selectedId === event.id}
          onClick={(click) => { click.stopPropagation(); onSelect(event.id); }}>
          <span className="earthquake-marker-symbol" aria-hidden="true" />
          <span className="earthquake-marker-label" aria-hidden="true">{event.magnitude === null ? "Earthquake" : `M ${event.magnitude.toFixed(1)}`}</span>
        </button>;
      })}
    </div>
    <section className={`surface-card earthquake-map-legend${aboveWildfire ? " above-wildfire" : ""}${isStale ? " is-stale" : ""}`} aria-label="Earthquake legend">
      <span className="earthquake-marker-symbol" aria-hidden="true" />
      <div><strong>Observed earthquake epicenters</strong>
        <p className="caption">USGS{checkedAt ? `. Checked ${formatSampleDate(checkedAt)}.` : "."}{isStale ? " May be out of date." : ""}</p>
      </div>
      <button type="button" className="text-link" onClick={onShowAll}>Show all events</button>
    </section>
  </>;
}
