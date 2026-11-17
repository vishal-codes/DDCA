import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);

export function governmentRuntime(collector = "openai", options = {}) {
  const config = options;
  const files = new Map();
  const modules = new Map();
  const requests = [];
  let providerFailure = false;
  let completed = false;
  let externalRedirect = false;
  let now = Date.now();
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const fs = {
    mkdir: async () => {},
    writeFile: async (path, contents) => { files.set(path, contents); },
    readFile: async (path) => {
      if (!files.has(path)) throw Object.assign(new Error("Missing file"), { code: "ENOENT" });
      return files.get(path);
    },
    rename: async (from, to) => { files.set(to, files.get(from)); files.delete(from); },
    rm: async (path) => { files.delete(path); },
  };
  const fetch = async (url, options) => {
    requests.push({ url, options });
    if (new URL(url).hostname === "api.tavily.com") {
      if (options.method !== "POST") throw new Error("Unexpected search method");
      return Response.json({ results: config.searchResults ?? [] }, { status: config.searchStatus ?? 200 });
    }
    if (new URL(url).hostname === "earthquake.usgs.gov" || new URL(url).hostname === "api.weather.gov") {
      return Response.json({ type: "FeatureCollection", features: [] });
    }
    if (new URL(url).hostname === "services.arcgis.com") return Response.json({ features: [] });
    if (new URL(url).hostname.endsWith(".go.jp")) {
      if (externalRedirect) return new Response(null, { status: 302, headers: { Location: "https://news.example/" } });
      return new Response('<title>Tokyo earthquake guidance</title><meta property="article:published_time" content="2026-10-01"><article><p>Tokyo earthquake preparedness guidance published by the government for local communities.</p></article>',
        { headers: { "Content-Type": "text/html" } });
    }
    if (providerFailure) throw new Error("Simulated source connection failure");
    if (new URL(url).hostname === "openrouter.ai") return routerResponse(options);
    if (options.method === "POST") {
      return Response.json({ id: "resp_example", status: "queued" });
    }
    if (!completed) return Response.json({ id: "resp_example", status: "in_progress" });
    const source = {
      hazard: "earthquake", title: "Government map", url: "https://www.jma.go.jp/example",
      summary: "Official map covering the selected jurisdiction.", publishedAt: null,
    };
    return Response.json({
      id: "resp_example", status: "completed",
      output: [
        { type: "web_search_call", action: { sources: [{ url: source.url }] } },
        { type: "message", content: [{ type: "output_text", text: JSON.stringify({ sources: [source] }) }] },
      ],
    });
  };
  function routerResponse(requestOptions) {
    if (options.routerStatus) return Response.json({ error: { message: "Provider error" } }, { status: options.routerStatus });
    const request = JSON.parse(requestOptions.body);
    const sources = JSON.parse(request.messages[1].content).sources;
    const summaries = sources.map((source) => ({ id: source.id, summary: "Government guidance for the source's stated coverage area." }));
    return Response.json({ choices: [{ finish_reason: options.truncated ? "length" : "stop", message: {
      content: JSON.stringify({ sources: options.forgeSource ? summaries.map((source) => ({ ...source, url: "https://attacker.example/" })) : summaries }),
    } }] });
  }
  function load(path) {
    if (modules.has(path)) return modules.get(path).exports;
    const loadedModule = { exports: {} };
    modules.set(path, loadedModule);
    const source = readFileSync(path, "utf8");
    const javascript = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const require = (specifier) => {
      if (specifier === "node:fs/promises") return fs;
      if (specifier === "@/lib/data/places-server" || specifier === "./places-server") {
        return { reversePlace: async () => config.place ?? ({ name: "Tokyo, Japan", countryCode: "jp" }) };
      }
      if (specifier.startsWith("@/")) return load(resolve("src", specifier.slice(2) + ".ts"));
      if (specifier.startsWith(".")) return load(resolve(dirname(path), specifier + ".ts"));
      return nativeRequire(specifier);
    };
    runInNewContext(javascript, {
      module: loadedModule, exports: loadedModule.exports, require, fetch, Response, URL, URLSearchParams, Date: ClockDate,
      AbortSignal, JSON, Set, Map, Error, TextDecoder,
      process: { env: { GOVERNMENT_DISCOVERY_PROVIDER: collector,
        ...(collector === "openai" ? { OPENAI_API_KEY: "test-only-key" } : {}),
        ...(collector === "openrouter" ? { OPENROUTER_API_KEY: options.routerKey ?? "test-router-key",
          OPENROUTER_DISCOVERY_MODEL: options.routerModel ?? "openrouter/free" } : {}),
        ...(options.searchKey ? { TAVILY_API_KEY: options.searchKey } : {}),
      } },
    }, { filename: path });
    return loadedModule.exports;
  }
  return {
    jobs: load(resolve("src/lib/government/jobs.ts")), requests, files,
    checkPoint: (...args) => load(resolve("src/lib/data/echo-point-server.ts")).checkEchoPoint(...args),
    pages: load(resolve("src/lib/government/pages.ts")),
    redirectExternally: () => { externalRedirect = true; },
    failProvider: (value) => { providerFailure = value; },
    complete: () => { completed = true; },
    advance: (milliseconds) => { now += milliseconds; },
  };
}
