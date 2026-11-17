"use client";

import { useEffect, useRef, useState } from "react";
import { EARTHQUAKE_SOURCE } from "@/lib/data/earthquakes";
import type { EchoPointResult } from "@/lib/data/echo-point";
import { formatSampleDate } from "@/lib/format-date";
import { DataAgeChip } from "@/components/shared/data-age-chip";

export function EarthquakeFindings({ source, selectedId, onSelect, onShowAll }: {
  source: EchoPointResult["earthquake"]; selectedId?: string | null; onSelect?: (id: string) => void; onShowAll?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedRow = useRef<HTMLLIElement>(null);
  useEffect(() => { selectedRow.current?.scrollIntoView({ block: "nearest" }); }, [selectedId]);
  if (!source || source.status !== "checked" || source.data.events.length === 0) return null;
  const visible = expanded ? source.data.events : source.data.events.slice(0, 5);
  const selected = source.data.events.find((event) => event.id === selectedId);
  const events = selected && !visible.includes(selected) ? [...visible, selected] : visible;
  return <section className="evidence-entry">
    <h3>Recorded earthquakes nearby</h3>
    <span className="chip source-tag">Observed</span>
    <>
      <p>{source.data.events.length >= source.data.limit ? "At least " : ""}{source.data.events.length} events returned.</p>
      <p className="caption">Within {source.data.radiusKm} km, magnitude {source.data.minimumMagnitude} and above,
        {" "}since <time dateTime={source.data.since}>{formatSampleDate(source.data.since)}</time>.</p>
      {onShowAll && <button className="text-link" type="button" onClick={onShowAll}>Show all events on map</button>}
      <ul className="echo-alert-list">
        {events.map((event) => <li key={event.id} ref={event.id === selectedId ? selectedRow : undefined}
          className={event.id === selectedId ? "selected-earthquake" : undefined} aria-current={event.id === selectedId ? "true" : undefined}>
          <a className="text-link" href={event.url} target="_blank" rel="noopener noreferrer">{event.title}</a>
          <p className="caption">USGS. <time dateTime={event.occurredAt}>{formatSampleDate(event.occurredAt)}</time>.</p>
          {onSelect && <button type="button" className="text-link" aria-pressed={event.id === selectedId}
            onClick={() => onSelect(event.id)}>Show on map</button>}
        </li>)}
      </ul>
      {source.data.events.length > 5 && <button className="text-link" type="button" aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}>{expanded ? "Show latest five" : "Show all returned events"}</button>}
      <p className="caption">Checked <DataAgeChip updatedAt={source.checkedAt} isStale={source.isStale} /></p>
      {source.staleReason && <p className="caption">{source.staleReason}</p>}
    </>
    {source.data.catalogUrl
      ? <a className="text-link" href={source.data.catalogUrl} target="_blank" rel="noopener noreferrer">{EARTHQUAKE_SOURCE.name} - selected area</a>
      : <p>{EARTHQUAKE_SOURCE.name}</p>}
    <p className="caption">Recorded events describe earthquake history. A shaking hazard level needs a separate model.</p>
  </section>;
}
