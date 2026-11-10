# SafeEarth web

Stage 1 scaffold only. The setup page uses Sample data labeling; screen
layouts and shared application components follow in separate commits.

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

- `src/app/`: root layout, global CSS, and temporary setup page.
- `src/components/theme/`: theme context and accessible toggle.
- `src/styles/tokens.css`: light/night semantic colors and shared sizing.

Follow `../AGENTS.md`, `../docs/OPEN_QUESTIONS.md`, and
`../design/tokens.md`. Do not add real data or map integrations at this stage.
