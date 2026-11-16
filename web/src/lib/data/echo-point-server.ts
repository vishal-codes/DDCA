import type { EchoPointResult, PointSource } from "./echo-point";
import { nwsPointUrl, readNwsAlerts } from "./nws-alerts";
import { getWildfireFinding, readWildfireQueryResult, wildfireQueryUrl, type WildfirePoint } from "./wildfire";

async function checkSource<T>(
  url: string,
  signal: AbortSignal,
  parse: (body: unknown, checkedAt: string) => T,
  headers?: HeadersInit,
): Promise<PointSource<T>> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers,
      signal: AbortSignal.any([signal, AbortSignal.timeout(7000)]),
    });
    if (!response.ok) return { status: "unavailable" };
    const body: unknown = await response.json();
    const checkedAt = new Date().toISOString();
    return { status: "checked", checkedAt, data: parse(body, checkedAt) };
  } catch {
    return { status: "unavailable" };
  }
}

export async function checkEchoPoint(point: WildfirePoint, signal: AbortSignal): Promise<EchoPointResult> {
  const [wildfire, alerts] = await Promise.all([
    checkSource(wildfireQueryUrl(point), signal, (body) => getWildfireFinding(readWildfireQueryResult(body))),
    checkSource(nwsPointUrl(point.latitude, point.longitude), signal, readNwsAlerts, {
      Accept: "application/geo+json",
      "User-Agent": "SafeEarth-ECHO/0.1",
    }),
  ]);
  return { wildfire, alerts };
}
