"use client";

import type { useGovernmentDiscovery } from "./use-government-discovery";
import { GovernmentSource } from "./government-source";

export function GovernmentDiscoveryPanel({ collection }: { collection: ReturnType<typeof useGovernmentDiscovery> }) {
  const { job, error, searching, retry } = collection;
  return <section className="government-discovery evidence-entry" aria-labelledby="government-discovery-title">
    <h2 id="government-discovery-title">Local government sources</h2>
    <p className="caption">Collects material from official government websites about wildfire, flood, landslide and earthquake information for this location.</p>
    <p role="status">{error ?? (searching ? "Collecting government sources..." : job?.message)}</p>
    {job?.placeName && <p className="caption">{job.placeName}</p>}
    {job?.status === "completed" && <>
      {job.sources.length === 0 && <p className="missing-value">Not enough data. This search found no validated government evidence.</p>}
      {job.sources.map((source) => <GovernmentSource key={`${source.hazard}:${source.url}`} source={source} collectedAt={job.updatedAt} />)}
      <p className="caption">These source findings provide context. A point-specific hazard level needs a validated dataset for this location.</p>
    </>}
    {job?.status === "unconfigured" && <p className="caption">The source-collection service needs a server-side API key. Existing government feeds remain available above.</p>}
    {job?.suggestedSources && job.suggestedSources.length > 0 && <div>
      <h3>Official government portals</h3>
      {job.suggestedSources.map((source) => <p key={source.url}>
        <a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
      </p>)}
    </div>}
    {job?.allowedDomains && job.allowedDomains.length > 0 && <details>
      <summary>Permitted government websites</summary>
      <p className="caption">{job.allowedDomains.join(", ")}</p>
    </details>}
    {!searching && <button type="button" className="text-link" onClick={retry}>
      {job?.status === "completed" ? "Check collected sources" : "Retry government-source collection"}
    </button>}
    {error && searching && <button type="button" className="text-link" onClick={retry}>Check search</button>}
  </section>;
}
