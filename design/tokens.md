# Design Tokens

## Reference and confidence

Reviewed all 11 PNGs in `screens/`: Home; ECHO Los Angeles, night and
zoomed in; ECHO Jakarta; NET; SERA; Ask; Data and methods; and both
Data in this area views. All are 1440x900 desktop references.

Colors below are sampled from flat screenshot regions. Font sizes,
spacing, radii, and shadows are visual estimates for later implementation,
not recovered CSS. The exact font family is unresolved; see
`../docs/OPEN_QUESTIONS.md`. The compressed HTML reference was not opened.

## Theme colors

Use these names as CSS custom properties when implementing the app.

| Token | Light | Night | Role |
| --- | --- | --- | --- |
| `--surface` | `#FFFFFF` | `#201F1C` | Header, cards, panel, drawer |
| `--surface-muted` | `#F4F2EE` | `#161614` | Footer, segmented control track |
| `--text` | `#26231F` | `#EDEAE4` | Main text |
| `--text-muted` | `#5E5A53` | `#B8B3A8` | Sources, dates, helper text |
| `--border` | `#DDD8CF` | `#3A3833` | Dividers and card outlines |
| `--accent` | `#0F766E` | `#4FB7AB` | Primary actions, routes, sliders |
| `--accent-soft` | `#D9EFEC` | `#17403C` | Active tabs and selected rows |
| `--map-land` | `#E8EAE4` | `#262723` | Map base |
| `--map-terrain` | `#DDDFD4` | `#2D2E29` | Map land variation |
| `--map-water` | `#D3DEE0` | `#1E2A2D` | Water |
| `--map-road` | `#CFCBC0` | `#3D3B36` | Base roads |
| `--missing-fill` | `#E7E4DE` | `#34322E` | Not enough data |
| `--alert-bg` | `#F8DFDA` | `#4A1D1D` | Official alert banner |
| `--alert-text` | `#6E1818` | `#F6D3CF` | Official alert text |
| `--stale-bg` | `#FBEBC0` | `#4A3A12` | Old-data chip |
| `--stale-text` | `#6B4A00` | `#F6DC99` | Old-data text |
| `--stale-border` | `#C99A2E` | `#C99A2E` | Old-data outline |

Light primary buttons use white text. Night primary buttons use dark text
on the brighter accent. Validate WCAG AA contrast when implementing.

## Risk colors and map patterns

| Risk | Map fill, both themes | Light chip bg / text | Night chip bg / text | Icon shape |
| --- | --- | --- | --- | --- |
| Low | `#6FB287` | `#DDF1E4` / `#1B5E36` | `#1F3D2B` / `#BFE8CE` | Circle |
| Moderate | `#E8C547` | `#FAF0C8` / `#6B5200` | `#4A3F12` / `#F6E3A0` | Diamond |
| High | `#E8893A` | `#FCE3CC` / `#8A3F00` | `#4D2E12` / `#FAD2AC` | Triangle |
| Extreme | `#A32A2A` | `#F5D5D5` / `#7A1515` | `#4F1D1D` / `#F6C9C9` | Octagon |

- Measured: solid fill; Modeled: diagonal hatching over the risk fill.
- Not enough data: neutral gray fill, dotted outline, explicit text.
- Selection: thick accent outline; selected table rows use accent-soft.
- NET alternatives use solid, dashed, and dotted lines with letter labels.
- Zoomed out uses H3 hexagons; zoomed in uses zones, roads, and official
  boundaries. Keep risk icon plus text wherever risk is identified.

## Typography

The references use a neutral sans-serif appearance. Confirm the family
before choosing a font or adding a font dependency. Estimated scale:

| Role | Size | Weight | Line height |
| --- | --- | --- | --- |
| Home headline | 28px | 700 | 34px |
| Summary metric | 24px | 700 | 29px |
| Modal heading | 20px | 700 | 26px |
| Section or card heading | 16px | 700 | 21px |
| Body, inputs, navigation | 14px | 400; 600-700 for actions | 20px |
| Tables | 13px | 400; 700 for headings | 18px |
| Chips, sources, dates, footer | 12px | 400; 600 for chips | 16px |

## Spacing and layout

Estimated spacing scale: `4, 8, 12, 16, 24, 32px`.

- Use 4px within compact chip groups, 8px between related controls,
  12px card padding, 16px panel padding, and 24-32px for larger groups.
- At 1440x900, the header is 56px tall. The right panel is 380px wide,
  leaving a 1060px map area. An official alert adds about 38px below
  the header.
- The bottom timeline is about 40px collapsed or 140px expanded; the
  persistent disclaimer footer is 32px tall.
- Summary cards sit across the map's upper left. Legends anchor at the
  lower left; zoom and layer controls sit at the upper right of the map.
- Ask is a roughly 420px right drawer. Data and methods uses an 840px
  dialog; Data in this area uses a roughly 500px anchored popover.
- Search fields are about 36px tall in the references. Interactive hit
  targets must be at least 44px per `AGENTS.md`, including compact controls.

## Radii and shadows

Estimated radii: 6px for inputs and small controls; 8px for primary
buttons, active tabs, and dialogs; 10px for cards and popovers; full
rounding (`999px`) for chips and circular map markers.

Approximate shadow recipes to tune against the PNGs:

| Token | Suggested value | Use |
| --- | --- | --- |
| `--shadow-card` | `0 1px 4px rgb(38 35 31 / 22%)` | Light floating cards and controls |
| `--shadow-overlay` | `0 12px 28px rgb(0 0 0 / 25%)` | Dialogs and popovers |
| `--shadow-card-night` | `0 1px 4px rgb(0 0 0 / 18%)` | Night cards; retain border |
| `--scrim` | `rgb(0 0 0 / 40%)` | Ask backdrop and modal backdrop |

## Repeated components

- App header: brand, region search, ECHO/NET/SERA tabs, coverage, Ask,
  and theme control.
- Official alert banner and per-region coverage notice.
- Metric card with source/date, Measured or Modeled label, and age chip.
- Coverage status chips: Live, Updated daily, Static map, Global model,
  Not available; plus "May be out of date" for old data.
- Map controls, selection tooltip, risk legend, and patterned map shapes.
- Right panel tabs: Layers, Analysis, Evidence, Glossary; layer checkboxes
  and opacity sliders; analysis tables and result cards.
- Timeline mode tabs, scrubber, and compact charts.
- Forms, comparison cards, progress indicators, and sensitivity sliders.
- Ask drawer, source chips, methods dialog, and regional coverage popover.
- Persistent emergency disclaimer, Sample data label, and methods link.

## Reference constraints

`AGENTS.md` governs implementation. SERA's site ordering and confidence
labels need a design decision before reuse; see the open questions.
Source names and numbers in the references remain Sample data. Do not
treat them as approved sources or computed results. Use ASCII text in
docs, code, and UI strings.
