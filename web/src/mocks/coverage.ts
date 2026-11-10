import type { CoverageEntry } from "@/types/coverage";
import type { RegionId } from "@/types/region";

// These are design fixtures. No source is connected or being polled.
// An explicit stale flag previews the UI without deciding feed thresholds.
export const sampleCoverage: Record<RegionId, readonly CoverageEntry[]> = {
  "los-angeles": [
    { kind: "alerts", label: "Official alerts", status: "live", sourceName: "NWS Los Angeles",
      updatedAt: "2026-11-08T22:11:00Z", ageLabel: "Updated 4 min ago", isStale: false },
    { kind: "roadClosures", label: "Road closures", status: "live", sourceName: "Caltrans lane closures",
      updatedAt: "2026-11-08T19:15:00Z", ageLabel: "Updated 3 h ago", isStale: true },
    { kind: "evacuationZones", label: "Evacuation zones", status: "live", sourceName: "Cal OES evacuation zones",
      updatedAt: "2026-11-08T21:40:00Z", ageLabel: "Updated 35 min ago", isStale: false },
    { kind: "hazardMaps", label: "Hazard maps", status: "static_map", sourceName: "CAL FIRE hazard zones",
      updatedAt: "2025-01-01T00:00:00Z", datePrecision: "year", ageLabel: null, isStale: false },
    { kind: "population", label: "Population", status: "global_model", sourceName: "Design reference; dataset undecided",
      updatedAt: "2025-01-01T00:00:00Z", datePrecision: "year", ageLabel: null, isStale: false },
  ],
  jakarta: [
    { kind: "alerts", label: "Official alerts", status: "live", sourceName: "Design reference; source undecided",
      updatedAt: "2026-11-08T21:53:00Z", ageLabel: "Updated 22 min ago", isStale: false },
    { kind: "roadClosures", label: "Road closures", status: "not_available", sourceName: "No source connected",
      updatedAt: null, ageLabel: null, isStale: false },
    { kind: "evacuationZones", label: "Evacuation zones", status: "not_available", sourceName: "No source connected",
      updatedAt: null, ageLabel: null, isStale: false },
    { kind: "hazardMaps", label: "Hazard maps", status: "global_model", sourceName: "Design reference; source undecided",
      updatedAt: "2026-09-01T00:00:00Z", datePrecision: "month", ageLabel: null, isStale: false },
    { kind: "population", label: "Population", status: "global_model", sourceName: "Design reference; dataset undecided",
      updatedAt: "2025-01-01T00:00:00Z", datePrecision: "year", ageLabel: null, isStale: false },
  ],
  lisbon: [
    { kind: "alerts", label: "Official alerts", status: "updated_daily", sourceName: "Design reference; source undecided",
      updatedAt: "2026-11-08T09:00:00Z", ageLabel: "Updated daily", isStale: false },
    { kind: "roadClosures", label: "Road closures", status: "not_available", sourceName: "No source connected",
      updatedAt: null, ageLabel: null, isStale: false },
    { kind: "evacuationZones", label: "Evacuation zones", status: "not_available", sourceName: "No source connected",
      updatedAt: null, ageLabel: null, isStale: false },
    { kind: "hazardMaps", label: "Hazard maps", status: "static_map", sourceName: "Design reference; source undecided",
      updatedAt: "2025-01-01T00:00:00Z", datePrecision: "year", ageLabel: null, isStale: false },
    { kind: "population", label: "Population", status: "global_model", sourceName: "Design reference; dataset undecided",
      updatedAt: "2025-01-01T00:00:00Z", datePrecision: "year", ageLabel: null, isStale: false },
  ],
};
