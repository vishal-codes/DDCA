import { formatSampleDate } from "@/lib/format-date";
import { DataAgeChip } from "./data-age-chip";

export function OfficialBanner({ message, sourceName, updatedAt, ageLabel, isStale = false }: {
  message: string; sourceName: string; updatedAt: string; ageLabel: string; isStale?: boolean;
}) {
  return (
    <aside className="official-banner" aria-label="Official alert, Sample data">
      <span className="chip official-label"><span aria-hidden="true" className="status-icon" />Official alert</span>
      <div>
        <p>{message}</p>
        <p className="caption">Sample data. Source: {sourceName}. <time dateTime={updatedAt}>{formatSampleDate(updatedAt)}</time>.</p>
      </div>
      <DataAgeChip updatedAt={updatedAt} label={ageLabel} isStale={isStale} />
    </aside>
  );
}
