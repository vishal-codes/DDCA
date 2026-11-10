import type { MeasurementKind, RiskLevel } from "./coverage";

export type WorkspaceMode = "echo" | "net" | "sera";
export type PreviewState = "normal" | "wildfire" | "stale" | "offline";
export type PanelTab = "Layers" | "Analysis" | "Evidence" | "Notes";
export type SampleSource = { sourceName: string; updatedAt: string; kind: MeasurementKind };
export type SampleZone = SampleSource & {
  id: string; risk: RiskLevel | null; exposure: string; action: string;
  position: { left: string; top: string; width: string; height: string; polygon: string };
};
export type SampleStop = { id: string; name: string; address: string; left: number; top: number };
export type SampleHazard = SampleSource & { id: string; title: string; detail: string; risk: RiskLevel };
export type SampleSite = SampleSource & {
  id: string; name: string; type: string; nearCoverage: string; farCoverage: string;
  left: number; top: number; hazard: boolean;
};
