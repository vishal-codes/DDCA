import type { StyleSpecification } from "maplibre-gl";
import type { WildfirePoint } from "../data/wildfire";

export const MAP_WORKER_PATH = "/api/map-assets/maplibre-gl-worker.mjs";

export type MapFailureKind = "provider" | "renderer";

export function mapFailure(error: unknown, styleLoaded: boolean, hasSource: boolean) {
  const details = error && typeof error === "object" ? error as { status?: number; name?: string; message?: string } : {};
  if (details.status === 401 || details.status === 403) {
    return { kind: "provider" as const, message: "The basemap provider rejected the request. Check the API key and allowed sites." };
  }
  if (details.name === "GPUInitializationError" || /webgl|gpu|worker|shader/i.test(details.message ?? "")) {
    return { kind: "renderer" as const, message: "The interactive map could not start. Check browser graphics support and retry." };
  }
  if (!styleLoaded && !hasSource) {
    return { kind: "provider" as const, message: "The basemap style could not load. Check the provider connection and retry." };
  }
  return null;
}

export function openFreeMapStyleUrl(theme: "light" | "night") {
  return `https://tiles.openfreemap.org/styles/${theme === "night" ? "dark" : "positron"}`;
}

export const USGS_TOPO = {
  name: "USGS The National Map",
  url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer",
  tileSize: 256,
} as const;

export const OSM_RASTER = {
  name: "OpenStreetMap",
  url: "https://tile.openstreetmap.org",
  tileSize: 256,
  attributionUrl: "https://www.openstreetmap.org/copyright",
} as const;

export function worldSize(zoom: number) {
  return USGS_TOPO.tileSize * 2 ** zoom;
}

export function project(point: WildfirePoint, zoom: number) {
  const size = worldSize(zoom);
  const latitude = Math.max(-85.05112878, Math.min(85.05112878, point.latitude)) * Math.PI / 180;
  return {
    x: (point.longitude + 180) / 360 * size,
    y: (1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2 * size,
  };
}

export function unproject(x: number, y: number, zoom: number): WildfirePoint {
  const size = worldSize(zoom);
  const clampedX = Math.max(0, Math.min(size, x));
  const clampedY = Math.max(0, Math.min(size, y));
  return {
    latitude: Math.atan(Math.sinh(Math.PI * (1 - 2 * clampedY / size))) * 180 / Math.PI,
    longitude: clampedX / size * 360 - 180,
  };
}

export function fitMapPoints(points: readonly WildfirePoint[], width: number, height: number, padding = 112) {
  if (!points.length || width <= 0 || height <= 0) return null;
  const size = worldSize(0);
  const anchor = project(points[0], 0).x;
  const positions = points.map((point) => {
    const position = project(point, 0);
    return { x: position.x + Math.round((anchor - position.x) / size) * size, y: position.y };
  });
  const xs = positions.map((position) => position.x);
  const ys = positions.map((position) => position.y);
  const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
  const scale = Math.min(Math.max(1, width - padding * 2) / Math.max(right - left, 1e-8),
    Math.max(1, height - padding * 2) / Math.max(bottom - top, 1e-8));
  return { center: unproject((((left + right) / 2) % size + size) % size, (top + bottom) / 2, 0),
    zoom: Math.max(2, Math.min(12, Math.log2(scale))) };
}

export function visibleTiles(zoom: number, left: number, top: number, width: number, height: number, provider: "usgs" | "osm" = "usgs") {
  const tiles = [];
  if (width <= 0 || height <= 0) return [];
  const size = USGS_TOPO.tileSize;
  const limit = 2 ** zoom - 1;
  for (let row = Math.max(0, Math.floor(top / size)); row <= Math.min(limit, Math.ceil((top + height) / size) - 1); row++) {
    for (let column = Math.max(0, Math.floor(left / size)); column <= Math.min(limit, Math.ceil((left + width) / size) - 1); column++) {
      tiles.push({
        key: `${zoom}/${row}/${column}`,
        left: column * size - left,
        top: row * size - top,
        url: provider === "osm"
          ? `${OSM_RASTER.url}/${zoom}/${column}/${row}.png`
          : `${USGS_TOPO.url}/tile/${zoom}/${row}/${column}`,
      });
    }
  }
  return tiles;
}

export function protomapsStyleUrl(theme: "light" | "night", apiKey: string | undefined) {
  const key = apiKey?.trim();
  if (!key) return null;
  const flavor = theme === "night" ? "dark" : "light";
  const query = new URLSearchParams({ key });
  return `https://api.protomaps.com/styles/v5/${flavor}/en.json?${query}`;
}

export function flatBasemapStyle(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    projection: { type: "mercator" },
    terrain: undefined,
    layers: style.layers.filter((layer) => layer.type !== "fill-extrusion"),
  };
}

export const USGS_STYLE = {
  version: 8 as const,
  sources: {
    usgs: {
      type: "raster" as const,
      tiles: [`${USGS_TOPO.url}/tile/{z}/{y}/{x}`],
      tileSize: USGS_TOPO.tileSize,
      maxzoom: 16,
      attribution: '<a href="https://www.usgs.gov/programs/national-geospatial-program/the-national-map">USGS The National Map</a>',
    },
  },
  layers: [{ id: "usgs", type: "raster" as const, source: "usgs" }],
};

export const USGS_NIGHT_STYLE = {
  ...USGS_STYLE,
  layers: [{
    ...USGS_STYLE.layers[0],
    paint: { "raster-brightness-max": 0.72, "raster-saturation": -0.2 },
  }],
};
