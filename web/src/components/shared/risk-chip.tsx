import type { RiskLevel } from "@/types/coverage";

export function RiskChip({ level }: { level: RiskLevel }) {
  return (
    <span className={`chip risk-chip risk-${level.toLowerCase()}`}>
      <span className="risk-icon" aria-hidden="true" />
      {level}
    </span>
  );
}
