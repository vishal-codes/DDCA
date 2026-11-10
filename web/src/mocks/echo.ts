import type { SampleZone } from "@/types/workspace";

export const sampleTimestamp = "2026-11-08T22:15:00Z";
const official = { sourceName: "CAL FIRE hazard zones (design sample)", updatedAt: sampleTimestamp, kind: "Measured" as const };
export const sampleZones: readonly SampleZone[] = [
  { ...official, id: "A", risk: "High", exposure: "At least 18,000", action: "Review emergency preparedness",
    position: { left: "38%", top: "28%", width: "24%", height: "35%", polygon: "polygon(0 12%, 86% 0, 100% 78%, 40% 100%, 4% 74%)" } },
  { ...official, id: "B", risk: "Moderate", exposure: "At least 9,000", action: "Check resource availability",
    position: { left: "40%", top: "56%", width: "14%", height: "22%", polygon: "polygon(7% 0, 70% 18%, 100% 100%, 0 100%)" } },
  { ...official, id: "C", risk: "High", exposure: "At least 4,000", action: "Verify access and monitoring",
    position: { left: "57%", top: "31%", width: "17%", height: "22%", polygon: "polygon(0 0, 94% 14%, 100% 100%, 28% 96%)" } },
  { ...official, id: "D", risk: "Low", exposure: "At least 12,000", action: "Maintain emergency readiness",
    position: { left: "55%", top: "65%", width: "14%", height: "20%", polygon: "polygon(0 9%, 100% 0, 93% 100%, 7% 93%)" } },
];
