import { sampleRegions } from "@/mocks/regions";
import { sampleCoverage } from "@/mocks/coverage";
import type { RegionId } from "@/types/region";

export function getRegions() {
  return [...sampleRegions].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function getRegion(id: RegionId) {
  return sampleRegions.find((region) => region.id === id)!;
}

export function getRegionCoverage(id: RegionId) {
  return sampleCoverage[id].map((entry) => ({ ...entry }));
}
