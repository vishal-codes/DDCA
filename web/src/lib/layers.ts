import { getRegionCoverage } from "@/lib/data/regions";
import type { RegionId } from "@/types/region";
import type { LayerState } from "@/types/layers";

export function initialLayers(region: RegionId): LayerState {
  return Object.fromEntries(getRegionCoverage(region).map((entry) => [entry.kind, { enabled: entry.status !== "not_available", opacity: 70 }])) as LayerState;
}
