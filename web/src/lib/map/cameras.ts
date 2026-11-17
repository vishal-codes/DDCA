import type { RegionId } from "@/types/region";

export type MapCamera = {
  longitude: number;
  latitude: number;
  zoom: number;
};

export const HOME_CAMERA: MapCamera = { longitude: 10, latitude: 15, zoom: 1.5 };

export const REGION_CAMERAS: Record<RegionId, MapCamera> = {
  "los-angeles": { longitude: -118.4, latitude: 34.35, zoom: 10 },
  lisbon: { longitude: -9.14, latitude: 38.72, zoom: 10 },
  jakarta: { longitude: 106.85, latitude: -6.21, zoom: 10 },
};
