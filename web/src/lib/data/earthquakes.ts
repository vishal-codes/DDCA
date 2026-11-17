import type { WildfirePoint } from "./wildfire";

export const EARTHQUAKE_SOURCE = {
  name: "USGS Earthquake Catalog",
  url: "https://earthquake.usgs.gov/earthquakes/map/",
  api: "https://earthquake.usgs.gov/fdsnws/event/1/query",
} as const;

export type ObservedEarthquake = {
  id: string; title: string; url: string; occurredAt: string;
  magnitude: number | null; latitude: number; longitude: number;
};
export type EarthquakeObservation = {
  events: ObservedEarthquake[]; since: string; radiusKm: number;
  minimumMagnitude: number; limit: number;
  catalogUrl?: string;
};

function catalogSearchUrl(point: WildfirePoint, query: URLSearchParams) {
  const params = Object.fromEntries(query);
  delete params.format;
  const url = new URL(EARTHQUAKE_SOURCE.url);
  url.searchParams.set("range", "search");
  url.searchParams.set("search", JSON.stringify({ name: "Selected area", params }));
  url.searchParams.set("autoUpdate", "false");
  url.searchParams.set("timeZone", "utc");
  const latitudeSpan = Number(params.maxradiuskm) / 6371 * 180 / Math.PI * 1.2;
  const longitudeSpan = Math.min(180, latitudeSpan / Math.max(0.01, Math.cos(point.latitude * Math.PI / 180)));
  url.searchParams.append("extent", `${Math.max(-85, point.latitude - latitudeSpan)},${point.longitude - longitudeSpan}`);
  url.searchParams.append("extent", `${Math.min(85, point.latitude + latitudeSpan)},${point.longitude + longitudeSpan}`);
  return url.href;
}

export function earthquakeQuery(point: WildfirePoint, checkedAt: string) {
  const since = new Date(Date.parse(checkedAt) - 30 * 86400000).toISOString();
  const query = new URLSearchParams({
    format: "geojson", latitude: String(point.latitude), longitude: String(point.longitude),
    maxradiuskm: "100", starttime: since, endtime: checkedAt,
    minmagnitude: "2.5", eventtype: "earthquake", limit: "100", orderby: "time",
  });
  return { url: `${EARTHQUAKE_SOURCE.api}?${query}`, since, catalogUrl: catalogSearchUrl(point, query) };
}

export function readEarthquakes(value: unknown, since: string, catalogUrl?: string): EarthquakeObservation {
  if (!value || typeof value !== "object") throw new Error("Invalid earthquake response.");
  const body = value as Record<string, unknown>;
  if (body.type !== "FeatureCollection" || !Array.isArray(body.features)) {
    throw new Error("Invalid earthquake collection.");
  }
  const events = body.features.map((feature: unknown): ObservedEarthquake => {
    if (!feature || typeof feature !== "object") throw new Error("Invalid earthquake feature.");
    const event = feature as { id?: unknown; properties?: Record<string, unknown>; geometry?: { coordinates?: unknown[] } };
    const properties = event.properties;
    const coordinates = event.geometry?.coordinates;
    if (typeof event.id !== "string" || typeof properties?.title !== "string" ||
        typeof properties.url !== "string" || !properties.url.startsWith("https://earthquake.usgs.gov/") ||
        typeof properties.time !== "number" || !Number.isFinite(properties.time) ||
        !coordinates || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number" ||
        !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1]) ||
        Math.abs(coordinates[0]) > 180 || Math.abs(coordinates[1]) > 90) {
      throw new Error("Invalid earthquake record.");
    }
    return {
      id: event.id, title: properties.title, url: properties.url,
      occurredAt: new Date(properties.time).toISOString(),
      magnitude: typeof properties.mag === "number" && Number.isFinite(properties.mag) ? properties.mag : null,
      longitude: coordinates[0], latitude: coordinates[1],
    };
  });
  return { events, since, radiusKm: 100, minimumMagnitude: 2.5, limit: 100, ...(catalogUrl ? { catalogUrl } : {}) };
}
