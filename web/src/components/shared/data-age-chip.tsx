import { formatSampleDate } from "@/lib/format-date";

export function DataAgeChip({ updatedAt, label, isStale = false }: {
  updatedAt: string | null; label?: string; isStale?: boolean;
}) {
  if (!updatedAt) return <span className="chip missing-chip">Not enough data</span>;
  return (
    <time dateTime={updatedAt} title={formatSampleDate(updatedAt)} className={`chip data-age-chip${isStale ? " is-stale" : ""}`}>
      {isStale ? "May be out of date" : (label ?? formatSampleDate(updatedAt))}
    </time>
  );
}
