import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

test("place searches and reverse lookups request English and cache the localized result", async () => {
  const requests = [];
  const loadedModule = { exports: {} };
  const source = ts.transpileModule(readFileSync("src/lib/data/places-server.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const fetch = async (url, options) => {
    requests.push({ url, options });
    assert.equal(url.searchParams.get("accept-language"), "en");
    assert.equal(options.headers["Accept-Language"], "en");
    const place = {
      place_id: 1, display_name: "Kushiro, Hokkaido, Japan", lat: "42.98", lon: "144.38",
      address: { city: "Kushiro", state: "Hokkaido", country_code: "jp" },
    };
    return Response.json(url.pathname === "/search" ? [place] : place);
  };
  runInNewContext(source, {
    module: loadedModule, exports: loadedModule.exports, fetch, URL, URLSearchParams, Response, AbortSignal,
    process: { env: {} }, setTimeout: (callback) => { callback(); return 1; },
  });
  const { searchPlaces, reversePlace } = loadedModule.exports;
  const matches = await searchPlaces("Kushiro");
  assert.equal(matches[0].name, "Kushiro, Hokkaido, Japan");
  assert.equal(matches[0].jurisdiction.city, "Kushiro");
  await searchPlaces("Kushiro");
  assert.equal(requests.length, 1);
  const reversed = await reversePlace(42.98, 144.38);
  assert.equal(reversed.jurisdiction.state, "Hokkaido");
  assert.equal(reversed.countryCode, "jp");
  assert.equal(requests.length, 2);
});
