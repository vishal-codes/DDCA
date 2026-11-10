import { StatusChip } from "@/components/shared/status-chip";
import { SourceTag } from "@/components/shared/source-tag";
import type { CoverageStatus } from "@/types/coverage";

const descriptions: readonly [CoverageStatus, string][] = [
  ["live", "Updates as the source does."],
  ["updated_daily", "Refreshed about once a day."],
  ["static_map", "Published map that rarely changes."],
  ["global_model", "Worldwide estimate. Marked Modeled."],
  ["not_available", "No source here. Shown gray, never as zero."],
];

export function DataLabelsGuide() {
  return (
    <section className="surface-card labels-guide" aria-labelledby="labels-title">
      <h2 id="labels-title">What the data labels mean</h2>
      <dl>{descriptions.map(([status, description]) => (
        <div key={status}><dt><StatusChip status={status} /></dt><dd>{description}</dd></div>
      ))}</dl>
      <p className="caption">Numbers are labeled <SourceTag kind="Measured" />, <SourceTag kind="Modeled" /> or Not enough data.</p>
    </section>
  );
}
