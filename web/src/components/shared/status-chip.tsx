import type { CoverageStatus } from "@/types/coverage";

export const statusLabels: Record<CoverageStatus, string> = {
  live: "Live", updated_daily: "Updated daily", static_map: "Static map",
  global_model: "Global model", not_available: "Not available",
};

export function StatusChip({ status }: { status: CoverageStatus }) {
  return (
    <span className={`chip status-chip status-${status}`}>
      <span className="status-icon" aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}
