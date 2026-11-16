"use client";

import { getRegion, getRegionCoverage } from "@/lib/data/regions";
import { formatSampleDate } from "@/lib/format-date";
import type { RegionId } from "@/types/region";
import { Dialog } from "@/components/shared/dialog";
import { StatusChip } from "@/components/shared/status-chip";
import { DataAgeChip } from "@/components/shared/data-age-chip";
import type { PreviewState } from "@/types/workspace";
import { CAL_FIRE_SOURCE } from "@/lib/data/wildfire";
import { NWS_SOURCE } from "@/lib/data/nws-alerts";

export function CoveragePanel({ regionId, previewState = "normal", liveEcho = false, onClose }: { regionId: RegionId | null; previewState?: PreviewState; liveEcho?: boolean; onClose: () => void }) {
  const region = regionId ? getRegion(regionId) : null;
  if (liveEcho) {
    return <Dialog title="Data in this area" kind="coverage" onClose={onClose}>
      <p className="coverage-summary">Los Angeles area. Check Analysis for results and source times at the selected point.</p>
      <section className="evidence-entry">
        <h3>Weather alerts</h3><StatusChip status="live" />
        <p><a className="text-link" href={NWS_SOURCE.url}>{NWS_SOURCE.name}</a></p>
      </section>
      <section className="evidence-entry">
        <h3>Wildfire hazard</h3><StatusChip status="static_map" />
        <p><a className="text-link" href={CAL_FIRE_SOURCE.mapUrl}>{CAL_FIRE_SOURCE.name}</a></p>
        <p className="caption">Effective <time dateTime={CAL_FIRE_SOURCE.effectiveDate}>{CAL_FIRE_SOURCE.effectiveDate}</time>.</p>
      </section>
      <section className="evidence-entry">
        <h3>Road closures, evacuation zones, population and other hazards</h3><StatusChip status="not_available" />
      </section>
    </Dialog>;
  }
  return (
    <Dialog title="Data in this area" kind="coverage" onClose={onClose}>
      <p className="coverage-summary">{region ? `${region.name}, ${region.location}` : "Choose a region to view its data coverage."}</p>
      <p className="sample-note">Sample data. Statuses and dates illustrate the design; no feed is connected.</p>
      {regionId && (
        <div className="table-scroll">
          <table className="coverage-table">
            <caption className="sr-only">Sample data coverage for {region?.name}</caption>
            <thead><tr><th scope="col">Data</th><th scope="col">Status</th><th scope="col">Source</th><th scope="col">Date</th></tr></thead>
            <tbody>{getRegionCoverage(regionId, previewState).map((entry) => (
              <tr key={entry.kind} className={entry.status === "not_available" ? "unavailable-row" : undefined}>
                <th scope="row">{entry.label}</th>
                <td><StatusChip status={entry.status} />
                  {(entry.ageLabel || entry.isStale) && <DataAgeChip updatedAt={entry.updatedAt} label={entry.ageLabel ?? undefined} isStale={entry.isStale} />}
                </td>
                <td>{entry.sourceName}</td>
                <td>{entry.updatedAt ? <time dateTime={entry.updatedAt}>{formatSampleDate(entry.updatedAt, entry.datePrecision)}</time> : "Not enough data"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p className="caption">Coverage is shown separately for each kind of data. Missing data is never treated as zero.</p>
    </Dialog>
  );
}
