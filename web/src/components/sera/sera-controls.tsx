"use client";

import { useState } from "react";
import { getLossSample } from "@/lib/data/workspace";
import { SampleCitation } from "@/components/shared/sample-citation";
import { RegionSearch } from "@/components/shell/region-search";

export type SeraStep = "Region" | "Scenario" | "Settings" | "Results";
export function SeraControls({ step, excluded, onExcluded, available }: { step: SeraStep; excluded: boolean; onExcluded: (value: boolean) => void; available: boolean }) {
  const [population, setPopulation] = useState(50);
  const [hazard, setHazard] = useState(30);
  const [vulnerability, setVulnerability] = useState(20);
  const loss = getLossSample();
  const weights = [{ label: "Population", value: population, onChange: setPopulation }, { label: "Hazard", value: hazard, onChange: setHazard }, { label: "Vulnerability", value: vulnerability, onChange: setVulnerability }];
  return <div className="sera-bottom-controls">
    <section className="surface-card loss-card"><label className="checkbox-label"><input type="checkbox" disabled={!available} checked={excluded} onChange={(event) => onExcluded(event.target.checked)} /><strong>{available ? "What if we lose Pasadena Yard?" : "What if a depot is unavailable?"}</strong></label>
      {available ? <><p className="caption">People covered within 60 min. <span className="chip estimated-tag">Estimated</span></p>
        <div className="loss-row"><span>Before</span><div className="loss-bar" /><strong>{loss.before}</strong></div>
        <div className="loss-row"><span>After</span><div className={`loss-bar loss-bar-after${excluded ? " is-excluded" : ""}`} /><strong>{excluded ? loss.after : loss.before}</strong></div>
        <SampleCitation sourceName={loss.sourceName} updatedAt={loss.updatedAt} />
      </> : <p className="missing-value">Not enough data</p>}
    </section>
    <section className="surface-card sensitivity-card">
      {step === "Region" ? <><h2>Choose a sample region</h2><RegionSearch /><p className="caption">Region choice does not compare or grade places.</p></> : step === "Scenario" ? <><h2>Scenario</h2><label className="field-label">Sample scenario<select defaultValue="Wildfire"><option>Wildfire</option></select></label><p className="caption">Official layer design sample. Other scenarios are not available yet.</p></> : <>
        <h2>Sensitivity</h2>{weights.map((weight) => <label className="sensitivity-row" key={weight.label}><span>{weight.label}</span><input type="range" aria-label={`${weight.label} sample weight`} min="0" max="100" step="10" value={weight.value} onChange={(event) => weight.onChange(Number(event.target.value))} /><strong>{weight.value}%</strong></label>)}
        <p className="caption">Illustrative settings. Coverage ranges do not recalculate.</p>
      </>}
    </section>
  </div>;
}
