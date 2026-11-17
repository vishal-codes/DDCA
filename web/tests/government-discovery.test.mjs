import assert from "node:assert/strict";
import test from "node:test";
import { domainsForCountry, suggestedSourcesForCountry } from "../src/lib/government/domains.ts";
import { officialSourceUrl, readGovernmentEvidence, readStoredGovernmentJob } from "../src/lib/government/evidence.ts";

const url = "https://www.jma.go.jp/example";
const evidence = { hazard: "earthquake", title: "Official earthquake map", url, summary: "Government map covering the selected jurisdiction.", publishedAt: null };
function response(source = evidence, searched = url) {
  return {
    output: [
      { type: "web_search_call", action: { type: "search", sources: [{ url: searched }] } },
      { type: "message", content: [{ type: "output_text", text: JSON.stringify({ sources: [source] }), annotations: [] }] },
    ],
  };
}

test("government source URLs require the reviewed namespace and HTTPS", () => {
  assert.equal(officialSourceUrl(url, ["go.jp"]), url);
  assert.equal(officialSourceUrl("https://jma.go.jp.attacker.example/map", ["go.jp"]), null);
  assert.equal(officialSourceUrl("http://www.jma.go.jp/map", ["go.jp"]), null);
  assert.equal(officialSourceUrl("https://user:password@www.jma.go.jp/map", ["go.jp"]), null);
  assert.equal(officialSourceUrl("https://www.jma.go.jp:8443/map", ["go.jp"]), null);
});

test("government summaries require a matching URL in the actual search results", () => {
  assert.deepEqual(readGovernmentEvidence(response(), ["go.jp"]), [evidence]);
  assert.throws(() => readGovernmentEvidence(response(evidence, "https://www.jma.go.jp/other"), ["go.jp"]), /did not match/);
  assert.throws(() => readGovernmentEvidence(response({ ...evidence, url: "https://news.example/map" }), ["go.jp"]), /did not match/);
});

test("returned citations are supported and publication dates stay absent when unknown", () => {
  const result = response();
  result.output[0].action.sources = [];
  result.output[1].content[0].annotations = [{ type: "url_citation", url }];
  assert.equal(readGovernmentEvidence(result, ["go.jp"])[0].publishedAt, null);
  assert.throws(() => readGovernmentEvidence(response({ ...evidence, publishedAt: "today" }), ["go.jp"]), /did not match/);
});

test("missing searches and duplicate evidence cannot become collected source claims", () => {
  const result = response();
  assert.throws(() => readGovernmentEvidence({ output: result.output.slice(1) }, ["go.jp"]), /not searched/);
  result.output[1].content[0].text = JSON.stringify({ sources: [evidence, evidence] });
  assert.throws(() => readGovernmentEvidence(result, ["go.jp"]), /Duplicate/);
});

test("country namespaces cover regions on multiple continents and allow reviewed overrides", () => {
  for (const country of ["us", "jp", "id", "pt", "au", "br", "za", "in", "fr", "ca"]) {
    assert.ok(domainsForCountry(country, "").length > 0, country);
  }
  assert.deepEqual(domainsForCountry("xx", '{"xx":["agency.gov.example"]}'), ["agency.gov.example"]);
  assert.deepEqual(domainsForCountry("xx", ""), []);
  assert.throws(() => domainsForCountry("xx", '{"xx":["https://agency.gov.example/path"]}'), /Invalid/);
});

test("unconfigured collection can link known authorities within the permitted domains", () => {
  const suggestions = suggestedSourcesForCountry("jp", domainsForCountry("jp", ""));
  assert.ok(suggestions.some((source) => source.url.includes("jma.go.jp")));
  assert.deepEqual(suggestedSourcesForCountry("jp", ["unrelated.gov.example"]), []);
});

test("persisted collections validate source domains and point metadata before reaching the UI", () => {
  const id = "a".repeat(64);
  const job = {
    id, point: { latitude: 35.6, longitude: 139.7 }, status: "completed",
    placeName: "Example jurisdiction", countryCode: "jp", allowedDomains: ["go.jp"],
    startedAt: "2026-11-16T00:00:00Z", updatedAt: "2026-11-16T00:01:00Z",
    providerResponseId: "resp_example", message: "Completed", sources: [evidence],
    suggestedSources: [{ title: "Japan Meteorological Agency", url: "https://www.jma.go.jp/" }],
  };
  assert.deepEqual(readStoredGovernmentJob(job, id), job);
  assert.throws(() => readStoredGovernmentJob({ ...job, collector: "retired-provider" }, id), /Invalid/);
  assert.throws(() => readStoredGovernmentJob({ ...job, jurisdiction: { city: 12, district: null, state: null } }, id), /jurisdiction/);
  const scoped = { ...job, sources: [{ ...evidence, area: { name: "Tokyo", level: "city" }, retrieval: "search_excerpt" }] };
  assert.deepEqual(readStoredGovernmentJob(scoped, id), scoped);
  assert.throws(() => readStoredGovernmentJob({ ...job, sources: [{ ...evidence, area: { name: "Tokyo", level: "unverified" } }] }, id), /coverage/);
  assert.throws(() => readStoredGovernmentJob({ ...job, point: { latitude: 100, longitude: 139 } }, id), /Invalid/);
  assert.throws(() => readStoredGovernmentJob({ ...job, sources: [{ ...evidence, url: "https://news.example/" }] }, id), /did not match/);
  assert.throws(() => readStoredGovernmentJob({ id }, id), /Invalid/);
});
