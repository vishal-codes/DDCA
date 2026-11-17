import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const routePath = resolve(".next/server/app/api/map-assets/[asset]/route.js");
const { default: compiledRoute } = await import(pathToFileURL(routePath).href);
const { GET } = compiledRoute.routeModule.userland;

for (const asset of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  const response = await GET(new Request(`http://localhost/api/map-assets/${asset}`), {
    params: Promise.resolve({ asset }),
  });
  assert.equal(response.status, 200, `Built map asset ${asset} must resolve from the installed package.`);
  assert.match(response.headers.get("Content-Type"), /javascript/);
  const content = await response.text();
  if (asset === "maplibre-gl-worker.mjs") {
    assert.ok(content.includes("MapLibre GL JS") && content.length > 10000, "The worker must contain MapLibre JavaScript.");
  }
}

console.log("Built MapLibre worker and shared module verified.");
