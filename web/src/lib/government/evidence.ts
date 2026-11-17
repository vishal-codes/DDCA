import type { EvidenceArea, GovernmentCollector, GovernmentEvidence, GovernmentHazard, StoredDiscoveryJob } from "./types";

export const governmentCollectors = ["government_pages", "openrouter", "openai"] as const satisfies readonly GovernmentCollector[];

const hazards: readonly GovernmentHazard[] = ["wildfire", "flood", "landslide", "earthquake"];

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid government-source response.");
  return value as Record<string, unknown>;
}

function readArea(value: unknown): EvidenceArea | undefined {
  if (value === undefined) return undefined;
  const area = record(value);
  if (typeof area.name !== "string" || !area.name.trim() || area.name.length > 300 ||
      !["city", "district", "state"].includes(String(area.level))) throw new Error("Invalid evidence coverage.");
  return { name: area.name, level: area.level as EvidenceArea["level"] };
}

export function officialSourceUrl(value: unknown, domains: readonly string[]): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
    if (!domains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`))) return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function readGovernmentEvidence(response: unknown, domains: readonly string[]): GovernmentEvidence[] {
  const body = record(response);
  if (!Array.isArray(body.output)) throw new Error("Missing government-source output.");
  const knownUrls = new Set<string>();
  const texts: string[] = [];
  let searched = false;

  for (const rawItem of body.output) {
    const item = record(rawItem);
    if (item.type === "web_search_call") {
      searched = true;
      const action = record(item.action);
      const sources = Array.isArray(action.sources) ? action.sources : [];
      for (const rawSource of sources) {
        const source = record(rawSource);
        const url = officialSourceUrl(source.url, domains);
        if (url) knownUrls.add(url);
      }
    }
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (const rawContent of item.content) {
      const content = record(rawContent);
      if (content.type !== "output_text" || typeof content.text !== "string") continue;
      texts.push(content.text);
      const annotations = Array.isArray(content.annotations) ? content.annotations : [];
      for (const rawAnnotation of annotations) {
        const annotation = record(rawAnnotation);
        if (annotation.type !== "url_citation") continue;
        const url = officialSourceUrl(annotation.url, domains);
        if (url) knownUrls.add(url);
      }
    }
  }
  if (!searched || texts.length === 0) throw new Error("Government sources were not searched.");
  const parsed = record(JSON.parse(texts.join("\n")));
  return readSources(parsed.sources, domains, knownUrls);
}

export function readSources(value: unknown, domains: readonly string[], knownUrls?: ReadonlySet<string>): GovernmentEvidence[] {
  if (!Array.isArray(value) || value.length > 12) throw new Error("Invalid government-source evidence.");
  const seen = new Set<string>();
  return value.map((rawSource) => {
    const source = record(rawSource);
    const url = officialSourceUrl(source.url, domains);
    const area = readArea(source.area);
    if (!hazards.includes(source.hazard as GovernmentHazard) || !url || (knownUrls && !knownUrls.has(url)) ||
        typeof source.title !== "string" || !source.title.trim() || source.title.length > 240 ||
        typeof source.summary !== "string" || !source.summary.trim() || source.summary.length > 1200 ||
        (source.summaryKind !== undefined && source.summaryKind !== "extract" && source.summaryKind !== "ai") ||
        (source.retrieval !== undefined && source.retrieval !== "page" && source.retrieval !== "search_excerpt") ||
        (source.publishedAt !== null && (typeof source.publishedAt !== "string" ||
          !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(source.publishedAt) || !Number.isFinite(Date.parse(source.publishedAt))))) {
      throw new Error("Government evidence did not match the searched official sources.");
    }
    const key = `${source.hazard}:${url}`;
    if (seen.has(key)) throw new Error("Duplicate government-source evidence.");
    seen.add(key);
    return {
      hazard: source.hazard as GovernmentHazard,
      title: source.title.trim(),
      url,
      summary: source.summary.trim(),
      publishedAt: source.publishedAt as string | null,
      ...(source.summaryKind ? { summaryKind: source.summaryKind as "extract" | "ai" } : {}),
      ...(area ? { area } : {}),
      ...(source.retrieval ? { retrieval: source.retrieval as "page" | "search_excerpt" } : {}),
    };
  });
}

export function readStoredGovernmentJob(value: unknown, id: string): StoredDiscoveryJob {
  const job = record(value);
  const point = record(job.point);
  const statuses = ["queued", "in_progress", "completed", "failed", "unconfigured", "unsupported"];
  const domains = job.allowedDomains;
  if (job.jurisdiction !== undefined) {
    const jurisdiction = record(job.jurisdiction);
    if (!["city", "district", "state"].every((key) => jurisdiction[key] === null ||
      (typeof jurisdiction[key] === "string" && jurisdiction[key].trim() && jurisdiction[key].length <= 300))) {
      throw new Error("Invalid saved jurisdiction.");
    }
  }
  if (job.id !== id || !/^[a-f0-9]{64}$/.test(id) ||
      typeof point.latitude !== "number" || !Number.isFinite(point.latitude) || Math.abs(point.latitude) > 90 ||
      typeof point.longitude !== "number" || !Number.isFinite(point.longitude) || Math.abs(point.longitude) > 180 ||
      typeof job.status !== "string" || !statuses.includes(job.status) ||
      (job.collector !== undefined && !governmentCollectors.some((collector) => collector === job.collector)) ||
      (job.collectionVersion !== undefined && (!Number.isInteger(job.collectionVersion) || Number(job.collectionVersion) < 1)) ||
      (job.searchStatus !== undefined && !["checked", "failed", "not_configured"].includes(String(job.searchStatus))) ||
      (job.placeName !== null && (typeof job.placeName !== "string" || job.placeName.length > 2000)) ||
      (job.countryCode !== null && (typeof job.countryCode !== "string" || !/^[a-z]{2}$/.test(job.countryCode))) ||
      !Array.isArray(domains) || domains.length > 100 ||
      !domains.every((domain) => typeof domain === "string" &&
        /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/.test(domain) && !domain.includes("..")) ||
      typeof job.startedAt !== "string" || !Number.isFinite(Date.parse(job.startedAt)) ||
      typeof job.updatedAt !== "string" || !Number.isFinite(Date.parse(job.updatedAt)) ||
      (job.providerResponseId !== null && (typeof job.providerResponseId !== "string" || !/^resp_[a-zA-Z0-9_-]+$/.test(job.providerResponseId))) ||
      (job.message !== null && (typeof job.message !== "string" || job.message.length > 2000)) ||
      !Array.isArray(job.suggestedSources) || job.suggestedSources.length > 20) {
    throw new Error("Invalid saved government-source collection.");
  }
  const sources = readSources(job.sources, domains);
  const suggestedSources = job.suggestedSources.map((rawSource) => {
    const source = record(rawSource);
    const url = officialSourceUrl(source.url, domains);
    if (!url || typeof source.title !== "string" || !source.title.trim() || source.title.length > 240) {
      throw new Error("Invalid saved government source.");
    }
    return { title: source.title, url };
  });
  return { ...job, sources, suggestedSources } as StoredDiscoveryJob;
}
