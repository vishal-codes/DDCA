import { sampleRegions } from "@/mocks/regions";
import { sampleCoverage } from "@/mocks/coverage";
import type { RegionId } from "@/types/region";
import type { PreviewState } from "@/types/workspace";

export function getRegions() {
  return [...sampleRegions].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function getRegion(id: RegionId) {
  return sampleRegions.find((region) => region.id === id)!;
}

export function getRegionCoverage(id: RegionId, state: PreviewState = "normal") {
  return sampleCoverage[id].map((entry) => ({ ...entry,
    isStale: entry.isStale || (entry.updatedAt !== null && (state === "stale" || state === "offline")),
  }));
}
