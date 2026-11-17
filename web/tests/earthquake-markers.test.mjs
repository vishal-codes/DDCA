import assert from "node:assert/strict";
import test from "node:test";
import { fitMapPoints, project, worldSize } from "../src/lib/map/basemap.ts";
import { loadComponent, renderComponent } from "./helpers/render-component.mjs";

const city = { latitude: -6.2, longitude: 106.85 };
const events = [
  { id: "example-a", title: "M 4.7 - Example earthquake A", latitude: -6.9, longitude: 106.9,
    magnitude: 4.7, occurredAt: "2026-11-10T14:31:00Z", url: "https://earthquake.usgs.gov/earthquakes/eventpage/example-a" },
  { id: "example-b", title: "M 4.3 - Example earthquake B", latitude: -6.05, longitude: 106.55,
    magnitude: 4.3, occurredAt: "2026-10-27T23:51:00Z", url: "https://earthquake.usgs.gov/earthquakes/eventpage/example-b" },
];

function viewportFor(points, width = 900, height = 650) {
  const view = fitMapPoints(points, width, height);
  const center = project(view.center, view.zoom);
  return { zoom: view.zoom, left: center.x - width / 2, top: center.y - height / 2, width, height };
}

test("the initial earthquake view fits the city and every returned event with padding", () => {
  const points = [city, ...events];
  const viewport = viewportFor(points);
  for (const point of points) {
    const pixel = project(point, viewport.zoom);
    assert.ok(pixel.x - viewport.left >= 63 && pixel.x - viewport.left <= viewport.width - 63);
    assert.ok(pixel.y - viewport.top >= 63 && pixel.y - viewport.top <= viewport.height - 63);
  }
  assert.equal(fitMapPoints([], 900, 650), null);
  assert.equal(fitMapPoints(points, 0, 0), null);
});

test("earthquake framing uses the nearby side of the date line", () => {
  const points = [{ latitude: 35, longitude: 179.8 }, { latitude: 35.2, longitude: -179.8 }];
  const viewport = viewportFor(points);
  const world = worldSize(viewport.zoom);
  for (const point of points) {
    const p = project(point, viewport.zoom);
    const x = p.x + Math.round((viewport.left + viewport.width / 2 - p.x) / world) * world - viewport.left;
    assert.ok(x >= 63 && x <= viewport.width - 63);
  }
});

test("every listed observation has a source-labeled marker and selection sends its event ID", () => {
  const props = { events, viewport: viewportFor([city, ...events]), selectedId: events[1].id,
    onSelect() {}, onShowAll() {}, checkedAt: "2026-11-17T08:32:00Z" };
  const html = renderComponent("src/components/map/earthquake-map-layer.tsx", "EarthquakeMapLayer", props);
  assert.equal((html.match(/class="earthquake-map-marker"/g) ?? []).length, 2);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /USGS/);
  assert.match(html, /M 4.7/);
  assert.match(html, /M 4.3/);
  assert.match(html, /Show all events/);
  const selected = [];
  let stopped = false;
  const layer = loadComponent("src/components/map/earthquake-map-layer.tsx", "EarthquakeMapLayer")({
    ...props, onSelect: (id) => selected.push(id),
  });
  const markers = layer.props.children[0].props.children;
  markers[1].props.onClick({ stopPropagation() { stopped = true; } });
  assert.deepEqual(selected, [events[1].id]);
  assert.equal(stopped, true);
});

test("map selection reveals an event beyond the sidebar's first five without losing its source link", () => {
  const many = Array.from({ length: 7 }, (_, index) => ({ ...events[0], id: `event-${index}`, title: `Example earthquake ${index}` }));
  const html = renderComponent("src/components/echo/earthquake-findings.tsx", "EarthquakeFindings", {
    source: { status: "checked", checkedAt: "2026-11-17T08:32:00Z", data: { events: many, radiusKm: 100,
      minimumMagnitude: 2.5, since: "2026-10-18T08:32:00Z", limit: 100 } },
    selectedId: "event-6", onSelect() {}, onShowAll() {},
  });
  assert.match(html, /Example earthquake 6/);
  assert.match(html, /class="selected-earthquake" aria-current="true"/);
  assert.match(html, /Show all events on map/);
  assert.ok(html.includes(events[0].url));
});

test("empty observations do not render markers or a misleading earthquake legend", () => {
  assert.equal(renderComponent("src/components/map/earthquake-map-layer.tsx", "EarthquakeMapLayer", {
    events: [], viewport: viewportFor([city]), onSelect() {}, onShowAll() {},
  }), "");
});
