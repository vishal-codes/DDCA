import { formatSampleDate } from "@/lib/format-date";

export function SampleCitation({ sourceName, updatedAt }: { sourceName: string; updatedAt: string }) {
  return <p className="caption sample-citation">Source: {sourceName}. <time dateTime={updatedAt}>{formatSampleDate(updatedAt)}</time>. Sample data.</p>;
}
