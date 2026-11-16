import { USGS_TOPO, worldSize } from "../map/basemap";
import { CAL_FIRE_SOURCE, isWildfireCategory, type WildfireCategory } from "./wildfire";

export const WILDFIRE_ZONE_MIN_ZOOM = 9;
export const WEB_MERCATOR_HALF_WORLD = Math.PI * 6378137;

export type MapViewport = { zoom: number; left: number; top: number; width: number; height: number };
type Position = [number, number];
export type WildfirePolygon = { category: WildfireCategory; rings: Position[][] };

export function wildfireViewportUrl({ zoom, left, top, width, height }: MapViewport) {
  if (zoom < WILDFIRE_ZONE_MIN_ZOOM || width <= 0 || height <= 0) return null;
  const world = worldSize(zoom);
  const tile = USGS_TOPO.tileSize;
  const metersPerPixel = WEB_MERCATOR_HALF_WORLD * 2 / world;
  const xmin = Math.max(0, Math.floor(left / tile) * tile) * metersPerPixel - WEB_MERCATOR_HALF_WORLD;
  const ymin = WEB_MERCATOR_HALF_WORLD - Math.min(world, Math.ceil((top + height) / tile) * tile) * metersPerPixel;
  const xmax = Math.min(world, Math.ceil((left + width) / tile) * tile) * metersPerPixel - WEB_MERCATOR_HALF_WORLD;
  const ymax = WEB_MERCATOR_HALF_WORLD - Math.max(0, Math.floor(top / tile) * tile) * metersPerPixel;
  const query = new URLSearchParams({
    where: "1=1",
    geometry: [xmin, ymin, xmax, ymax].join(","),
    geometryType: "esriGeometryEnvelope",
    inSR: "3857",
    outSR: "3857",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FHSZ_Description",
    returnGeometry: "true",
    returnZ: "false",
    maxAllowableOffset: String(Math.max(10, metersPerPixel)),
    geometryPrecision: "1",
    f: "json",
  });
  return `${CAL_FIRE_SOURCE.url}/query?${query}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid wildfire zone geometry.");
  }
  return value as Record<string, unknown>;
}

function readPosition(value: unknown): Position {
  if (!Array.isArray(value) || value.length !== 2 || value.some((coordinate) => !Number.isFinite(coordinate))) {
    throw new Error("Invalid wildfire zone coordinates.");
  }
  return [value[0], value[1]];
}

function readRing(value: unknown): Position[] {
  if (!Array.isArray(value) || value.length < 4) throw new Error("Invalid wildfire zone ring.");
  const ring = value.map(readPosition);
  const [x, y] = ring[0];
  const [lastX, lastY] = ring[ring.length - 1];
  if (x !== lastX || y !== lastY) throw new Error("Unclosed wildfire zone ring.");
  return ring;
}

export function readWildfirePolygons(value: unknown): WildfirePolygon[] {
  const result = asRecord(value);
  if ("error" in result || result.exceededTransferLimit === true || !Array.isArray(result.features)) {
    throw new Error("Invalid or incomplete wildfire zone response.");
  }
  if (result.features.length === 0) return [];
  const { wkid, latestWkid } = asRecord(result.spatialReference);
  if (wkid !== 3857 && wkid !== 102100 && latestWkid !== 3857) {
    throw new Error("Unexpected wildfire zone projection.");
  }
  const polygons: WildfirePolygon[] = [];
  for (const feature of result.features) {
    const { attributes, geometry } = asRecord(feature);
    const category = asRecord(attributes).FHSZ_Description;
    const { rings } = asRecord(geometry);
    if (!isWildfireCategory(category) || !Array.isArray(rings)) {
      throw new Error("Invalid wildfire zone category or geometry.");
    }
    if (rings.length > 0) polygons.push({ category, rings: rings.map(readRing) });
  }
  return polygons;
}

export async function getWildfirePolygons(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]) });
  if (!response.ok) throw new Error("CAL FIRE zones could not be loaded.");
  return readWildfirePolygons(await response.json());
}
