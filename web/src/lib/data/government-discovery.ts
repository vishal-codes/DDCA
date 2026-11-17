import type { WildfirePoint } from "./wildfire";
import type { GovernmentDiscoveryJob } from "../government/types";

export async function startGovernmentDiscovery(point: WildfirePoint, signal: AbortSignal): Promise<GovernmentDiscoveryJob> {
  const response = await fetch("/api/government-discovery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(point),
    signal: AbortSignal.any([signal, AbortSignal.timeout(90000)]),
  });
  if (!response.ok) throw new Error("The government-source search could not start.");
  return response.json();
}

export async function getGovernmentDiscovery(id: string, signal: AbortSignal): Promise<GovernmentDiscoveryJob> {
  const response = await fetch(`/api/government-discovery?id=${encodeURIComponent(id)}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("The government-source search could not be checked.");
  return response.json();
}
