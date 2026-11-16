const calFireLayerUrl = "https://services.arcgis.com/UHg8l1wC48WQyDSO/ArcGIS/rest/services/CalFire_FHSZSRA_2024/FeatureServer/0";

export const CAL_FIRE_SOURCE = {
  id: "cal-fire-sra-fhsz-2024",
  name: "CAL FIRE Fire Hazard Severity Zones (State Responsibility Area)",
  url: calFireLayerUrl,
  mapUrl: `https://www.arcgis.com/apps/mapviewer/index.html?url=${encodeURIComponent(calFireLayerUrl)}&source=sd`,
  mapDate: "2023-09-29",
  effectiveDate: "2024-04-01",
} as const;

export const WILDFIRE_SNAPSHOT_PATH = ".local/wildfire-point.json";

const categories = ["Moderate", "High", "Very High"] as const;
export type WildfireCategory = typeof categories[number];
export type WildfirePoint = { latitude: number; longitude: number };
export type WildfireZone = { id: number; category: WildfireCategory };
export type WildfireSnapshot = {
  sourceId: typeof CAL_FIRE_SOURCE.id;
  point: WildfirePoint;
  retrievedAt: string;
  zones: WildfireZone[];
};

export type WildfireFinding =
  | { status: "match"; category: WildfireCategory }
  | { status: "ambiguous"; categories: WildfireCategory[] }
  | { status: "unavailable" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isWildfireCategory(value: unknown): value is WildfireCategory {
  return categories.some((category) => category === value);
}

export function validateWildfirePoint(latitude: unknown, longitude: unknown): WildfirePoint {
  if (typeof latitude !== "number" || !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
      typeof longitude !== "number" || !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
    throw new Error("Enter a valid latitude and longitude in decimal degrees.");
  }
  return { latitude, longitude };
}

export function wildfireQueryUrl(point: WildfirePoint) {
  const { latitude, longitude } = validateWildfirePoint(point.latitude, point.longitude);
  const query = new URLSearchParams({
    where: "1=1",
    geometry: `${longitude},${latitude}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "OBJECTID,FHSZ_Description",
    returnGeometry: "false",
    f: "json",
  });
  return `${CAL_FIRE_SOURCE.url}/query?${query.toString()}`;
}

function validateZones(zones: unknown[]): WildfireZone[] {
  const seen = new Set<number>();
  return zones.map((zone) => {
    if (!isRecord(zone) || typeof zone.id !== "number" || !Number.isSafeInteger(zone.id) ||
        zone.id < 0 || seen.has(zone.id) || !isWildfireCategory(zone.category)) {
      throw new Error("The wildfire source returned an invalid or duplicate zone record.");
    }
    seen.add(zone.id);
    return { id: zone.id, category: zone.category };
  });
}

export function readWildfireQueryResult(value: unknown): WildfireZone[] {
  if (!isRecord(value) || "error" in value || value.exceededTransferLimit === true || !Array.isArray(value.features)) {
    throw new Error("The wildfire source returned an incomplete or invalid response.");
  }
  return validateZones(value.features.map((feature: unknown) => {
    const attributes = isRecord(feature) ? feature.attributes : null;
    return isRecord(attributes)
      ? { id: attributes.OBJECTID, category: attributes.FHSZ_Description }
      : null;
  }));
}

export function readWildfireSnapshot(value: unknown): WildfireSnapshot {
  if (!isRecord(value) || value.sourceId !== CAL_FIRE_SOURCE.id || !isRecord(value.point) ||
      typeof value.retrievedAt !== "string" || !Number.isFinite(Date.parse(value.retrievedAt)) ||
      !Array.isArray(value.zones)) {
    throw new Error("Invalid wildfire snapshot. Import the point again.");
  }
  return {
    sourceId: CAL_FIRE_SOURCE.id,
    point: validateWildfirePoint(value.point.latitude, value.point.longitude),
    retrievedAt: value.retrievedAt,
    zones: validateZones(value.zones),
  };
}

export function getWildfireFinding(zones: readonly WildfireZone[]): WildfireFinding {
  const matches = categories.filter((category) => zones.some((zone) => zone.category === category));
  if (matches.length === 0) return { status: "unavailable" };
  if (matches.length > 1) return { status: "ambiguous", categories: matches };
  return { status: "match", category: matches[0] };
}
