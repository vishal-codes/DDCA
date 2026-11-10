import { RiskChip } from "@/components/shared/risk-chip";
import { SourceTag } from "@/components/shared/source-tag";
import { SampleCitation } from "@/components/shared/sample-citation";
import { DataAgeChip } from "@/components/shared/data-age-chip";
import type { SampleHazard } from "@/types/workspace";

export function HazardList({ hazards, stale }: { hazards: SampleHazard[]; stale: boolean }) {
  return <section className="hazard-list"><h2>Hazards near the trip</h2><p className="sample-note">Sample brief. Roads and distances have not been checked.</p>
    {!hazards.length && <p className="missing-value">Not enough data. No hazard sample is available for this area.</p>}
    {hazards.map((hazard) => <article className="surface-card hazard-card" key={hazard.id}>
      <h3>{hazard.title}</h3><div className="chip-group"><RiskChip level={hazard.risk} /><SourceTag kind={hazard.kind} /><DataAgeChip updatedAt={hazard.updatedAt} label="Sample snapshot" isStale={stale} /></div>
      <p>{hazard.detail}</p><SampleCitation sourceName={hazard.sourceName} updatedAt={hazard.updatedAt} />
    </article>)}
  </section>;
}
