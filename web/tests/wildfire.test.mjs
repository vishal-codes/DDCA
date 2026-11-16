import assert from "node:assert/strict";
import test from "node:test";
import {
  CAL_FIRE_SOURCE, getWildfireFinding, readWildfireQueryResult,
  readWildfireSnapshot, validateWildfirePoint, wildfireQueryUrl,
} from "../src/lib/data/wildfire.ts";

const samplePoint = { latitude: 34.35, longitude: -118.4 };

test("CAL FIRE query uses the pinned layer and longitude-latitude order", () => {
  const url = new URL(wildfireQueryUrl(samplePoint));
  assert.equal(`${url.origin}${url.pathname}`, `${CAL_FIRE_SOURCE.url}/query`);
  assert.equal(url.searchParams.get("geometry"), "-118.4,34.35");
  assert.equal(url.searchParams.get("geometryType"), "esriGeometryPoint");
  assert.equal(url.searchParams.get("inSR"), "4326");
  assert.equal(url.searchParams.get("spatialRel"), "esriSpatialRelIntersects");
});

test("invalid coordinates are rejected before querying", () => {
  assert.throws(() => validateWildfirePoint(91, -118), /valid latitude/);
  assert.throws(() => validateWildfirePoint(34, -181), /valid latitude/);
  assert.throws(() => validateWildfirePoint(NaN, -118), /valid latitude/);
  assert.throws(() => validateWildfirePoint("34", -118), /valid latitude/);
});

test("the published category is preserved", () => {
  const zones = readWildfireQueryResult({ features: [{ attributes: { OBJECTID: 7, FHSZ_Description: "Very High" } }] });
  assert.deepEqual(getWildfireFinding(zones), { status: "match", category: "Very High" });
});

test("empty coverage and overlapping categories stay distinct from a match", () => {
  assert.deepEqual(getWildfireFinding(readWildfireQueryResult({ features: [] })), { status: "unavailable" });
  const zones = [{ id: 7, category: "High" }, { id: 8, category: "Very High" }];
  assert.deepEqual(getWildfireFinding(zones), { status: "ambiguous", categories: ["High", "Very High"] });
  assert.deepEqual(getWildfireFinding([{ id: 7, category: "High" }, { id: 8, category: "High" }]), { status: "match", category: "High" });
});

test("partial, invalid, and duplicate records cannot be saved as evidence", () => {
  const feature = { attributes: { OBJECTID: 7, FHSZ_Description: "High" } };
  assert.throws(() => readWildfireQueryResult({ features: [feature], exceededTransferLimit: true }), /incomplete/);
  assert.throws(() => readWildfireQueryResult({ error: { code: 500 }, features: [] }), /invalid/);
  assert.throws(() => readWildfireQueryResult({ features: [feature, feature] }), /duplicate/);
  assert.throws(() => readWildfireQueryResult({ features: [{ attributes: { OBJECTID: 8, FHSZ_Description: "Extreme" } }] }), /invalid/);
});

test("stored evidence must name the pinned source and include a valid retrieval time", () => {
  const snapshot = { sourceId: CAL_FIRE_SOURCE.id, point: samplePoint, retrievedAt: "2026-11-10T00:00:00.000Z", zones: [] };
  assert.deepEqual(readWildfireSnapshot(snapshot), snapshot);
  assert.throws(() => readWildfireSnapshot({ ...snapshot, sourceId: "unrecognized" }), /Invalid wildfire snapshot/);
  assert.throws(() => readWildfireSnapshot({ ...snapshot, retrievedAt: "unknown" }), /Invalid wildfire snapshot/);
});
