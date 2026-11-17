import assert from "node:assert/strict";
import test from "node:test";
import { governmentRuntime } from "./helpers/government-runtime.mjs";

test("government background jobs de-duplicate exact points and resume after a failed poll", async () => {
  const runtime = governmentRuntime();
  const point = { latitude: 35.6, longitude: 139.7 };
  const [first, second] = await Promise.all([
    runtime.jobs.startGovernmentDiscovery(point),
    runtime.jobs.startGovernmentDiscovery(point),
  ]);
  assert.equal(first.id, second.id);
  assert.equal(runtime.requests.filter((request) => request.options.method === "POST").length, 1);
  assert.equal("providerResponseId" in first, false);
  const body = JSON.parse(runtime.requests[0].options.body);
  assert.equal(body.background, true);
  assert.equal(body.tool_choice, "required");
  assert.ok(body.tools[0].filters.allowed_domains.includes("go.jp"));

  runtime.failProvider(true);
  const interrupted = await runtime.jobs.getGovernmentDiscovery(first.id);
  assert.equal(interrupted.status, "queued");
  runtime.failProvider(false);
  runtime.complete();
  const finished = await runtime.jobs.getGovernmentDiscovery(first.id);
  assert.equal(finished.status, "completed");
  assert.equal(finished.sources[0].url, "https://www.jma.go.jp/example");
  const cached = await runtime.jobs.startGovernmentDiscovery(point);
  assert.equal(cached.id, first.id);
  assert.equal(runtime.requests.filter((request) => request.options.method === "POST").length, 1);

  const nearby = await runtime.jobs.startGovernmentDiscovery({ ...point, latitude: point.latitude + 0.00001 });
  assert.notEqual(nearby.id, first.id);
  assert.equal(runtime.requests.filter((request) => request.options.method === "POST").length, 2);
  assert.ok([...runtime.files.keys()].every((path) => path.endsWith(".json")));
});

test("free collection reads government pages and persists real excerpts without a model key", async () => {
  const runtime = governmentRuntime("government_pages");
  const job = await runtime.jobs.startGovernmentDiscovery({ latitude: 35.6, longitude: 139.7 });
  assert.equal(job.status, "completed");
  assert.equal(job.collector, "government_pages");
  assert.ok(job.sources.length > 0);
  assert.ok(job.sources.every((source) => source.summaryKind === "extract"));
  assert.equal(job.sources[0].publishedAt, "2026-10-01");
  assert.ok(runtime.requests.every((request) => new URL(request.url).hostname.endsWith(".go.jp")));
  const cached = await runtime.jobs.startGovernmentDiscovery({ latitude: 35.6, longitude: 139.7 });
  assert.equal(cached.id, job.id);
  assert.equal(runtime.requests.length, 2);
});

test("government-page redirects cannot fetch outside the permitted official domains", async () => {
  const runtime = governmentRuntime("government_pages");
  runtime.redirectExternally();
  assert.equal(await runtime.pages.fetchGovernmentPage("https://www.jma.go.jp/example", ["go.jp"]), null);
  assert.equal(runtime.requests.length, 1);
  assert.ok(runtime.requests.every((request) => new URL(request.url).hostname.endsWith(".go.jp")));
});

test("hosted free summaries preserve collected source metadata and cache the completed job", async () => {
  const runtime = governmentRuntime("openrouter");
  const point = { latitude: 35.6, longitude: 139.7 };
  const job = await runtime.jobs.startGovernmentDiscovery(point);
  assert.equal(job.status, "completed");
  assert.equal(job.collector, "openrouter");
  assert.ok(job.sources.every((source) => source.summaryKind === "ai"));
  assert.equal(job.sources[0].publishedAt, "2026-10-01");
  assert.equal(job.sources[0].title, "Tokyo earthquake guidance");
  assert.ok(job.sources.every((source) => new URL(source.url).hostname.endsWith(".go.jp")));
  const routerCalls = runtime.requests.filter((request) => new URL(request.url).hostname === "openrouter.ai");
  assert.equal(routerCalls.length, 1);
  const request = JSON.parse(routerCalls[0].options.body);
  assert.equal(request.model, "openrouter/free");
  assert.equal(request.response_format.json_schema.strict, true);
  assert.equal(request.provider.require_parameters, true);
  assert.equal("plugins" in request, false);
  assert.equal("models" in request, false);
  assert.ok(!request.messages[1].content.includes("latitude"));
  assert.ok(runtime.requests.every((request) => !["api.openai.com", "127.0.0.1"].includes(new URL(request.url).hostname)));
  await runtime.jobs.startGovernmentDiscovery(point);
  assert.equal(runtime.requests.length, 3);
  assert.equal(JSON.parse([...runtime.files.values()][0]).collector, "openrouter");
});

test("OpenRouter rate limits retain excerpts, avoid paid fallback, and allow retry after a minute", async () => {
  const options = { routerStatus: 429 };
  const runtime = governmentRuntime("openrouter", options);
  const point = { latitude: 35.6, longitude: 139.7 };
  const job = await runtime.jobs.startGovernmentDiscovery(point);
  assert.equal(job.status, "completed");
  assert.ok(job.sources.every((source) => source.summaryKind === "extract"));
  assert.match(job.message, /free request limit/);
  await runtime.jobs.startGovernmentDiscovery(point);
  assert.equal(runtime.requests.length, 3);
  runtime.advance(61000);
  options.routerStatus = undefined;
  const retried = await runtime.jobs.startGovernmentDiscovery(point);
  assert.ok(retried.sources.every((source) => source.summaryKind === "ai"));
  assert.ok(runtime.requests.every((request) => new URL(request.url).hostname !== "api.openai.com"));
});

test("OpenRouter needs only its server key and never calls the provider with a missing key", async () => {
  const runtime = governmentRuntime("openrouter", { routerKey: "" });
  const job = await runtime.jobs.startGovernmentDiscovery({ latitude: 35.6, longitude: 139.7 });
  assert.ok(job.sources.every((source) => source.summaryKind === "extract"));
  assert.match(job.message, /Set OPENROUTER_API_KEY/);
  assert.ok(runtime.requests.every((request) => new URL(request.url).hostname.endsWith(".go.jp")));
});

test("paid OpenRouter models are rejected before any inference request", async () => {
  const runtime = governmentRuntime("openrouter", { routerModel: "openai/paid-model" });
  const job = await runtime.jobs.startGovernmentDiscovery({ latitude: 35.6, longitude: 139.7 });
  assert.ok(job.sources.every((source) => source.summaryKind === "extract"));
  assert.match(job.message, /Paid models are disabled/);
  assert.ok(runtime.requests.every((request) => new URL(request.url).hostname.endsWith(".go.jp")));
});

test("forged source metadata and truncated hosted responses fall back to original excerpts", async () => {
  for (const options of [{ forgeSource: true }, { truncated: true }]) {
    const runtime = governmentRuntime("openrouter", options);
    const job = await runtime.jobs.startGovernmentDiscovery({ latitude: 35.6, longitude: 139.7 });
    assert.ok(job.sources.every((source) => source.summaryKind === "extract"));
    assert.equal(job.sources[0].publishedAt, "2026-10-01");
    assert.ok(job.sources.every((source) => new URL(source.url).hostname.endsWith(".go.jp")));
  }
});
