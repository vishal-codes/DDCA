import type { EchoPointResult, PointSource } from "./echo-point";
import { nwsPointUrl, readNwsAlerts } from "./nws-alerts";
import { getWildfireFinding, readWildfireQueryResult, wildfireQueryUrl, type WildfirePoint } from "./wildfire";
import { earthquakeQuery, readEarthquakes } from "./earthquakes";
import { reversePlace } from "./places-server";

const lastChecks = new Map<string, { checkedAt: string; data: unknown }>();

async function checkSource<T>(
  url: string,
  signal: AbortSignal,
  parse: (body: unknown, checkedAt: string) => T,
  headers?: HeadersInit,
  cacheKey = url,
): Promise<PointSource<T>> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers,
      signal: AbortSignal.any([signal, AbortSignal.timeout(7000)]),
    });
    if (!response.ok) throw new Error("The source request failed.");
    const body: unknown = await response.json();
    const checkedAt = new Date().toISOString();
    const data = parse(body, checkedAt);
    if (lastChecks.size >= 500) lastChecks.delete(lastChecks.keys().next().value!);
    lastChecks.set(cacheKey, { checkedAt, data });
    return { status: "checked", checkedAt, data };
  } catch {
    const previous = lastChecks.get(cacheKey);
    return previous
      ? { status: "checked", checkedAt: previous.checkedAt, data: previous.data as T,
        isStale: true, staleReason: "The latest check failed. Showing the previous source snapshot." }
      : { status: "unavailable", reason: "The source could not be checked. Try refreshing." };
  }
}

export async function checkEchoPoint(point: WildfirePoint, signal: AbortSignal): Promise<EchoPointResult> {
  const earthquake = earthquakeQuery(point, new Date().toISOString());
  const shakingCheck = checkSource(earthquake.url, signal, (body) => readEarthquakes(body, earthquake.since, earthquake.catalogUrl), undefined,
    `usgs-earthquakes:${point.latitude},${point.longitude}`);
  const place = await reversePlace(point.latitude, point.longitude).catch(() => null);
  const inUsBounds = place?.countryCode === "us";
  const inCalifornia = inUsBounds && point.latitude >= 32.4 && point.latitude <= 42.1 && point.longitude >= -124.6 && point.longitude <= -114.1 &&
    (!place?.jurisdiction?.state || place.jurisdiction.state.toLowerCase() === "california");
  const [wildfire, alerts, shaking] = await Promise.all([
    inCalifornia ? checkSource(wildfireQueryUrl(point), signal, (body) => getWildfireFinding(readWildfireQueryResult(body)))
      : Promise.resolve({ status: "unavailable" as const, outOfCoverage: true, reason: "The CAL FIRE layer covers California State Responsibility Areas." }),
    inUsBounds ? checkSource(nwsPointUrl(point.latitude, point.longitude), signal, readNwsAlerts, {
      Accept: "application/geo+json",
      "User-Agent": "SafeEarth-ECHO/0.1",
    }) : Promise.resolve({ status: "unavailable" as const, outOfCoverage: true, reason: "NWS alerts cover United States forecast areas. Local government alerts are needed here." }),
    shakingCheck,
  ]);
  return { wildfire, alerts, earthquake: shaking };
}
