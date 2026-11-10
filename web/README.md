# SafeEarth web

Stage 1, Commit 2: app shell, Home, regional coverage, and Data and methods.
All screens use Sample data. ECHO, NET, SERA, and Ask remain disabled until
their layouts are added in Commit 3.

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
pnpm build
```

Use `pnpm start` to serve a production build. Inter is bundled through
`next/font/local`, so builds do not fetch Google Fonts. The unmodified
Inter 3.013 variable font supports weights 100-900; its SIL Open Font
License and copyright notice are in `src/app/fonts/OFL.txt`.
Upstream font project: https://github.com/rsms/inter.

## Structure

- `src/app/`: root layout, Home at `/`, and `/data-and-methods`.
- `src/components/`: shell, shared controls, Home, coverage and methods.
- `src/components/theme/`: theme context and accessible toggle.
- `src/styles/`: light/night tokens and screen styles.
- `src/mocks/`: fixed region and coverage fixtures.
- `src/lib/data/`: mock-backed functions; components never import fixtures.
- `src/types/`: region, source status and coverage types.

## Local checks for Commit 2

At 1440x900, check the Home layout in light and night themes. Select each
region card, search by city or country, and submit an unknown search.
Open Data in this area before and after selecting a region. Check that
Lisbon, Jakarta and Los Angeles show independent source statuses and dates.
Sources outside California and the population dataset are undecided;
their statuses are examples only, not rollout or provider choices.

Open Data and methods from the footer and its full-page link. Verify
Close, Escape, background dismissal, keyboard focus and return navigation.
Try the illustration zoom and layer controls. These change only the CSS
illustration; there is no real map or live data. The timeline follows in
Commit 3.

Follow `../AGENTS.md`, `../docs/OPEN_QUESTIONS.md`, and
`../design/tokens.md`. Do not add real data or map integrations at this stage.
