"use client";

import type { SampleSite } from "@/types/workspace";
import { SampleCitation } from "@/components/shared/sample-citation";
import { RiskChip } from "@/components/shared/risk-chip";

export function SiteList({ sites, selected, excluded, onSelect }: { sites: SampleSite[]; selected: string; excluded: boolean; onSelect: (id: string) => void }) {
  return <><h2>Candidate depot sites</h2><p className="sample-note">Ordered by sample coverage. Estimated ranges, not computed results.</p>
    {!sites.length && <p className="missing-value">Not enough data. No sample candidate sites are available for this area.</p>}
    <div className="site-list">{sites.map((site) => <article key={site.id} className={`surface-card site-card${site.id === selected ? " is-selected" : ""}`}>
      <button type="button" className="site-select" onClick={() => onSelect(site.id)} aria-pressed={site.id === selected}><strong>{site.name}</strong><span className="caption">{site.type}</span></button>
      <span className="chip estimated-tag">Estimated</span>
      <p>{site.nearCoverage} <span className="caption">people within 30 min</span></p>
      <p>{site.farCoverage} <span className="caption">people within 60 min</span></p>
      {excluded && site.id === "PY" && <p className="caption">Excluded in the sample comparison.</p>}
      {site.hazard && <p className="site-hazard"><RiskChip level="High" /> Inside a sample official hazard zone.</p>}
      <SampleCitation sourceName={site.sourceName} updatedAt={site.updatedAt} />
    </article>)}</div>
  </>;
}
