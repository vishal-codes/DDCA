"use client";

import { useState } from "react";
import { getSites } from "@/lib/data/workspace";
import { getRegion } from "@/lib/data/regions";
import { initialLayers } from "@/lib/layers";
import type { RegionId } from "@/types/region";
import type { PanelTab } from "@/types/workspace";
import { RegionalMap } from "@/components/map/regional-map";
import { RightPanel } from "@/components/panels/right-panel";
import { useAppShell } from "@/components/shell/app-shell";
import { SiteList } from "./site-list";
import { SeraActions } from "./sera-actions";
import { SeraControls, type SeraStep } from "./sera-controls";

const steps: SeraStep[] = ["Region", "Scenario", "Settings", "Results"];
export function SeraScreen({ regionId }: { regionId: RegionId }) {
  const [tab, setTab] = useState<PanelTab>("Analysis");
  const [step, setStep] = useState<SeraStep>("Results");
  const [selected, setSelected] = useState("PY");
  const [excluded, setExcluded] = useState(false);
  const [refreshPreview, setRefreshPreview] = useState(true);
  const [layers, setLayers] = useState(() => initialLayers(regionId));
  const { previewState } = useAppShell();
  const sites = getSites(regionId);
  return <div className="workspace-grid">
    <RegionalMap onLayers={() => setTab("Layers")} layers={regionId === "los-angeles" ? layers : undefined}>
      <h1 className="sr-only">SERA - {getRegion(regionId).name}</h1>
      <div className="sera-top-controls"><section className="surface-card sera-steps"><div>{steps.map((item) => <button type="button" key={item} aria-pressed={step === item} onClick={() => setStep(item)}>{item}</button>)}</div><p className="caption">{getRegion(regionId).name}. Wildfire design sample. Coverage areas are estimated.</p></section>
        <section className="surface-card refresh-card"><h2>{previewState === "offline" ? "Cached sample" : refreshPreview ? "Refresh layout preview" : "Cached sample result"}</h2>{refreshPreview && previewState !== "offline" && <div className="sample-progress" aria-label="Illustrative refresh progress"><span /></div>}
          <p className="caption">Fixed sample results stay visible. No calculation is running.</p><button type="button" className="text-link" disabled={previewState === "offline"} onClick={() => setRefreshPreview(!refreshPreview)}>{refreshPreview ? "Show cached sample" : "Preview refresh layout"}</button>
        </section>
      </div>
      <div className="regional-scene site-scene">
        {sites.map((site) => <div key={site.id} className={`site-illustration site-${site.id.toLowerCase()}${selected === site.id ? " is-selected" : ""}${excluded && site.id === "PY" ? " site-excluded" : ""}`}>
          {layers.population.enabled && <span className="coverage-shape" style={{ opacity: layers.population.opacity / 100 }} aria-hidden="true" />}
          <button className="site-marker" type="button" style={{ left: `${site.left}%`, top: `${site.top}%` }} aria-pressed={selected === site.id} aria-label={`Select ${site.name}`} onClick={() => setSelected(site.id)}>{site.id}</button>
        </div>)}
        {layers.hazardMaps.enabled && sites.length > 0 && <span className="sera-hazard-area" style={{ opacity: layers.hazardMaps.opacity / 100 }} aria-label="Sample official hazard zone" />}
      </div>
      <SeraControls step={step} excluded={excluded} onExcluded={setExcluded} available={sites.length > 0} />
    </RegionalMap>
    <RightPanel tab={tab} onTab={setTab} regionId={regionId} layers={layers} onLayerChange={(kind, patch) => setLayers((value) => ({ ...value, [kind]: { ...value[kind], ...patch } }))}>
      <SiteList sites={sites} selected={selected} excluded={excluded} onSelect={setSelected} /><SeraActions sites={sites} />
    </RightPanel>
  </div>;
}
