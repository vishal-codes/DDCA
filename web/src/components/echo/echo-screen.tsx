"use client";

import { useState } from "react";
import { getZones, getEchoSummary } from "@/lib/data/workspace";
import { getRegion } from "@/lib/data/regions";
import { initialLayers } from "@/lib/layers";
import type { RegionId } from "@/types/region";
import type { PanelTab } from "@/types/workspace";
import { useAppShell } from "@/components/shell/app-shell";
import { RegionalMap } from "@/components/map/regional-map";
import { RightPanel } from "@/components/panels/right-panel";
import { MetricCard } from "@/components/shared/metric-card";
import { RiskChip } from "@/components/shared/risk-chip";
import { SourceTag } from "@/components/shared/source-tag";
import { SampleCitation } from "@/components/shared/sample-citation";
import { ZoneTable } from "./zone-table";

export function EchoScreen({ regionId }: { regionId: RegionId }) {
  const { previewState, openCoverage } = useAppShell();
  const [tab, setTab] = useState<PanelTab>(regionId === "jakarta" ? "Layers" : "Analysis");
  const [selected, setSelected] = useState("A");
  const [layers, setLayers] = useState(() => initialLayers(regionId));
  const zones = getZones(regionId);
  const zone = zones.find((entry) => entry.id === selected)!;
  const summary = getEchoSummary(regionId, previewState);
  const region = getRegion(regionId);
  return <div className="workspace-grid">
    <RegionalMap onLayers={() => setTab("Layers")} layers={regionId === "los-angeles" ? layers : undefined}>
      <h1 className="sr-only">ECHO - {region.name}</h1>
      <div className="metric-row">
        <MetricCard title="Active alerts" value={summary.alerts} sourceName={regionId === "los-angeles" ? "NWS (design sample)" : "Source undecided"} updatedAt={summary.updatedAt} kind="Measured" isStale={summary.stale} />
        <MetricCard title="People in high-risk zones" value={summary.exposure} sourceName={summary.sourceName} updatedAt={summary.updatedAt} kind="Modeled" isStale={summary.stale} />
        <section className="surface-card metric-card"><h2 className="caption">Data coverage</h2><p className="metric-value">Per-source status</p><p className="caption">Availability varies by kind of data.</p><button type="button" className="text-link" onClick={openCoverage} aria-haspopup="dialog">Data in this area</button></section>
      </div>
      <div className="regional-scene zone-scene" style={{ opacity: layers.hazardMaps.enabled ? layers.hazardMaps.opacity / 100 : 0, pointerEvents: layers.hazardMaps.enabled ? "auto" : "none" }}>
        {zones.map((entry) => <button type="button" key={entry.id} className={`zone-shape zone-${entry.id.toLowerCase()}${selected === entry.id ? " is-selected" : ""}${entry.risk ? ` zone-risk-${entry.risk.toLowerCase()}` : " zone-missing"}`} style={{ left: entry.position.left, top: entry.position.top, width: entry.position.width, height: entry.position.height }} onClick={() => setSelected(entry.id)} aria-label={`Zone ${entry.id}, ${entry.risk ?? "Not enough data"}`} aria-pressed={selected === entry.id} tabIndex={layers.hazardMaps.enabled ? 0 : -1}>
          <span className="zone-fill" style={{ clipPath: entry.position.polygon }} aria-hidden="true" />
          {layers.population.enabled && entry.risk && <span className="zone-fill population-pattern" style={{ clipPath: entry.position.polygon, opacity: layers.population.opacity / 100 }} aria-hidden="true" />}<span className="zone-marker">{entry.id}</span>
        </button>)}
      </div>
      <section className="surface-card zone-detail" aria-live="polite"><h2>Zone {zone.id}</h2>
        {zone.risk ? <RiskChip level={zone.risk} /> : <p className="missing-value">Not enough data</p>}
        <p className={zone.risk ? undefined : "missing-value"}>People exposed: {zone.exposure} {zone.risk && <SourceTag kind="Modeled" />}</p>
        {zone.risk && <p>Hazard zone <SourceTag kind={zone.kind} /></p>}
        <SampleCitation sourceName={zone.sourceName} updatedAt={zone.updatedAt} />
        <p className="caption">Exposure: design reference; population dataset undecided.</p>
      </section>
    </RegionalMap>
    <RightPanel tab={tab} onTab={setTab} regionId={regionId} layers={layers} onLayerChange={(kind, patch) => setLayers((value) => ({ ...value, [kind]: { ...value[kind], ...patch } }))}>
      <ZoneTable zones={zones} selected={selected} onSelect={setSelected} />
    </RightPanel>
  </div>;
}
