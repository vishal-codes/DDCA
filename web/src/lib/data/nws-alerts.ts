export const NWS_SOURCE = {
  name: "National Weather Service",
  url: "https://www.weather.gov/alerts",
  api: "https://api.weather.gov",
} as const;

export type NwsAlert = {
  url: string;
  webUrl?: string;
  headline: string;
  sent: string;
  expires: string;
  area: string | null;
  description: string | null;
  instruction: string | null;
  severity?: string | null;
  urgency?: string | null;
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

export function nwsAlertPageUrl(properties: Record<string, unknown>): string | undefined {
  if (typeof properties.web === "string") {
    try {
      const url = new URL(properties.web);
      if (url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443") &&
          (url.hostname === "weather.gov" || url.hostname.endsWith(".weather.gov")) &&
          !["api.weather.gov", "alerts.weather.gov", "alerts-v2.weather.gov"].includes(url.hostname)) return url.href;
    } catch {
      // Fall back to the issuing-office bulletin when its metadata is present.
    }
  }
  const parameters = properties.parameters && typeof properties.parameters === "object" && !Array.isArray(properties.parameters)
    ? properties.parameters as Record<string, unknown> : {};
  const awips = Array.isArray(parameters.AWIPSidentifier) ? parameters.AWIPSidentifier.find((value) => typeof value === "string" && /^[A-Z0-9]{3}[A-Z]{3}$/.test(value)) : undefined;
  const vtec = Array.isArray(parameters.VTEC) ? parameters.VTEC.find((value) => typeof value === "string" && /\/[A-Z]\.[A-Z]{3}\.[A-Z]{4}\./.test(value)) : undefined;
  const office = typeof awips === "string" ? awips.slice(-3) : typeof vtec === "string" ? vtec.match(/\/[A-Z]\.[A-Z]{3}\.[A-Z]([A-Z]{3})\./)?.[1] : undefined;
  const event = optionalText(properties.event);
  if (!office || !event || event.length > 120) return undefined;
  const url = new URL("https://forecast.weather.gov/wwamap/wwatxtget.php");
  url.searchParams.set("cwa", office.toLowerCase());
  url.searchParams.set("wwa", event.toLowerCase());
  return url.href;
}

export function nwsPointUrl(latitude: number, longitude: number) {
  const query = new URLSearchParams({
    point: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
  });
  return `${NWS_SOURCE.api}/alerts/active?${query}`;
}

export function readNwsAlerts(value: unknown, checkedAt: string): NwsAlert[] {
  if (!Number.isFinite(Date.parse(checkedAt))) throw new Error("Invalid NWS check time.");
  const feed = record(value);
  if (feed.type !== "FeatureCollection" || !Array.isArray(feed.features) ||
      (feed.pagination && record(feed.pagination).next)) {
    throw new Error("Invalid or incomplete NWS alert collection.");
  }
  const alerts = new Map<string, NwsAlert>();
  for (const feature of feed.features) {
    const { id, properties } = record(feature);
    const details = record(properties);
    const { status, messageType, headline, event, sent, expires, areaDesc, description, instruction, severity, urgency } = details;
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
      const webUrl = nwsAlertPageUrl(details);
      alerts.set(id, {
        url: id, headline: title, sent, expires,
        ...(webUrl ? { webUrl } : {}),
        area: optionalText(areaDesc), description: optionalText(description), instruction: optionalText(instruction),
        severity: optionalText(severity), urgency: optionalText(urgency),
      });
    }
  }
  const severities = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];
  const urgencies = ["Immediate", "Expected", "Future", "Past", "Unknown"];
  function priority(values: string[], value: string | null | undefined) {
    const index = values.indexOf(value ?? "Unknown");
    return index < 0 ? values.length : index;
  }
  return [...alerts.values()].sort((a, b) =>
    priority(severities, a.severity) - priority(severities, b.severity) ||
    priority(urgencies, a.urgency) - priority(urgencies, b.urgency) ||
    Date.parse(b.sent) - Date.parse(a.sent));
}
