import type { NwsAlert } from "./nws-alerts";
import type { WildfireFinding, WildfirePoint } from "./wildfire";
import type { EarthquakeObservation } from "./earthquakes";

export const ECHO_START_POINT: WildfirePoint = { latitude: 34.35, longitude: -118.4 };

export type PointSource<T> =
  | { status: "checked"; checkedAt: string; data: T; isStale?: boolean; staleReason?: string }
  | { status: "unavailable"; reason?: string; outOfCoverage?: boolean };

export function sourceApplies(source: PointSource<unknown> | null | undefined) {
  return !!source && !(source.status === "unavailable" && source.outOfCoverage);
}

export type EchoPointResult = {
  wildfire: PointSource<WildfireFinding>;
  alerts: PointSource<NwsAlert[]>;
  earthquake?: PointSource<EarthquakeObservation>;
};

export async function getEchoPoint(point: WildfirePoint, signal: AbortSignal): Promise<EchoPointResult> {
  const query = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
  });
  const response = await fetch(`/api/echo/point?${query}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("The point lookup could not be reached.");
  return response.json();
}
