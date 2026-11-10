# SafeEarth web

Stage 1 layouts: Home, ECHO, NET stops and hazards, SERA, Ask, regional
coverage, and Data and methods. All screens use Sample data. No map
library, real routing, optimization, backend, or assistant service is used.

## Requirements

Node.js 22.16 or newer and pnpm 10.6.3. From `web/`:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. Light is the default theme. The Night/Day
button saves the preference in browser storage when available.
Development and production builds use Webpack; Turbopack's CSS processing
requires a local port that is blocked in the restricted build environment.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Use `pnpm start` to serve a production build. Inter is bundled through
`next/font/local`, so builds do not fetch Google Fonts. The unmodified
Inter 3.013 variable font supports weights 100-900; its SIL Open Font
License and copyright notice are in `src/app/fonts/OFL.txt`.
Upstream font project: https://github.com/rsms/inter.

## Structure

- `src/app/`: root layout, Home at `/`, and `/data-and-methods`.
- `src/app/[region]/[mode]/`: region workspaces, generated for each sample.
- `src/components/`: shell, shared controls, Home, coverage and methods.
- `src/components/theme/`: theme context and accessible toggle.
- `src/styles/`: light/night tokens and screen styles.
- `src/mocks/`: fixed region and coverage fixtures.
- `src/lib/data/`: mock-backed functions; components never import fixtures.
- `src/types/`: region, source status and coverage types.

## Routes and preview states

Region cards open ECHO. Use the top bar to move between workspaces.
Supported region slugs are `jakarta`, `lisbon`, and `los-angeles`; screen
names are `echo`, `net`, and `sera`. For example:

```text
/los-angeles/echo
/los-angeles/net
/los-angeles/sera
/jakarta/echo
```

In `pnpm dev`, append `?state=normal`, `?state=wildfire`, `?state=stale`,
or `?state=offline`, or use the timeline's Preview selector. Navigation
preserves the selected state. Production always ignores this parameter
and hides the selector. Offline is a cached-data layout example, not
network detection.

## Local checks

At 1440x900, check the Home layout in light and night themes. Select each
region card, search by city or country, and submit an unknown search.
Open Data in this area before and after selecting a region. Check that
Lisbon, Jakarta and Los Angeles show independent source statuses and dates.
Sources outside California and the population dataset are undecided;
their statuses are examples only, not rollout or provider choices.

Open Data and methods from the footer and its full-page link. Verify
Close, Escape, background dismissal, keyboard focus and return navigation.
Try the illustration zoom and layer controls, all four right-panel tabs,
zone selection, local notes, and timeline controls. These change only
sample layouts and fixed frames.

For NET, edit the trip, update the brief, choose the backup depot, and
toggle the depot stop. Check the external Maps link's origin, destination,
and waypoint. Stop positions are schematic, with a dashed connector
labeled "Straight line, not a route". There are no road-following lines
or travel-time estimates. Sample depot and shelter names are unverified;
replace them with real addresses before opening Maps. Link construction
follows https://developers.google.com/maps/documentation/urls/get-started.

For SERA, select sites, change wizard sections and weights, and toggle
the sample depot-loss comparison. Weights do not recalculate results.
Export downloads a labeled sample CSV; Share copies the view URL; depot
details are a local preview and never register anything.

For Ask, try the four canned prompts, a free-text question, and an area
with missing samples. Every displayed answer includes sample provenance
and time. Free text has no generated answer; it gets the missing-data
message and emergency-number guidance.

The restricted agent environment cannot run a local server or browser.
Build and source checks run there; visual, keyboard, and interaction
checks must be completed locally before marking Stage 1 complete.

Follow `../AGENTS.md`, `../docs/OPEN_QUESTIONS.md`, and
`../design/tokens.md`. Do not add real data or map integrations at this stage.
