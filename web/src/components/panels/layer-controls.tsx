"use client";

import { getRegionCoverage } from "@/lib/data/regions";
import { useAppShell } from "@/components/shell/app-shell";
import { StatusChip } from "@/components/shared/status-chip";
import { formatSampleDate } from "@/lib/format-date";
import type { RegionId } from "@/types/region";
import type { CoverageKind } from "@/types/coverage";
import type { LayerState } from "@/types/layers";

export function LayerControls({ regionId, layers, onChange }: { regionId: RegionId; layers: LayerState; onChange: (kind: CoverageKind, patch: Partial<LayerState[CoverageKind]>) => void }) {
  const { previewState } = useAppShell();
  return <div className="layer-controls"><h2>Layers</h2><p className="sample-note">Sample data. Controls change the illustration only.</p>
    {getRegionCoverage(regionId, previewState).map((entry) => {
      const unavailable = entry.status === "not_available";
      return <fieldset key={entry.kind} disabled={unavailable} className={unavailable ? "layer-unavailable" : ""}>
        <legend className="sr-only">{entry.label}</legend>
        <div className="layer-label"><label><input type="checkbox" checked={layers[entry.kind].enabled} onChange={(event) => onChange(entry.kind, { enabled: event.target.checked })} />{entry.label}</label><StatusChip status={entry.status} /></div>
        <input type="range" aria-label={`${entry.label} opacity`} aria-valuetext={`${layers[entry.kind].opacity} percent`} min="0" max="100" step="10" value={layers[entry.kind].opacity} disabled={unavailable || !layers[entry.kind].enabled} onChange={(event) => onChange(entry.kind, { opacity: Number(event.target.value) })} />
        <p className="caption">{entry.sourceName}. {entry.updatedAt ? formatSampleDate(entry.updatedAt, entry.datePrecision) : "Not enough data"}.</p>
      </fieldset>;
    })}
  </div>;
}
