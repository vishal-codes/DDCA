export const NWS_SOURCE = {
  name: "National Weather Service",
  url: "https://www.weather.gov/alerts",
  api: "https://api.weather.gov",
} as const;

export type NwsAlert = {
  url: string;
  headline: string;
  sent: string;
  expires: string;
  area: string | null;
  description: string | null;
  instruction: string | null;
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid NWS alert response.");
  }
  return value as Record<string, unknown>;
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export function nwsPointUrl(latitude: number, longitude: number) {
  const query = new URLSearchParams({
    point: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
  });
  return `${NWS_SOURCE.api}/alerts/active?${query}`;
}

export function readNwsAlerts(value: unknown, checkedAt: string): NwsAlert[] {
  const feed = record(value);
  if (feed.type !== "FeatureCollection" || !Array.isArray(feed.features) ||
      (feed.pagination && record(feed.pagination).next)) {
    throw new Error("Invalid or incomplete NWS alert collection.");
  }
  const alerts = new Map<string, NwsAlert>();
  for (const feature of feed.features) {
    const { id, properties } = record(feature);
    const { status, messageType, headline, event, sent, expires, areaDesc, description, instruction } = record(properties);
    if (typeof status !== "string" || typeof messageType !== "string") {
      throw new Error("Missing NWS alert status or message type.");
    }
    if (status !== "Actual" || (messageType !== "Alert" && messageType !== "Update")) continue;

    const title = typeof headline === "string" && headline.trim() ? headline : event;
    if (typeof id !== "string" || !id.startsWith(`${NWS_SOURCE.api}/alerts/`) ||
        typeof title !== "string" || !title.trim() ||
        typeof sent !== "string" || !Number.isFinite(Date.parse(sent)) ||
        typeof expires !== "string" || !Number.isFinite(Date.parse(expires))) {
      throw new Error("Invalid NWS alert record.");
    }
    if (Date.parse(expires) > Date.parse(checkedAt)) {
      alerts.set(id, {
        url: id, headline: title, sent, expires,
        area: optionalText(areaDesc), description: optionalText(description), instruction: optionalText(instruction),
      });
    }
  }
  return [...alerts.values()].sort((a, b) => Date.parse(b.sent) - Date.parse(a.sent));
}
