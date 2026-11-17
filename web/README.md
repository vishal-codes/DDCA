# SafeEarth web

Home and ECHO support global point selection and place search. ECHO
combines connected government feeds with on-demand government-source
collection. NET, SERA, Ask, and development previews use Sample data.

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

## Open ECHO anywhere

Open `http://localhost:3000` with internet access and choose any point
or submit a place/address search. The selection opens
`/echo?latitude=...&longitude=...`. Region cards also open real ECHO.
Use **Refresh data** to check connected government sources again.

## Shared basemap setup

MapLibre uses a same-origin module worker served by
`/api/map-assets/maplibre-gl-worker.mjs`. This avoids webpack resolving
MapLibre 6's default worker URL to a local filesystem path.

Create or edit `.env.local` using `.env.example` as a reference.

```env
NEXT_PUBLIC_PROTOMAPS_API_KEY=your_development_key
GOVERNMENT_DISCOVERY_PROVIDER=openrouter
```

Restart `pnpm dev` after configuration changes. The Protomaps key is
browser-visible. Original government-page excerpts remain available
without a model API key.

Home and ECHO prefer Protomaps light/dark styles. OpenFreeMap provides
a keyless development fallback, and OpenStreetMap raster tiles support
browsers where vector rendering fails. Only visible raster tiles load.
Camera position is retained when switching themes. Provider source
credits appear in a compact attribution control without duplicate OSM
text; the toggle retains a 44px target.

## Government sources

CAL FIRE covers California State Responsibility Areas. NWS provides
alerts in its forecast areas. USGS supplies worldwide earthquake
observations within 100 km over 30 days at magnitude 2.5 and above.
CAL FIRE geometry uses buffered, stable requests and a bounded shared
cache. Loaded zones remain visible during pan, zoom-out and event
selection; the legend identifies areas still loading. This is not a
complete statewide offline tileset.
NWS's old CAP alert webpage was retired in December 2025. Alert dialogs
link to a supplied official HTML page or the current bulletin for the
source's issuing office and alert type. The external bulletin may have
changed; the dialog preserves the exact received notice and its dates.
[NWS service notice](https://www.weather.gov/media/notification/pdf_2025/scn25-73_update_alerts_webpage_termination_aaa.pdf)
The same returned events appear as clickable map epicenters. The first
view fits the city and events. Select a marker to highlight its sidebar
entry, use **Show on map** to focus an event, or **Show all events** to
restore the overview. Layers can hide the epicenters. These interactions
do not change the assessed city or start another source collection.

Free collection reads a bounded set of government HTML pages and
relevant links within reviewed domains. Results are labeled as excerpts.
It cannot read every interactive map or PDF.

For free hosted AI summaries, create an account and a key at
https://openrouter.ai/settings/keys. Add these variables to
`web/.env.local` and restart `pnpm dev`. No local model is required.

```env
GOVERNMENT_DISCOVERY_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_DISCOVERY_MODEL=openrouter/free
TAVILY_API_KEY=your_tavily_key
```

Create the search key at https://app.tavily.com. Tavily's free plan has
1,000 credits per month without a card; the collector uses one basic
search per uncached jurisdiction. Keep pay-as-you-go disabled to retain
the free-plan hard stop. [Tavily pricing](https://www.tavily.com/pricing)

The server resolves city, district and state, restricts search to reviewed
government domains, rejects unrelated geography, and fetches official
pages. OpenRouter summarizes accepted evidence. This does not enable
OpenRouter's paid web search. Indexed PDF/source excerpts are labeled;
the collector does not interpret PDF geometry or interactive maps.
Source metadata comes from retrieval records; unknown publication dates
stay absent. The model cannot replace it. Summaries remain labeled AI summaries, not validated
point-specific hazard findings. The key stays on the server.

Only `openrouter/free` or explicit model IDs ending in `:free` are
accepted. No paid-model fallback or paid search plugin is configured.
OpenRouter currently allows 50 free requests per day and 20 per minute
without purchasing credits; availability can vary. See its
[free-model details](https://openrouter.ai/collections/free-models/).
Missing keys, limits and provider failures keep the original excerpts
with an explanation in Evidence. Failed collection and summary fallbacks
can retry after one minute; successful context uses 24 hours. Concurrent
points in the same jurisdiction share collection work within the server
process. Point job records remain durable. When search is not configured,
only reviewed official portals are checked; domain namespaces are never
treated as website URLs.

Later, choose `GOVERNMENT_DISCOVERY_PROVIDER=openai` and add
`OPENAI_API_KEY` to enable the existing paid search integration.
Every OpenAI source link must match actual search results or citations.
Point-specific numeric findings and mapped categories need validated
source adapters.

Source collection jobs persist under `.local/government-discovery/`
and resume through polling. Completed jobs are reused for 24 hours.
Country domain lists can be extended with the reviewed server setting
`GOVERNMENT_DOMAINS_JSON`. Place search uses Nominatim on submission
with a cache and serialized requests. `GEOCODER_URL` can select a
compatible endpoint.
Search and reverse lookup explicitly request English names. A place
without an English name in the geocoder may retain its published name.

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
- `src/app/echo/`: global coordinate-based ECHO.
- `src/app/[region]/[mode]/`: region workspaces, generated for each sample.
- `src/components/`: shell, shared controls, Home, coverage and methods.
- `src/components/theme/`: theme context and accessible toggle.
- `src/styles/`: light/night tokens and screen styles.
- `src/mocks/`: fixed region and coverage fixtures.
- `src/lib/data/`: source adapters and sample data functions.
- `src/lib/government/`: government domain lists, collection and evidence checks.
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

NET and SERA retain their development preview controls. Home has no
timeline. ECHO ignores preview query states and shows current source
checks. The map waits behind a preparation state until source checks
finish or fail. Analysis shows supported city/district context and
nonempty observations. Broader context and detailed provenance appear
in Evidence. US-only feed cards, controls and wildfire legends are
omitted outside their coverage; empty observations create no hazard card.

## Local checks

At 1440x900, check the Home layout in light and night themes. Select each
region card, search by city or country, and submit an unknown search.
Open Data in this area before and after selecting a point. Confirm
source statuses, source dates, coverage gaps and stale evidence.

Open Data and methods from the footer and its full-page link. Verify
Close, Escape, background dismissal, keyboard focus and return navigation.
Try map pan/zoom, all right-panel tabs, coordinates, device location,
recenter, local notes, and the wildfire layer toggle/opacity. Check that
source collection progress and failures remain visible.

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
checks must be completed locally for the current integration.

Follow `../AGENTS.md`, `../docs/OPEN_QUESTIONS.md`, and `../design/tokens.md`.
