import type { SampleSite } from "@/types/workspace";
import { sampleTimestamp } from "./echo";

const source = { sourceName: "Design reference; population dataset undecided", updatedAt: sampleTimestamp, kind: "Modeled" as const };
// Ordering and ranges are fixed design examples, not optimization results.
export const sampleSites: readonly SampleSite[] = [
  { ...source, id: "PY", name: "Pasadena Yard", type: "Warehouse", nearCoverage: "180,000-190,000", farCoverage: "620,000-660,000", left: 49, top: 43, hazard: false },
  { ...source, id: "GL", name: "Glendale Lot", type: "Parking lot", nearCoverage: "140,000-150,000", farCoverage: "540,000-580,000", left: 68, top: 34, hazard: true },
  { ...source, id: "MH", name: "Monrovia Hub", type: "Community center", nearCoverage: "90,000-100,000", farCoverage: "400,000-430,000", left: 58, top: 58, hazard: false },
];
export const sampleLoss = { before: "620,000-660,000", after: "440,000-470,000", ...source };
