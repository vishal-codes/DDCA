import type { PlaceMatch } from "./places";

const baseUrl = process.env.GEOCODER_URL || "https://nominatim.openstreetmap.org";
const cache = new Map<string, { expires: number; places: PlaceMatch[] }>();
let pending: Promise<unknown> = Promise.resolve();
let nextRequestAt = 0;

function readPlace(value: unknown): PlaceMatch {
  if (!value || typeof value !== "object") throw new Error("Invalid location.");
  const place = value as Record<string, unknown>;
  if ((typeof place.lat !== "string" && typeof place.lat !== "number") ||
      (typeof place.lon !== "string" && typeof place.lon !== "number") ||
      String(place.lat).trim() === "" || String(place.lon).trim() === "") throw new Error("Invalid location.");
  const latitude = Number(place.lat);
  const longitude = Number(place.lon);
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
      !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
      typeof place.display_name !== "string" || !place.display_name.trim()) throw new Error("Invalid location.");
  const address = place.address as Record<string, unknown> | undefined;
  function addressName(...keys: string[]) {
    for (const key of keys) if (typeof address?.[key] === "string" && address[key].trim()) return address[key].trim();
    return null;
  }
  return {
    id: String(place.place_id),
    name: place.display_name,
    latitude, longitude,
    countryCode: typeof address?.country_code === "string" ? address.country_code.toLowerCase() : null,
    jurisdiction: {
      city: addressName("city", "town", "municipality", "village"),
      district: addressName("state_district", "county"), state: addressName("state"),
    },
  };
}

async function requestPlaces(path: string): Promise<PlaceMatch[]> {
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now()) return cached.places;
  const response = await fetch(new URL(path, baseUrl), {
    headers: { "User-Agent": "SafeEarth/0.1 (user-requested place lookup)", Accept: "application/json", "Accept-Language": "en" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Location search is unavailable.");
  const body: unknown = await response.json();
  const places = (Array.isArray(body) ? body : [body]).map(readPlace);
  if (cache.size >= 500) cache.delete(cache.keys().next().value!);
  cache.set(path, { places, expires: Date.now() + 86400000 });
  return places;
}

function queuedRequest(path: string): Promise<PlaceMatch[]> {
  const request = pending.then(async () => {
    const cached = cache.get(path);
    if (cached && cached.expires > Date.now()) return cached.places;
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, nextRequestAt - Date.now())));
    nextRequestAt = Date.now() + 1100;
    return requestPlaces(path);
  });
  pending = request.catch(() => undefined);
  return request;
}

export function searchPlaces(query: string) {
  const params = new URLSearchParams({ q: query, format: "jsonv2", addressdetails: "1", limit: "5", "accept-language": "en" });
  return queuedRequest(`/search?${params}`);
}

export async function reversePlace(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    lat: latitude.toFixed(3), lon: longitude.toFixed(3), format: "jsonv2", addressdetails: "1", zoom: "10", "accept-language": "en",
  });
  const places = await queuedRequest(`/reverse?${params}`);
  return places[0];
}
