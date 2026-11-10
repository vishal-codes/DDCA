export function formatSampleDate(value: string, precision?: "year" | "month") {
  if (precision === "year") return String(new Date(value).getUTCFullYear());
  if (precision === "month") return new Intl.DateTimeFormat("en-GB", {
    month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(value));
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }).format(new Date(value)) + " UTC";
}
