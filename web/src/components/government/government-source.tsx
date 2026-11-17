import type { GovernmentEvidence } from "@/lib/government/types";
import { formatSampleDate } from "@/lib/format-date";

const hazardNames = { wildfire: "Wildfire", flood: "Flood", landslide: "Landslide", earthquake: "Earthquake" };

export function GovernmentSource({ source, collectedAt }: { source: GovernmentEvidence; collectedAt: string }) {
  return <article className="government-source">
    <h3>{hazardNames[source.hazard]}</h3>
    {source.area && <p className="caption">Published context for {source.area.name} ({source.area.level}).</p>}
    <a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
    <p>{source.summary}</p>
    <p className="caption">{source.summaryKind === "extract"
      ? source.retrieval === "search_excerpt" ? "Indexed excerpt from the government source." : "Excerpt from the government page."
      : "AI summary of the linked government source."}</p>
    {source.summaryKind === "ai" && source.retrieval === "search_excerpt" && <p className="caption">Based on indexed source text. Check the original document for current information.</p>}
    <p className="caption">{source.publishedAt
      ? <>Source date <time dateTime={source.publishedAt}>{source.publishedAt.length === 10 ? source.publishedAt : formatSampleDate(source.publishedAt)}</time>.</>
      : "Source date not provided."}</p>
    <p className="caption">Collected <time dateTime={collectedAt}>{formatSampleDate(collectedAt)}</time>.</p>
  </article>;
}
