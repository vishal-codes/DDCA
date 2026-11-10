import { RiskChip } from "@/components/shared/risk-chip";
import type { RiskLevel } from "@/types/coverage";

export function MapLegend() {
  return <div className="surface-card map-legend">
    <strong>Legend</strong>
    <div className="pattern-keys"><span><i className="pattern-swatch measured-swatch" />Measured</span><span><i className="pattern-swatch modeled-swatch" />Modeled</span><span><i className="pattern-swatch missing-swatch" />Not enough data</span></div>
    <div className="chip-group">{(["Low", "Moderate", "High", "Extreme"] as RiskLevel[]).map((level) => <RiskChip key={level} level={level} />)}</div>
  </div>;
}
