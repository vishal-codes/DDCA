"use client";

import { useId, useState } from "react";
import { getRegionCoverage } from "@/lib/data/regions";
import { useAppShell } from "@/components/shell/app-shell";
import { StatusChip } from "@/components/shared/status-chip";
import { DataAgeChip } from "@/components/shared/data-age-chip";
import { formatSampleDate } from "@/lib/format-date";
import { LayerControls } from "./layer-controls";
import type { RegionId } from "@/types/region";
import type { PanelTab } from "@/types/workspace";
import type { CoverageKind } from "@/types/coverage";
import type { LayerState } from "@/types/layers";

const tabs: PanelTab[] = ["Layers", "Analysis", "Evidence", "Notes"];
export function RightPanel({ tab, onTab, regionId, layers, onLayerChange, children }: {
  tab: PanelTab; onTab: (tab: PanelTab) => void; regionId: RegionId; layers: LayerState;
  onLayerChange: (kind: CoverageKind, patch: Partial<LayerState[CoverageKind]>) => void; children: React.ReactNode;
}) {
  const id = useId();
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const { previewState } = useAppShell();
  return <aside className="right-panel" aria-label="Workspace details">
    <div role="tablist" aria-label="Details" className="panel-tabs">{tabs.map((item, index) => <button key={item} type="button" role="tab" id={`${id}-${item}`} aria-selected={tab === item} aria-controls={`${id}-content`} tabIndex={tab === item ? 0 : -1} onClick={() => onTab(item)} onKeyDown={(event) => {
      const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
      if (next !== null) { event.preventDefault(); onTab(tabs[next]); document.getElementById(`${id}-${tabs[next]}`)?.focus(); }
    }}>{item}</button>)}</div>
    <div id={`${id}-content`} role="tabpanel" aria-labelledby={`${id}-${tab}`} className="panel-content">
      {tab === "Analysis" && children}
      {tab === "Layers" && <LayerControls regionId={regionId} layers={layers} onChange={onLayerChange} />}
      {tab === "Evidence" && <><h2>Sources and dates</h2><p className="sample-note">Sample data. No live sources are connected.</p>{getRegionCoverage(regionId, previewState).map((entry) => <section className="evidence-entry" key={entry.kind}>
        <h3>{entry.label}</h3><StatusChip status={entry.status} /><p>{entry.sourceName}</p>
        <p className="caption">{entry.updatedAt ? formatSampleDate(entry.updatedAt, entry.datePrecision) : "Not enough data"}</p>
        {entry.updatedAt && <DataAgeChip updatedAt={entry.updatedAt} isStale={entry.isStale} label="Sample snapshot" />}
      </section>)}</>}
      {tab === "Notes" && <><h2>Notes</h2><p>Official alerts and orders take priority. Map shapes and results are illustrative.</p>
        <label className="notes-label">Your note<textarea value={note} onChange={(event) => { setNote(event.target.value); setSaved(false); }} placeholder="Add a note for this visit" rows={6} /></label>
        <button type="button" className="primary-button" onClick={() => setSaved(true)}>Keep note</button>
        <p className="caption" role="status">{saved ? "Note kept for this visit only." : "Notes are not sent or stored on a server."}</p>
      </>}
    </div>
  </aside>;
}
