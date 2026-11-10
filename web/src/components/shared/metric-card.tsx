import type { MeasurementKind } from "@/types/coverage";
import { SourceTag } from "./source-tag";
import { DataAgeChip } from "./data-age-chip";
import { SampleCitation } from "./sample-citation";

export function MetricCard({ title, value, sourceName, updatedAt, kind, isStale = false }: {
  title: string; value: string; sourceName: string; updatedAt: string; kind: MeasurementKind; isStale?: boolean;
}) {
  const missing = value === "Not enough data";
  return <section className="surface-card metric-card">
    <h2 className="caption">{title}</h2><p className={missing ? "metric-value missing-value" : "metric-value"}>{value}</p>
    {missing ? <p className="caption">Source: {sourceName}. Sample data.</p> : <><SampleCitation sourceName={sourceName} updatedAt={updatedAt} />
      <div className="chip-group"><SourceTag kind={kind} /><DataAgeChip updatedAt={updatedAt} label="Sample snapshot" isStale={isStale} /></div></>}
  </section>;
}
