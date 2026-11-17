import type { StoredDiscoveryJob } from "./types";
import { officialSourceUrl } from "./evidence";
import { evidenceArea } from "./geography";

export type GovernmentSearchDocument = { title: string; url: string; text: string };

export async function searchGovernmentDocuments(job: StoredDiscoveryJob): Promise<{
  documents: GovernmentSearchDocument[]; status: "checked" | "failed" | "not_configured"; message: string;
}> {
  const key = process.env.TAVILY_API_KEY?.trim();
  if (!key) return { documents: [], status: "not_configured", message: "City-specific web discovery is not connected. Checking reviewed official portals." };
  const jurisdiction = job.jurisdiction;
  const locations = [jurisdiction?.city, jurisdiction?.district, jurisdiction?.state].filter(Boolean);
  if (!locations.length) return { documents: [], status: "failed", message: "The local jurisdiction could not be resolved. City-specific discovery could not run." };
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(12000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `${locations.join(", ")}, ${job.countryCode}. Official disaster history and published hazard assessments flood earthquake landslide wildfire`,
        search_depth: "basic", auto_parameters: false, topic: "general", max_results: 5,
        include_domains: job.allowedDomains, include_domains_mode: "restrict",
        include_answer: false, include_raw_content: "text", include_images: false,
      }),
    });
    if (!response.ok) throw new Error(response.status === 429 || response.status === 432
      ? "City-specific web discovery reached its request limit. Checking reviewed official portals."
      : "City-specific web discovery is unavailable. Checking reviewed official portals.");
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !("results" in body) || !Array.isArray(body.results)) throw new Error("Invalid search results.");
    const documents: GovernmentSearchDocument[] = [];
    for (const item of body.results.slice(0, 5)) {
      if (!item || typeof item !== "object") continue;
      const url = officialSourceUrl(item.url, job.allowedDomains);
      const text = typeof item.raw_content === "string" && item.raw_content.trim() ? item.raw_content : item.content;
      if (!url || typeof text !== "string" || typeof item.title !== "string" || !item.title.trim() ||
          !evidenceArea(`${item.title} ${text}`, jurisdiction) || documents.some((document) => document.url === url)) continue;
      documents.push({ url, title: item.title.slice(0, 240), text: text.slice(0, 30000) });
    }
    return { documents, status: "checked", message: documents.length
      ? "Official search results checked against this jurisdiction."
      : "No matching official local evidence was found in this search." };
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith("City-specific") ? error.message
      : "City-specific web discovery could not be reached. Checking reviewed official portals.";
    return { documents: [], status: "failed", message };
  }
}
