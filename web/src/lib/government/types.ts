export type GovernmentHazard = "wildfire" | "flood" | "landslide" | "earthquake";

export type GovernmentCollector = "government_pages" | "openrouter" | "openai";

export type GovernmentJurisdiction = { city: string | null; district: string | null; state: string | null };
export type EvidenceArea = { name: string; level: "city" | "district" | "state" };

export type GovernmentEvidence = {
  hazard: GovernmentHazard;
  title: string;
  url: string;
  summary: string;
  publishedAt: string | null;
  summaryKind?: "extract" | "ai";
  area?: EvidenceArea;
  retrieval?: "page" | "search_excerpt";
};

export type GovernmentDiscoveryStatus = "queued" | "in_progress" | "completed" | "failed" | "unconfigured" | "unsupported";

export type GovernmentDiscoveryJob = {
  id: string;
  point: { latitude: number; longitude: number };
  status: GovernmentDiscoveryStatus;
  placeName: string | null;
  countryCode: string | null;
  allowedDomains: string[];
  startedAt: string;
  updatedAt: string;
  sources: GovernmentEvidence[];
  suggestedSources: { title: string; url: string }[];
  message: string | null;
  collector?: GovernmentCollector;
  jurisdiction?: GovernmentJurisdiction;
  collectionVersion?: number;
  searchStatus?: "checked" | "failed" | "not_configured";
};

export type StoredDiscoveryJob = GovernmentDiscoveryJob & {
  providerResponseId: string | null;
};
