export function googleMapsLink(origin: string, destination: string, waypoints: readonly string[] = [], mobile = false) {
  const params = new URLSearchParams({ api: "1", origin: origin.trim(), destination: destination.trim(), travelmode: "driving" });
  if (!origin.trim() || !destination.trim()) return null;
  const stops = waypoints.map((value) => value.trim().replaceAll("|", " ")).filter(Boolean).slice(0, mobile ? 3 : 9);
  if (stops.length) params.set("waypoints", stops.join("|"));
  const url = `https://www.google.com/maps/dir/?${params.toString()}`;
  return url.length <= 2048 ? url : null;
}
