import assert from "node:assert/strict";
import test from "node:test";
import { nwsAlertPageUrl, nwsPointUrl, readNwsAlerts } from "../src/lib/data/nws-alerts.ts";
import { project, unproject, visibleTiles } from "../src/lib/map/basemap.ts";

const checkedAt = "2026-11-10T18:00:00Z";
const alert = {
  id: "https://api.weather.gov/alerts/urn:oid:example",
  properties: {
    status: "Actual",
    messageType: "Alert",
    headline: "Example official headline",
    areaDesc: "Example area",
    description: "First paragraph.\n\nSecond paragraph.",
    instruction: "Example official instruction.",
    sent: "2026-11-10T17:45:00Z",
    expires: "2026-11-10T21:00:00Z",
  },
};

test("the NWS query uses latitude-longitude order and four decimal places", () => {
  const url = new URL(nwsPointUrl(34.35001, -118.40002));
  assert.equal(url.pathname, "/alerts/active");
  assert.equal(url.searchParams.get("point"), "34.3500,-118.4000");
});

test("only unexpired actual alerts are shown with their official headline and dates", () => {
  const excluded = [
    { status: "Test" }, { messageType: "Cancel" }, { expires: checkedAt },
  ].map((patch, index) => ({
    id: `${alert.id}-${index}`,
    properties: { ...alert.properties, ...patch },
  }));
  const results = readNwsAlerts({ type: "FeatureCollection", features: [...excluded, alert, alert] }, checkedAt);
  assert.deepEqual(results, [{
    url: alert.id,
    headline: alert.properties.headline,
    sent: alert.properties.sent,
    expires: alert.properties.expires,
    area: alert.properties.areaDesc,
    description: alert.properties.description,
    instruction: alert.properties.instruction,
    severity: null,
    urgency: null,
  }]);
});

test("a checked empty feed stays distinct from errors, partial feeds and bad alert links", () => {
  const empty = { type: "FeatureCollection", features: [] };
  assert.deepEqual(readNwsAlerts(empty, checkedAt), []);
  assert.throws(() => readNwsAlerts({ status: 503 }, checkedAt), /Invalid/);
  assert.throws(() => readNwsAlerts({ ...empty, pagination: { next: "/next" } }, checkedAt), /incomplete/);
  assert.throws(() => readNwsAlerts({ ...empty, features: [{ ...alert, id: "https://example.com" }] }, checkedAt), /Invalid/);
});

test("a map click in projected pixels maps back to the queried coordinates", () => {
  const point = { latitude: 34.35, longitude: -118.4 };
  const center = project(point, 11);
  const result = unproject(center.x, center.y, 11);
  assert.ok(Math.abs(result.latitude - point.latitude) < 1e-9);
  assert.ok(Math.abs(result.longitude - point.longitude) < 1e-9);
});

test("USGS tile coordinates use zoom, row and column and cover the visible rectangle", () => {
  const tiles = visibleTiles(11, 280, 560, 512, 240);
  assert.equal(tiles.length, 6);
  assert.deepEqual(tiles[0], {
    key: "11/2/1",
    left: -24,
    top: -48,
    url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/11/2/1",
  });
  assert.deepEqual(visibleTiles(11, 0, 0, 0, 0), []);
});

test("an older severe official alert stays ahead of a newer minor advisory", () => {
  const warning = { ...alert, id: alert.id + "-warning",
    properties: { ...alert.properties, severity: "Severe", urgency: "Immediate", sent: "2026-11-10T17:00:00Z" } };
  const advisory = { ...alert, id: alert.id + "-advisory",
    properties: { ...alert.properties, severity: "Minor", urgency: "Immediate" } };
  const result = readNwsAlerts({ type: "FeatureCollection", features: [advisory, warning] }, checkedAt);
  assert.equal(result[0].url, warning.id);
});

test("NWS bulletin links use the source's alert type and issuing office instead of its JSON endpoint", () => {
  const properties = { ...alert.properties, event: "Beach Hazards Statement", parameters: { AWIPSidentifier: ["CFWLOX"] } };
  const result = readNwsAlerts({ type: "FeatureCollection", features: [{ ...alert, properties }] }, checkedAt);
  const page = new URL(result[0].webUrl);
  assert.equal(page.hostname, "forecast.weather.gov");
  assert.equal(page.pathname, "/wwamap/wwatxtget.php");
  assert.equal(page.searchParams.get("cwa"), "lox");
  assert.equal(page.searchParams.get("wwa"), "beach hazards statement");
  assert.equal(result[0].url, alert.id);
  assert.equal(result[0].description, properties.description);
});

test("NWS links reject retired and untrusted pages and can recover the office from VTEC", () => {
  const properties = { event: "Beach Hazards Statement", parameters: {
    VTEC: ["/O.CON.KLOX.BH.S.0025.000000T0000Z-261117T2300Z/"],
  } };
  const expected = nwsAlertPageUrl(properties);
  assert.ok(expected.includes("cwa=lox"));
  for (const web of ["javascript:alert(1)", "https://weather.gov.attacker.example/alert", "https://alerts.weather.gov/search?id=old"]) {
    assert.equal(nwsAlertPageUrl({ ...properties, web }), expected);
  }
  assert.equal(nwsAlertPageUrl({ web: "https://www.weather.gov/lox/" }), "https://www.weather.gov/lox/");
  assert.equal(nwsAlertPageUrl({ event: "Unknown office" }), undefined);
});
