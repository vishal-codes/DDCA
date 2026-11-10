import { sampleZones, sampleTimestamp } from "@/mocks/echo";
import { sampleStops, sampleHazards } from "@/mocks/net";
import { sampleSites, sampleLoss } from "@/mocks/sera";
import { sampleQuestions } from "@/mocks/ask";
import { sampleTimeline } from "@/mocks/timeline";
import type { RegionId } from "@/types/region";
import type { PreviewState } from "@/types/workspace";

export function getZones(region: RegionId) {
  return sampleZones.map((zone) => ({ ...zone, position: { ...zone.position },
    risk: region === "los-angeles" ? zone.risk : null,
    exposure: region === "los-angeles" ? zone.exposure : "Not enough data",
    action: region === "los-angeles" ? zone.action : "Check official local information",
    sourceName: region === "los-angeles" ? zone.sourceName : "Design reference; official source undecided",
  }));
}
export function getEchoSummary(region: RegionId, state: PreviewState) {
  return {
    alerts: region === "los-angeles" ? "2 active" : "Not enough data",
    exposure: region === "los-angeles" ? "At least 210,000" : "Not enough data",
    sourceName: "Design reference; population dataset undecided", updatedAt: sampleTimestamp,
    stale: state === "stale" || state === "offline",
  };
}
export function getTripSamples(region: RegionId) {
  return region === "los-angeles" ? { stops: sampleStops.map((s) => ({ ...s })), hazards: sampleHazards.map((h) => ({ ...h })) } : { stops: [], hazards: [] };
}
export function getSites(region: RegionId) {
  return region === "los-angeles" ? sampleSites.map((site) => ({ ...site })) : [];
}
export function getLossSample() { return { ...sampleLoss }; }
export function getAskExamples() { return sampleQuestions.map((entry) => ({ ...entry })); }
export function getSampleTime() { return sampleTimestamp; }
export function getTimelineSample(region: RegionId | null) {
  return { times: [...sampleTimeline.times], charts: sampleTimeline.charts.map((chart) => ({ ...chart,
    sourceName: region === "los-angeles" ? chart.sourceName : "Design reference; source undecided",
  })) };
}
export function getOfficialSample(region: RegionId, state: PreviewState) {
  if (region !== "los-angeles") return null;
  return {
    message: state === "wildfire"
      ? "Sample Red Flag Warning and evacuation warning, Altadena and Sierra Madre foothills. Official information takes priority."
      : "Sample official advisory. Check current official alerts and orders before acting.",
    sourceName: "NWS Los Angeles (design sample)", updatedAt: sampleTimestamp,
    ageLabel: "Updated 4 min ago", isStale: state === "stale" || state === "offline",
  };
}
