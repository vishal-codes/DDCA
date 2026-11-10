import type { MeasurementKind } from "@/types/coverage";

export function SourceTag({ kind }: { kind: MeasurementKind }) {
  return <span className="chip source-tag">{kind}</span>;
}
