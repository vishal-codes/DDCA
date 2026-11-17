import assert from "node:assert/strict";
import test from "node:test";
import { earthquakeQuery, readEarthquakes } from "../src/lib/data/earthquakes.ts";
import { renderComponent } from "./helpers/render-component.mjs";

test("Kushiro source links open the same geographic catalog search as the observation query", () => {
  const point = { latitude: 42.9849503, longitude: 144.3820491 };
  const query = earthquakeQuery(point, "2026-11-17T08:27:00Z");
  const catalog = new URL(query.catalogUrl);
  const api = new URL(query.url);
  const search = JSON.parse(catalog.searchParams.get("search"));
  assert.equal(catalog.searchParams.get("range"), "search");
  assert.equal(catalog.searchParams.get("autoUpdate"), "false");
  for (const name of ["latitude", "longitude", "maxradiuskm", "starttime", "endtime", "minmagnitude", "eventtype", "limit"]) {
    assert.equal(search.params[name], api.searchParams.get(name));
  }
  const [southwest, northeast] = catalog.searchParams.getAll("extent").map((extent) => extent.split(",").map(Number));
  assert.ok(southwest[0] < point.latitude && northeast[0] > point.latitude);
  assert.ok(southwest[1] < point.longitude && northeast[1] > point.longitude);
  const data = readEarthquakes({ type: "FeatureCollection", features: [] }, query.since, query.catalogUrl);
  const html = renderComponent("src/components/echo/echo-evidence.tsx", "EchoEvidence", {
    result: { earthquake: { status: "checked", checkedAt: "2026-11-17T08:27:00Z", data } },
  });
  assert.ok(html.includes(query.catalogUrl.replaceAll("&", "&amp;")));
  assert.ok(!html.includes('href="https://earthquake.usgs.gov/earthquakes/map/"'));
});

test("global earthquake queries retain coordinates, time window and observation filters", () => {
  const { url, since } = earthquakeQuery({ latitude: 35.68, longitude: 139.69 }, "2026-11-16T00:00:00Z");
  const query = new URL(url).searchParams;
  assert.equal(query.get("latitude"), "35.68");
  assert.equal(query.get("longitude"), "139.69");
  assert.equal(query.get("maxradiuskm"), "100");
  assert.equal(query.get("minmagnitude"), "2.5");
  assert.equal(query.get("eventtype"), "earthquake");
  assert.equal(since, "2026-10-17T00:00:00.000Z");
});

test("empty earthquake observations require a successful valid collection", () => {
  assert.deepEqual(readEarthquakes({ type: "FeatureCollection", features: [] }, "2026-10-17").events, []);
  assert.throws(() => readEarthquakes({ error: "Unavailable" }, "2026-10-17"), /Invalid/);
  assert.throws(() => readEarthquakes({ type: "FeatureCollection", features: [{}] }, "2026-10-17"), /Invalid/);
});

test("earthquake observations keep official event links and their actual occurrence time", () => {
  const event = {
    id: "example", properties: {
      title: "Example published event", url: "https://earthquake.usgs.gov/earthquakes/eventpage/example",
      time: Date.parse("2026-11-15T12:00:00Z"), mag: 3.2,
    },
    geometry: { coordinates: [139.7, 35.6, 10] },
  };
  const result = readEarthquakes({ type: "FeatureCollection", features: [event] }, "2026-10-17");
  assert.equal(result.events[0].occurredAt, "2026-11-15T12:00:00.000Z");
  assert.equal(result.events[0].url, event.properties.url);
  assert.throws(() => readEarthquakes({
    type: "FeatureCollection", features: [{ ...event, properties: { ...event.properties, url: "https://example.org" } }],
  }, "2026-10-17"), /Invalid/);
  assert.throws(() => readEarthquakes({
    type: "FeatureCollection", features: [{ ...event, geometry: { coordinates: [500, 95, 10] } }],
  }, "2026-10-17"), /Invalid/);
});
