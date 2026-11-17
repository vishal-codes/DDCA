import type { useGovernmentDiscovery } from "@/components/government/use-government-discovery";
import { GovernmentSource } from "@/components/government/government-source";
import { localEvidence } from "@/lib/government/geography";

export function LocalContextFindings({ collection, onEvidence }: {
  collection: ReturnType<typeof useGovernmentDiscovery>; onEvidence: () => void;
}) {
  const { job, searching, error, retry } = collection;
  const sources = localEvidence(job?.sources ?? []);
  return <section className="evidence-entry" aria-label="Local disaster context">
    <h2>Local disaster context</h2>
    {job?.placeName && <p className="caption">{job.placeName}</p>}
    {searching ? <p role="status">Resolving this location and collecting relevant government evidence...</p>
      : <>
        {job?.status === "completed" && sources.length > 0
          ? sources.map((source) => <GovernmentSource key={`${source.hazard}:${source.url}`} source={source} collectedAt={job.updatedAt} />)
          : <p className="missing-value">Not enough data. No city or district hazard evidence has been verified in this check. This does not mean the area has no hazards.</p>}
        {(error || job?.status !== "completed" || job.searchStatus !== "checked") && <p className="caption" role="status">{error ?? job?.message}</p>}
        <p className="caption">Published history and hazard assessments are context, not a current incident or an address-level risk assessment.</p>
        <button type="button" className="text-link" onClick={onEvidence}>View sources and coverage</button>
        {(error || job?.status === "failed") && <button type="button" className="text-link" onClick={retry}>Retry local sources</button>}
      </>}
  </section>;
}
