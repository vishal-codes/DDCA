export type CoverageKind = "alerts" | "roadClosures" | "evacuationZones" | "hazardMaps" | "population";
export type CoverageStatus = "live" | "updated_daily" | "static_map" | "global_model" | "not_available";
export type MeasurementKind = "Measured" | "Modeled";
export type RiskLevel = "Low" | "Moderate" | "High" | "Extreme";

export type CoverageEntry = {
  kind: CoverageKind;
  label: string;
  status: CoverageStatus;
  sourceName: string;
  updatedAt: string | null;
  datePrecision?: "year" | "month";
  ageLabel: string | null;
  isStale: boolean;
};
