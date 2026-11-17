export type PlaceMatch = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  countryCode: string | null;
  jurisdiction?: { city: string | null; district: string | null; state: string | null };
};

export async function getPlaceMatches(query: string, signal: AbortSignal): Promise<PlaceMatch[]> {
  const response = await fetch(`/api/places?q=${encodeURIComponent(query)}`, { signal });
  if (!response.ok) throw new Error("Location search is unavailable. Select a point on the map or try again.");
  const result: unknown = await response.json();
  if (!Array.isArray(result)) throw new Error("Location search returned an invalid response.");
  return result;
}
