import type { CoverageKind } from "./coverage";

export type LayerState = Record<CoverageKind, { enabled: boolean; opacity: number }>;
