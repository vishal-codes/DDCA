import assert from "node:assert/strict";
import test from "node:test";
import { googleMapsLink } from "../src/lib/google-maps-link.ts";
import { parseWorkspacePath, resolvePreviewState, workspaceHref } from "../src/lib/workspace.ts";

test("Maps handoff preserves addresses and stop order through URL encoding", () => {
  const url = new URL(googleMapsLink("  Start & Main, CA  ", "Shelter / East", ["Depot A, CA", "Depot B & C"]));
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(url.pathname, "/maps/dir/");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("origin"), "Start & Main, CA");
  assert.equal(url.searchParams.get("destination"), "Shelter / East");
  assert.equal(url.searchParams.get("waypoints"), "Depot A, CA|Depot B & C");
  assert.equal(url.searchParams.get("travelmode"), "driving");
  assert.equal(url.searchParams.has("key"), false);
});

test("Maps handoff caps desktop and phone stops without changing their order", () => {
  const stops = Array.from({ length: 12 }, (_, index) => `Depot ${index}`);
  const desktop = new URL(googleMapsLink("Start", "End", stops));
  const phone = new URL(googleMapsLink("Start", "End", stops, true));
  assert.equal(desktop.searchParams.get("waypoints"), stops.slice(0, 9).join("|"));
  assert.equal(phone.searchParams.get("waypoints"), stops.slice(0, 3).join("|"));
});

test("Maps handoff omits empty stops and prevents pipe characters adding extra stops", () => {
  const direct = new URL(googleMapsLink("Start", "End", ["", "  "]));
  assert.equal(direct.searchParams.has("waypoints"), false);
  const oneStop = new URL(googleMapsLink("Start", "End", ["Depot A|Depot B"]));
  assert.equal(oneStop.searchParams.get("waypoints"), "Depot A Depot B");
});

test("Maps handoff rejects missing addresses and overlong URLs", () => {
  assert.equal(googleMapsLink(" ", "End"), null);
  assert.equal(googleMapsLink("Start", ""), null);
  assert.equal(googleMapsLink("A".repeat(2100), "End"), null);
});

test("production ignores every development preview state", () => {
  for (const state of ["normal", "wildfire", "stale", "offline", "unknown", null]) {
    assert.equal(resolvePreviewState(state, false), "normal");
  }
});

test("development accepts the four preview states and safely defaults unknown values", () => {
  for (const state of ["normal", "wildfire", "stale", "offline"]) {
    assert.equal(resolvePreviewState(state, true), state);
  }
  assert.equal(resolvePreviewState("unknown", true), "normal");
  assert.equal(resolvePreviewState(null, true), "normal");
});

test("workspace navigation round trips all regions and screens while preserving previews", () => {
  for (const regionId of ["jakarta", "lisbon", "los-angeles"]) {
    for (const mode of ["echo", "net", "sera"]) {
      const href = workspaceHref(regionId, mode, "stale");
      const url = new URL(href, "https://example.test");
      assert.deepEqual(parseWorkspacePath(url.pathname), { regionId, mode });
      assert.equal(url.searchParams.get("state"), "stale");
      assert.equal(workspaceHref(regionId, mode), `/${regionId}/${mode}`);
    }
  }
});

test("unrecognized workspace paths never select another region or screen", () => {
  for (const path of ["/", "/data-and-methods", "/tokyo/echo", "/jakarta/unknown", "/los-angeles/echo/extra"]) {
    assert.equal(parseWorkspacePath(path), null);
  }
});
