import assert from "node:assert/strict";
import test from "node:test";
import { evidenceArea, localEvidence } from "../src/lib/government/geography.ts";
import { sourceApplies } from "../src/lib/data/echo-point.ts";
import { suggestedSourcesForPlace } from "../src/lib/government/domains.ts";
import { governmentRuntime } from "./helpers/government-runtime.mjs";
import { renderComponent } from "./helpers/render-component.mjs";

const jurisdiction = { city: "Kalyan-Dombivli", district: "Thane", state: "Maharashtra" };
const place = { name: "Kalyan-Dombivli, Thane, Maharashtra, India", countryCode: "in", jurisdiction };
const point = { latitude: 19.2396742, longitude: 73.1366482 };
const report = { title: "Kalyan official flood history", url: "https://thane.nic.in/reports/flood-history.pdf",
  content: "Kalyan experienced flooding during the monsoon. This report describes a historical event, not a current alert." };

test("local context matches the city or district and keeps statewide material broader", () => {
  assert.deepEqual(evidenceArea("Historical flooding in Kalyan", jurisdiction), { name: "Kalyan-Dombivli", level: "city" });
  assert.deepEqual(evidenceArea("Thane disaster plan", jurisdiction), { name: "Thane", level: "district" });
  assert.deepEqual(evidenceArea("Maharashtra hazard overview", jurisdiction), { name: "Maharashtra", level: "state" });
  assert.equal(evidenceArea("Kalyanpur flood plan in another state", jurisdiction), undefined);
  assert.equal(evidenceArea("Floods in California", jurisdiction), undefined);
  assert.equal(localEvidence([{ area: { name: "Maharashtra", level: "state" } }]).length, 0);
});

test("Kalyan searches approved Indian government domains and rejects news and unrelated regions", async () => {
  const runtime = governmentRuntime("government_pages", { place, searchKey: "test-search-key", searchResults: [report,
    { ...report, url: "https://news.example/flood" },
    { ...report, title: "Odisha flood report", content: "Historical flooding in Odisha.", url: "https://odisha.gov.in/flood.pdf" },
    { ...report, url: "https://thane.nic.in.attacker.example/flood" },
  ] });
  const job = await runtime.jobs.startGovernmentDiscovery(point);
  assert.equal(job.searchStatus, "checked");
  assert.equal(job.sources.length, 1);
  assert.equal(job.sources[0].hazard, "flood");
  assert.equal(job.sources[0].area.level, "city");
  assert.equal(job.sources[0].retrieval, "search_excerpt");
  assert.equal(job.sources[0].publishedAt, null);
  assert.equal(job.sources[0].url, report.url);
  const request = runtime.requests.find((request) => new URL(request.url).hostname === "api.tavily.com");
  const body = JSON.parse(request.options.body);
  assert.deepEqual(body.include_domains, ["gov.in", "nic.in"]);
  assert.equal(body.search_depth, "basic");
  assert.equal(body.auto_parameters, false);
  assert.equal(body.include_answer, false);
  assert.match(body.query, /Kalyan-Dombivli, Thane, Maharashtra/);
  assert.ok(runtime.requests.every(({ url }) => !["gov.in", "nic.in"].includes(new URL(url).hostname)));
});

test("nearby points in the same jurisdiction share search and summary work", async () => {
  const runtime = governmentRuntime("openrouter", { place, searchKey: "test-search-key", searchResults: [report] });
  const [first, second] = await Promise.all([
    runtime.jobs.startGovernmentDiscovery(point),
    runtime.jobs.startGovernmentDiscovery({ ...point, latitude: point.latitude + 0.001 }),
  ]);
  assert.notEqual(first.id, second.id);
  assert.equal(first.sources[0].summaryKind, "ai");
  assert.equal(first.updatedAt, second.updatedAt);
  assert.equal(runtime.requests.filter(({ url }) => new URL(url).hostname === "api.tavily.com").length, 1);
  assert.equal(runtime.requests.filter(({ url }) => new URL(url).hostname === "openrouter.ai").length, 1);
});

test("a missing search service yields an explicit gap and real reviewed portals, never invented namespace URLs", async () => {
  const portals = suggestedSourcesForPlace(place, ["gov.in", "nic.in"]);
  assert.ok(portals.some((source) => new URL(source.url).hostname === "thane.nic.in"));
  const runtime = governmentRuntime("government_pages", { place });
  const job = await runtime.jobs.startGovernmentDiscovery(point);
  assert.equal(job.searchStatus, "not_configured");
  assert.equal(job.sources.length, 0);
  assert.match(job.message, /does not mean the area has no hazards/);
  assert.ok(job.suggestedSources.length > 0);
  assert.ok(runtime.requests.every(({ url }) => !["gov.in", "nic.in"].includes(new URL(url).hostname)));
});

test("India and Canada do not query US-only weather or California hazard feeds", async () => {
  for (const selected of [place, { name: "Vancouver, Canada", countryCode: "ca" }]) {
    const runtime = governmentRuntime("government_pages", { place: selected });
    const result = await runtime.checkPoint(selected.countryCode === "in" ? point : { latitude: 49.28, longitude: -123.12 }, new AbortController().signal);
    assert.equal(sourceApplies(result.alerts), false);
    assert.equal(sourceApplies(result.wildfire), false);
    assert.ok(runtime.requests.every(({ url }) => new URL(url).hostname === "earthquake.usgs.gov"));
  }
});

test("California retains its relevant hazard and weather sources", async () => {
  const runtime = governmentRuntime("government_pages", { place: {
    name: "Los Angeles, California, United States", countryCode: "us",
    jurisdiction: { city: "Los Angeles", district: "Los Angeles County", state: "California" },
  } });
  const result = await runtime.checkPoint({ latitude: 34.35, longitude: -118.4 }, new AbortController().signal);
  assert.equal(sourceApplies(result.alerts), true);
  assert.equal(sourceApplies(result.wildfire), true);
  assert.ok(runtime.requests.some(({ url }) => new URL(url).hostname === "api.weather.gov"));
  assert.ok(runtime.requests.some(({ url }) => new URL(url).hostname === "services.arcgis.com"));
});

test("the India sidebar and layer controls omit US-only cards and empty earthquake observations", () => {
  const outside = { status: "unavailable", outOfCoverage: true };
  const result = { alerts: outside, wildfire: outside };
  const findings = renderComponent("src/components/echo/echo-point-findings.tsx", "EchoFindings", { result, onAlert() {} });
  const evidence = renderComponent("src/components/echo/echo-evidence.tsx", "EchoEvidence", { result });
  const layers = renderComponent("src/components/echo/echo-layer-panel.tsx", "EchoLayerPanel", { wildfireAvailable: false });
  for (const html of [findings, evidence, layers]) assert.doesNotMatch(html, /CAL FIRE|National Weather Service|Long-term wildfire/);
  const earthquakes = renderComponent("src/components/echo/earthquake-findings.tsx", "EarthquakeFindings", {
    source: { status: "checked", checkedAt: "2026-11-17T00:00:00Z", data: { events: [] } },
  });
  assert.equal(earthquakes, "");
  const empty = renderComponent("src/components/echo/echo-point-findings.tsx", "EchoFindings", { result: {
    alerts: { status: "checked", data: [] }, wildfire: { status: "checked", data: { status: "unavailable" } },
  }, onAlert() {} });
  assert.equal(empty, "");
});

test("local analysis shows supported flood context without adding an unrelated hazard", () => {
  const source = { hazard: "flood", title: report.title, url: report.url, summary: report.content,
    publishedAt: null, summaryKind: "extract", retrieval: "search_excerpt", area: { name: "Kalyan-Dombivli", level: "city" } };
  const job = { status: "completed", sources: [source], searchStatus: "checked", updatedAt: "2026-11-17T00:00:00Z" };
  const html = renderComponent("src/components/echo/local-context-findings.tsx", "LocalContextFindings", {
    collection: { job, searching: false }, onEvidence() {},
  });
  assert.match(html, /Flood/);
  assert.match(html, /Kalyan-Dombivli/);
  assert.match(html, /historical event/);
  assert.doesNotMatch(html, /Wildfire|No active alerts|Low risk/);
  const statewide = renderComponent("src/components/echo/local-context-findings.tsx", "LocalContextFindings", {
    collection: { job: { ...job, sources: [{ ...source, area: { name: "Maharashtra", level: "state" } }] }, searching: false }, onEvidence() {},
  });
  assert.doesNotMatch(statewide, /historical event/);
  assert.match(statewide, /No city or district hazard evidence/);
});
