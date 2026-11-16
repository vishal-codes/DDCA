import type { WildfirePoint } from "../data/wildfire";

export const USGS_TOPO = {
  name: "USGS The National Map",
  url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer",
  tileSize: 256,
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

export function visibleTiles(zoom: number, left: number, top: number, width: number, height: number) {
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
        url: `${USGS_TOPO.url}/tile/${zoom}/${row}/${column}`,
      });
    }
  }
  return tiles;
}
