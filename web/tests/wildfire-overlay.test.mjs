import assert from "node:assert/strict";
import test from "node:test";
import { createWildfireZoneCache } from "../src/lib/data/wildfire-zone-cache.ts";
import { project } from "../src/lib/map/basemap.ts";
import { loadComponent, renderComponent } from "./helpers/render-component.mjs";

const polygon = (id) => ({ id, category: "High", rings: [[[0, 0], [1, 0], [1, 1], [0, 0]]] });

test("CAL FIRE requests share stable geometry and detail while the camera moves within a small zoom interval", () => {
  const urlFor = loadComponent("src/lib/data/wildfire-zones.ts", "wildfireViewportUrl");
  const urls = new Set();
  for (let index = 0; index < 40; index++) {
    const zoom = 10.1 + index * 0.001;
    const center = project({ latitude: 34.35, longitude: -118.4 }, zoom);
    urls.add(urlFor({ zoom, left: center.x - 450, top: center.y - 325, width: 900, height: 650 }));
  }
  assert.ok(urls.size <= 4, `${urls.size} distinct requests for a small zoom interval`);
  assert.equal(new Set([...urls].map((url) => new URL(url).searchParams.get("maxAllowableOffset"))).size, 1);
});

test("canceling one viewport does not cancel a shared CAL FIRE fetch or discard its result", async () => {
  let finish;
  let calls = 0;
  let requestSignal;
  const cache = createWildfireZoneCache(async (_url, signal) => {
    calls++;
    requestSignal = signal;
    return new Promise((resolve) => { finish = resolve; });
  });
  const first = new AbortController();
  const cancelled = cache.read("area-a", first.signal).catch((error) => error.name);
  const second = cache.read("area-a", new AbortController().signal);
  first.abort();
  assert.equal(requestSignal.aborted, false);
  finish([polygon(1)]);
  assert.equal(await cancelled, "AbortError");
  assert.deepEqual(await second, [polygon(1)]);
  assert.deepEqual(await cache.read("area-a", new AbortController().signal), [polygon(1)]);
  assert.equal(calls, 1);
});

test("empty or failed views retain cached geometry and overlapping views do not double-fill a zone", async () => {
  const cache = createWildfireZoneCache(async (url) => {
    if (url === "failed") throw new Error("Source unavailable");
    return url === "empty" ? [] : url === "overlap" ? [polygon(1), polygon(2)] : [polygon(1)];
  });
  await cache.read("first", new AbortController().signal);
  const snapshot = cache.getSnapshot();
  assert.equal(cache.getSnapshot(), snapshot);
  await cache.read("empty", new AbortController().signal);
  assert.deepEqual(cache.getSnapshot(), [polygon(1)]);
  await assert.rejects(cache.read("failed", new AbortController().signal), /unavailable/);
  assert.deepEqual(cache.getSnapshot(), [polygon(1)]);
  await cache.read("overlap", new AbortController().signal);
  assert.deepEqual(cache.getSnapshot().map((item) => item.id), [1, 2]);
});

test("the CAL FIRE cache bounds retained areas and notifies subscribers when data arrives", async () => {
  let updates = 0;
  const cache = createWildfireZoneCache(async (url) => [polygon(Number(url))], 2);
  const unsubscribe = cache.subscribe(() => updates++);
  for (const url of ["1", "2", "3"]) await cache.read(url, new AbortController().signal);
  assert.equal(cache.peek("1"), undefined);
  assert.deepEqual(cache.getSnapshot().map((item) => item.id), [2, 3]);
  assert.ok(updates >= 3);
  unsubscribe();
  const previous = updates;
  await cache.read("4", new AbortController().signal);
  assert.equal(updates, previous);
});

test("the wildfire canvas stays mounted when zooming out and source geometry requires stable IDs", () => {
  const html = renderComponent("src/components/map/wildfire-zone-overlay.tsx", "WildfireZoneOverlay", {
    viewport: { zoom: 7, left: 1000, top: 1000, width: 900, height: 650 },
  });
  assert.match(html, /<canvas class="wildfire-zone-overlay"/);
  const read = loadComponent("src/lib/data/wildfire-zones.ts", "readWildfirePolygons");
  const feature = { attributes: { OBJECTID: 7, FHSZ_Description: "High" }, geometry: { rings: polygon(7).rings } };
  const response = { features: [feature], spatialReference: { wkid: 3857 } };
  assert.equal(read(response)[0].id, 7);
  assert.throws(() => read({ ...response, features: [{ ...feature, attributes: { FHSZ_Description: "High" } }] }), /Invalid/);
});
