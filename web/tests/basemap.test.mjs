import assert from "node:assert/strict";
import test from "node:test";
import { MercatorCoordinate } from "maplibre-gl";
import { GET as getMapAsset } from "../src/app/api/map-assets/[asset]/route.ts";
import { flatBasemapStyle, mapFailure, MAP_WORKER_PATH, openFreeMapStyleUrl, project, protomapsStyleUrl, USGS_STYLE } from "../src/lib/map/basemap.ts";

test("an absent provider key leaves the California raster fallback usable", () => {
  assert.equal(protomapsStyleUrl("light", undefined), null);
  assert.equal(protomapsStyleUrl("night", "  "), null);
  assert.equal(USGS_STYLE.sources.usgs.type, "raster");
  assert.ok(USGS_STYLE.sources.usgs.tiles[0].endsWith("/tile/{z}/{y}/{x}"));
});

test("theme changes select the hosted style and encode the provider key as one parameter", () => {
  const key = "example key&second=value";
  const light = new URL(protomapsStyleUrl("light", key));
  const night = new URL(protomapsStyleUrl("night", key));
  assert.equal(light.origin, "https://api.protomaps.com");
  assert.equal(light.pathname, "/styles/v5/light/en.json");
  assert.equal(night.pathname, "/styles/v5/dark/en.json");
  assert.deepEqual([...light.searchParams], [["key", key]]);
});

test("hosted styles cannot enable globe projection, terrain or raised buildings", () => {
  const style = {
    version: 8,
    projection: { type: "globe" },
    terrain: { source: "elevation" },
    sources: {},
    layers: [
      { id: "land", type: "background" },
      { id: "buildings", type: "fill-extrusion", source: "features" },
    ],
  };
  const flat = flatBasemapStyle(style);
  assert.deepEqual(flat.projection, { type: "mercator" });
  assert.equal(flat.terrain, undefined);
  assert.deepEqual(flat.layers.map((layer) => layer.id), ["land"]);
  assert.equal(style.layers.length, 2);
});

test("CAL FIRE overlay pixels align with MapLibre's 512px world through fractional zooms", () => {
  const point = { latitude: 34.35, longitude: -118.4 };
  const native = MercatorCoordinate.fromLngLat([point.longitude, point.latitude]);
  for (const zoom of [1, 9, 10.5, 16]) {
    const pixels = project(point, zoom + 1);
    const mapWorldSize = 512 * 2 ** zoom;
    assert.ok(Math.abs(pixels.x - native.x * mapWorldSize) < 1e-6);
    assert.ok(Math.abs(pixels.y - native.y * mapWorldSize) < 1e-6);
  }
});

test("one failed map resource does not discard the map and diagnostics never echo a provider URL", () => {
  const message = "Failed https://api.protomaps.com/example?key=secret";
  assert.equal(mapFailure({ status: 404, message }, true, true), null);
  assert.equal(mapFailure({ status: 403, message }, true, true)?.kind, "provider");
  assert.ok(!mapFailure({ status: 403, message }, true, true)?.message.includes("secret"));
  assert.equal(mapFailure({ name: "GPUInitializationError", message: "WebGL unavailable" }, false, false)?.kind, "renderer");
  assert.ok(MAP_WORKER_PATH.startsWith("/api/map-assets/"));
  assert.equal(new URL(openFreeMapStyleUrl("light")).hostname, "tiles.openfreemap.org");
});

test("the browser can fetch the installed same-origin module worker and arbitrary files stay inaccessible", async () => {
  const response = await getMapAsset(new Request("http://localhost" + MAP_WORKER_PATH), {
    params: Promise.resolve({ asset: "maplibre-gl-worker.mjs" }),
  });
  assert.equal(response.status, 200);
  assert.ok(response.headers.get("Content-Type").startsWith("text/javascript"));
  const worker = await response.text();
  assert.ok(worker.includes("MapLibre GL JS") && worker.length > 10000);
  const blocked = await getMapAsset(new Request("http://localhost/api/map-assets/secret"), {
    params: Promise.resolve({ asset: "../../.env.local" }),
  });
  assert.equal(blocked.status, 404);
});
