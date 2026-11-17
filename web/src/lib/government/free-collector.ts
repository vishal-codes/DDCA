import type { GovernmentEvidence, GovernmentHazard, StoredDiscoveryJob } from "./types";
import { officialSourceUrl } from "./evidence";
import { evidenceArea } from "./geography";
import { fetchGovernmentPage, hazardPatterns } from "./pages";
import { searchGovernmentDocuments } from "./search";
import { summarizeGovernmentSources } from "./summaries";

type CollectedContext = Pick<StoredDiscoveryJob, "status" | "sources" | "message" | "updatedAt" | "searchStatus">;
const contexts = new Map<string, { expires: number; value: Promise<CollectedContext> }>();

function extractEvidence(job: StoredDiscoveryJob, paragraphs: string[], title: string, inputUrl: string,
  publishedAt: string | null, retrieval: GovernmentEvidence["retrieval"]): GovernmentEvidence[] {
  const url = officialSourceUrl(inputUrl, job.allowedDomains);
  if (!url) return [];
  const sources: GovernmentEvidence[] = [];
  for (const [hazard, pattern] of Object.entries(hazardPatterns)) {
    const passages = paragraphs.map((line) => line.trim().slice(0, 900)).filter((line) => line.length >= 35 && pattern.test(line));
    for (const summary of passages) {
      const area = evidenceArea(summary, job.jurisdiction) ?? evidenceArea(title, job.jurisdiction);
      if (!area) continue;
      sources.push({ hazard: hazard as GovernmentHazard, title, url, summary, publishedAt, area, retrieval, summaryKind: "extract" });
      if (area.level !== "state") break;
    }
  }
  return sources;
}

async function collectContext(job: StoredDiscoveryJob): Promise<CollectedContext> {
  const search = await searchGovernmentDocuments(job);
  const sources = search.documents.flatMap((document) => extractEvidence(job,
    document.text.split(/\n+|(?<=[.!?])\s+(?=[A-Z])/), document.title, document.url, null, "search_excerpt"));
  // Fetch reviewed URLs, never a namespace such as gov.in as a website.
  const candidates = [...new Set([
    ...search.documents.map((document) => document.url).filter((url) => !/\.pdf(?:\?|$)/i.test(url)),
    ...job.suggestedSources.map((source) => source.url),
  ])];
  const visited = new Set<string>();
  let fetched = 0;
  while (candidates.length && visited.size < 4) {
    const batch = candidates.splice(0, 2).filter((url) => !visited.has(url)).slice(0, 4 - visited.size);
    batch.forEach((url) => visited.add(url));
    const pages = await Promise.allSettled(batch.map((url) => fetchGovernmentPage(url, job.allowedDomains)));
    for (const result of pages) {
      if (result.status !== "fulfilled" || !result.value) continue;
      const page = result.value;
      fetched++;
      for (const link of page.links) if (!visited.has(link) && !candidates.includes(link)) candidates.push(link);
      const evidence = extractEvidence(job, page.paragraphs, page.title, page.url, page.publishedAt, "page");
      for (const source of evidence) {
        const index = sources.findIndex((item) => item.url === source.url && item.hazard === source.hazard);
        if (index >= 0) sources[index] = source;
        else sources.push(source);
      }
    }
  }
  const local = sources.filter((source) => source.area?.level !== "state");
  const ordered = [...local, ...sources.filter((source) => source.area?.level === "state")];
  const seen = new Set<string>();
  let evidence = ordered.filter((source) => {
    const key = `${source.hazard}:${source.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).filter((source, index, list) => list.slice(0, index).filter((item) => item.hazard === source.hazard).length < 2);
  let message = evidence.length ? "Published government context is available. Geographic coverage is stated with each source."
    : "Not enough data. No matching local hazard evidence was found in the sources checked. This does not mean the area has no hazards.";
  if (search.status !== "checked") message = `${search.message} ${message}`;
  if (job.collector === "openrouter" && evidence.length) {
    try {
      evidence = await summarizeGovernmentSources(evidence);
    } catch (error) {
      const reason = error instanceof Error && /^(Set OPENROUTER_API_KEY|Choose openrouter\/free|OpenRouter)/.test(error.message)
        ? error.message : "AI summaries are unavailable.";
      message = `${reason} Showing original government excerpts. ${message}`;
    }
  }
  return { status: fetched || search.status === "checked" ? "completed" : "failed", updatedAt: new Date().toISOString(),
    sources: evidence, message, searchStatus: search.status };
}

export async function collectGovernmentPages(job: StoredDiscoveryJob): Promise<StoredDiscoveryJob> {
  const key = JSON.stringify([job.countryCode, job.jurisdiction ?? job.id, job.collector, job.allowedDomains,
    job.suggestedSources, !!process.env.TAVILY_API_KEY?.trim(), !!process.env.OPENROUTER_API_KEY?.trim(), process.env.OPENROUTER_DISCOVERY_MODEL]);
  let entry = contexts.get(key);
  if (!entry || entry.expires <= Date.now()) {
    if (contexts.size >= 100) contexts.delete(contexts.keys().next().value!);
    entry = { expires: Date.now() + 120000, value: collectContext(job) };
    contexts.set(key, entry);
    const current = entry;
    entry.value.then((value) => {
      const fallback = value.status !== "completed" || value.searchStatus === "failed" ||
        (job.collector === "openrouter" && value.sources.some((source) => source.summaryKind === "extract"));
      current.expires = Date.now() + (fallback ? 60000 : 86400000);
    }, () => contexts.delete(key));
  }
  return { ...job, ...await entry.value };
}
