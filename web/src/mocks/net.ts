import type { SampleHazard, SampleStop } from "@/types/workspace";
import { sampleTimestamp } from "./echo";

export const sampleStops: readonly SampleStop[] = [
  { id: "start", name: "Start", address: "Pasadena, California", left: 43, top: 72 },
  { id: "depot", name: "Depot Central", address: "Depot Central, Pasadena (sample)", left: 69, top: 56 },
  { id: "destination", name: "Emergency shelter A", address: "Emergency shelter A, Pasadena (sample)", left: 87, top: 23 },
  { id: "backup", name: "Glendale Lot", address: "Glendale Lot, California (sample)", left: 54, top: 37 },
];
export const sampleHazards: readonly SampleHazard[] = [
  { id: "closure", title: "Foothill ramp access unconfirmed", detail: "Check the road status before leaving.", risk: "High", kind: "Measured", sourceName: "Caltrans lane closures (design sample)", updatedAt: sampleTimestamp },
  { id: "fire", title: "Official fire hazard zone near the trip", detail: "Review official boundaries and local guidance.", risk: "High", kind: "Measured", sourceName: "CAL FIRE hazard zones (design sample)", updatedAt: sampleTimestamp },
  { id: "weather", title: "Weather advisory in the sample area", detail: "Official alerts take priority over this trip brief.", risk: "Moderate", kind: "Measured", sourceName: "NWS Los Angeles (design sample)", updatedAt: sampleTimestamp },
];
