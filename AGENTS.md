# SafeEarth - agent guide

## What this is
SafeEarth (working name) is a desktop web app for disaster
preparedness and emergency response, for any region in the world.
California has the most real data first.
- ECHO (Emergency Context and Help Overview): how risky is this area
  and what should we do.
- NET (Navigation and Emergency Tracking): stops and hazards, with
  a Google Maps handoff, optionally through an emergency depot.
- SERA (Safe Emergency Response Alliance): where to stage supplies so
  the most people are reached fast.
- Ask: assistant drawer that answers from app data with sources.
Users: dispatchers, planners, responders. Plain language.

## Current stage
See docs/ROADMAP.md. Early stages are layout only: static UI with
sample data, no real data, no backend, no real routing.
Unknowns go in docs/OPEN_QUESTIONS.md. Do not guess them.

## Design source
- Use design/screens/*.png and design/tokens.md instead.
- Desktop only, 1440x900. No mobile. No 3D map, no 2D/3D toggle.

## Product rules (never break)
1. Never use the word "tier" anywhere (code, UI, comments, docs).
   Never rank or grade regions, places, or data quality. Candidate
   depot sites may be ordered by coverage, without numbered rank
   badges or per-site confidence labels. Show their coverage as
   rounded ranges with an Estimated tag. Data coverage is shown per
   kind with status chips: Live, Updated daily, Static map, Global
   model, Not available.
2. Official alerts and orders always outrank our scores and show in a
   banner.
3. No fake precision. No "97.3% risk". Use ranges, "at least N" and
   rounded numbers.
4. Risk scale: Low, Moderate, High, Extreme. Color is never the only
   signal: always icon plus text.
5. Numbers are labeled Measured (from a source) or Modeled
   (estimated); SERA site coverage uses Estimated as specified above.
   Missing data is "Not enough data" in gray, never zero.
6. Live items show a data age chip. Old data turns amber and says
   "May be out of date".
7. Source name and date under every number.
8. Hexagons (H3) only when zoomed out. Zoomed in shows real zones,
   roads and official boundaries on top.
9. Footer: "Not an official source. In an emergency call 911 or your
   local emergency number."
10. Anything that is not real data is labeled "Sample data" in the UI.
11. Plain language, short sentences. ASCII only in code, comments,
    docs and UI strings.

## Tech (initial defaults, can change with my OK)
Next.js (App Router) + TypeScript + Tailwind, pnpm.
web/ is the frontend. api/ comes later. Map (MapLibre GL JS) and
hexagons (h3-js) come in a later stage.
Light theme by default plus a night theme, using CSS variables from
design/tokens.md.
Layout: web/src/app (screens), web/src/components, web/src/mocks
(sample data), web/src/types, web/src/lib/data (data functions).

## Data boundary
Components never fetch data directly. They call functions in
web/src/lib/data (for example getRegionCoverage, getHazards). Today
those return mocks. Later they call our API.

## Region data coverage (core idea)
Kinds of data: alerts, roadClosures, evacuationZones, hazardMaps,
population.
Status per kind: live, updated_daily, static_map, global_model,
not_available.
For each region, every kind has a status, a source name and an
updatedAt date. The UI adapts from this. There is no overall grade.

## Decisions
See docs/OPEN_QUESTIONS.md for details and remaining questions.
- Basemap: MapLibre GL JS with global Protomaps PMTiles. Development
  uses the non-commercial hosted API with an env-var key. Production
  serves the planet file from Cloudflare R2 via range requests, never
  a whole-file download. Keep the tile URL in one config file and show
  OSM attribution. Build small regional detail tilesets offline only
  where data exists; no global Overture buildings file.
- NET v1 selects depot and destination stops, briefs nearby hazards,
  and links to Google Maps. No route lines, times, or "safe route"
  wording. Never display Google Directions or Routes API results on
  our map. Our own California router comes in Stage 5.
- V1 risk uses official layers. Use deterministic source adapters,
  snapshot polling, Postgres/PostGIS, and offline geospatial batches.
  Runtime AI does not read websites; humans review adapters drafted
  with build-time AI assistance.
- Region order: California, an easy second region, then Tokyo.
- Railway hosts web, API, worker, cron, and PostGIS; big files use
  object storage. Everything runs in Docker.
- Ask uses only our own shared data functions, with source chips and
  times for every claim, no browsing, and four initial question types.
  Missing data gets "I don't have that for this area" and the emergency
  number. Quote official orders as written with a link.
- Typography: Inter via next/font; tabular numbers for times.
- SERA sites stay ordered by coverage under product rule 1.

## How to work
- One stage or feature per session. Plan first, then build.
- Small steps. Commit after each working step.
- Before building a screen, look at its screenshot in design/screens.
- Do not add dependencies without asking.
- Do not invent data sources, APIs or numbers. If unknown, add it to
  docs/OPEN_QUESTIONS.md.
- Run typecheck, lint and build before saying a step is done.
- Keep files under about 300 lines. Split components.
- Accessibility: WCAG AA contrast, controls at least 44px, visible
  keyboard focus, aria labels on map controls.
- If a prompt conflicts with this file, tell me before continuing.
