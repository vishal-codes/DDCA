import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { reversePlace } from "@/lib/data/places-server";
import { domainsForCountry, suggestedSourcesForPlace } from "./domains";
import { governmentCollectors, readStoredGovernmentJob } from "./evidence";
import { applyProviderResponse, beginGovernmentCollection, DiscoveryProviderError, pollGovernmentCollection } from "./provider";
import type { GovernmentDiscoveryJob, StoredDiscoveryJob } from "./types";
import { collectGovernmentPages } from "./free-collector";

const day = 86400000;
const activeJobs = new Map<string, Promise<StoredDiscoveryJob | null>>();

function selectedCollector(): NonNullable<GovernmentDiscoveryJob["collector"]> {
  const configured = process.env.GOVERNMENT_DISCOVERY_PROVIDER?.trim() || (process.env.OPENROUTER_API_KEY?.trim() ? "openrouter" : "government_pages");
  const collector = governmentCollectors.find((candidate) => candidate === configured);
  if (!collector) throw new Error("Invalid government collection provider.");
  return collector;
}

export function discoveryJobId(point: { latitude: number; longitude: number }) {
  return createHash("sha256").update(JSON.stringify([point.latitude, point.longitude])).digest("hex");
}

function jobPath(id: string) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error("Invalid collection identifier.");
  return resolve(".local", "government-discovery", `${id}.json`);
}

async function readJob(id: string): Promise<StoredDiscoveryJob | null> {
  try {
    const value: unknown = JSON.parse(await readFile(jobPath(id), "utf8"));
    const job = readStoredGovernmentJob(value, id);
    if (discoveryJobId(job.point) !== id) throw new Error("Saved collection point mismatch.");
    return job;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    if (error instanceof Error && "code" in error) throw new Error("The saved collection could not be read.");
    return null;
  }
}

async function saveJob(job: StoredDiscoveryJob) {
  const directory = resolve(".local", "government-discovery");
  await mkdir(directory, { recursive: true });
  const path = jobPath(job.id);
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(job), { flag: "wx" });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
  return job;
}

function publicJob(job: StoredDiscoveryJob): GovernmentDiscoveryJob {
  return {
    id: job.id, point: job.point, status: job.status, placeName: job.placeName,
    countryCode: job.countryCode, allowedDomains: job.allowedDomains,
    startedAt: job.startedAt, updatedAt: job.updatedAt, sources: job.sources,
    suggestedSources: job.suggestedSources, message: job.message,
    collector: job.collector,
    jurisdiction: job.jurisdiction, collectionVersion: job.collectionVersion, searchStatus: job.searchStatus,
  };
}

async function serializedJob(id: string, operation: () => Promise<StoredDiscoveryJob | null>) {
  const running = activeJobs.get(id);
  if (running) return running;
  const pending = operation();
  activeJobs.set(id, pending);
  try {
    return await pending;
  } finally {
    if (activeJobs.get(id) === pending) activeJobs.delete(id);
  }
}

function freshJob(point: { latitude: number; longitude: number }): StoredDiscoveryJob {
  const startedAt = new Date().toISOString();
  return {
    id: discoveryJobId(point), point, status: "queued", placeName: null, countryCode: null,
    allowedDomains: [], startedAt, updatedAt: startedAt, sources: [], suggestedSources: [],
    message: "Identifying the local government jurisdiction.", providerResponseId: null,
    collector: selectedCollector(), collectionVersion: 2,
  };
}

function failureMessage(error: unknown) {
  return error instanceof DiscoveryProviderError ? error.message : "Government-source collection could not be completed. Try again.";
}

export async function startGovernmentDiscovery(point: { latitude: number; longitude: number }) {
  const id = discoveryJobId(point);
  const job = await serializedJob(id, async () => {
    const existing = await readJob(id);
    const sameCollector = existing && existing.collectionVersion === 2 && (existing.collector ?? "openai") === selectedCollector() &&
      !(existing.searchStatus === "not_configured" && process.env.TAVILY_API_KEY?.trim());
    const summaryFallback = existing && (existing.searchStatus === "failed" || (existing.collector === "openrouter" &&
      existing.sources.some((source) => source.summaryKind === "extract")));
    if (sameCollector && existing.status === "completed" &&
        Date.now() - Date.parse(existing.updatedAt) < (summaryFallback ? 60000 : day)) return existing;
    if (sameCollector && ["queued", "in_progress"].includes(existing.status) &&
        Date.now() - Date.parse(existing.startedAt) < 20 * 60000) return existing;
    let current = await saveJob(freshJob(point));
    try {
      const place = await reversePlace(point.latitude, point.longitude);
      current = {
        ...current, placeName: place?.name ?? null, countryCode: place?.countryCode ?? null,
        allowedDomains: domainsForCountry(place?.countryCode ?? null),
        jurisdiction: place?.jurisdiction ?? { city: place?.name.split(",")[0].trim() ?? null, district: null, state: null },
      };
      current.suggestedSources = suggestedSourcesForPlace({ name: current.placeName ?? "", countryCode: current.countryCode }, current.allowedDomains);
      if (!current.countryCode) {
        return saveJob({ ...current, status: "failed", updatedAt: new Date().toISOString(),
          message: "The jurisdiction could not be resolved. Select a city or retry before collecting local sources." });
      }
      if (!current.allowedDomains.length) {
        return saveJob({
          ...current, status: "unsupported", updatedAt: new Date().toISOString(),
          message: "Official government domains need configuration for this country. Coverage has not been determined.",
        });
      }
      if (current.collector !== "openai") {
        return saveJob(await collectGovernmentPages(current));
      }
      const key = process.env.OPENAI_API_KEY?.trim();
      if (!key) {
        return saveJob({
          ...current, status: "unconfigured", updatedAt: new Date().toISOString(),
          message: "Automatic government-source collection is not configured. You can open the official sources below.",
        });
      }
      current = await saveJob({ ...current, message: "Starting government-source collection." });
      const response = await beginGovernmentCollection(current, key);
      return saveJob(applyProviderResponse(current, response));
    } catch (error) {
      return saveJob({
        ...current, status: current.collector === "openai" && !process.env.OPENAI_API_KEY?.trim() ? "unconfigured" : "failed",
        updatedAt: new Date().toISOString(), message: failureMessage(error),
      });
    }
  });
  return publicJob(job!);
}

export async function getGovernmentDiscovery(id: string) {
  const job = await serializedJob(id, async () => {
    const current = await readJob(id);
    if (!current || !["queued", "in_progress"].includes(current.status)) return current;
    if (!current.providerResponseId) {
      if (Date.now() - Date.parse(current.startedAt) > 120000) {
        return saveJob({ ...current, status: "failed", message: "Collection startup was interrupted. Try again." });
      }
      return current;
    }
    if (Date.now() - Date.parse(current.startedAt) > 20 * 60000) {
      return saveJob({ ...current, status: "failed", message: "The collection did not finish in time. Try again." });
    }
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) return { ...current, message: "Government-source collection is temporarily unavailable." };
    try {
      const response = await pollGovernmentCollection(current.providerResponseId, key);
      try {
        return saveJob(applyProviderResponse(current, response));
      } catch {
        return saveJob({
          ...current, status: "failed", updatedAt: new Date().toISOString(),
          message: "Collected sources could not be verified against the government search results.",
        });
      }
    } catch (error) {
      if (error instanceof DiscoveryProviderError && error.terminal) {
        return saveJob({ ...current, status: "failed", updatedAt: new Date().toISOString(), message: error.message });
      }
      return { ...current, message: "The collection status could not be checked. Retrying will keep the same request." };
    }
  });
  return job ? publicJob(job) : null;
}
