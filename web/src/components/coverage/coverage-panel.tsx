"use client";

import { getRegion, getRegionCoverage } from "@/lib/data/regions";
import { formatSampleDate } from "@/lib/format-date";
import type { RegionId } from "@/types/region";
import { Dialog } from "@/components/shared/dialog";
import { StatusChip } from "@/components/shared/status-chip";
import { DataAgeChip } from "@/components/shared/data-age-chip";

export function CoveragePanel({ regionId, onClose }: { regionId: RegionId | null; onClose: () => void }) {
  const region = regionId ? getRegion(regionId) : null;
  return (
    <Dialog title="Data in this area" kind="coverage" onClose={onClose}>
      <p className="coverage-summary">{region ? `${region.name}, ${region.location}` : "Choose a region to view its data coverage."}</p>
      <p className="sample-note">Sample data. Statuses and dates illustrate the design; no feed is connected.</p>
      {regionId && (
        <div className="table-scroll">
          <table className="coverage-table">
            <caption className="sr-only">Sample data coverage for {region?.name}</caption>
            <thead><tr><th scope="col">Data</th><th scope="col">Status</th><th scope="col">Source</th><th scope="col">Date</th></tr></thead>
            <tbody>{getRegionCoverage(regionId).map((entry) => (
              <tr key={entry.kind} className={entry.status === "not_available" ? "unavailable-row" : undefined}>
                <th scope="row">{entry.label}</th>
                <td><StatusChip status={entry.status} />
                  {entry.ageLabel && <DataAgeChip updatedAt={entry.updatedAt} label={entry.ageLabel} isStale={entry.isStale} />}
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
