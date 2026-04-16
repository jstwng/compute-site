# Compute Deal Map — Interactive Flows Design

**Date:** 2026-04-16
**Project:** `compute-site` (compute.jstwng.com)
**Authors:** Justin (direction), Harrison (coordination), Alice (design), Alex (data)
**Status:** Design approved; pending spec-file review before implementation plan.

## Summary

Add four composable interactions to the Compute Deal Map so the canonical dataset positioning is visible in a 15-30 second demo video:

1. **Company profile panel** — click a node, persistent right-side panel with the full deal ledger, counterparties, and categories.
2. **Trace (directional, multi-path)** — pick an origin and a destination; the tool highlights all shortest directed paths and filters the transactions table to the deals along them.
3. **Timeline** — a scrubber + playback control that fades nodes and edges in chronologically.
4. **Cluster** — a layout toggle that groups nodes by `company.category` in a value-chain arrangement.

All four flows coexist on a single screen via composable toggles. The existing hover popovers (`CompanyCard`, `DealCard`) stay as lightweight previews; the new panel is the click-to-commit drill-in.

## Why

- The X post that accompanies this release is a short video + repo link + announcement. Each flow above is visually demonstrable in a few seconds, and together they communicate "this is a canonical reference dataset, not a novelty viz."
- Current interactions (hover to highlight neighbors, click an edge to scroll the table) understate the data's depth. The profile panel surfaces that depth in the first click.
- The four flows are coherent: profile for substance, Trace for questions, Timeline for scale and velocity, Cluster for structure.

## Design principles

- **Uniformity.** Almost everything on the site is 12px Inter, `var(--text)` charcoal, on `var(--bg)` white. New chrome inherits that register — no serif, no new sizes, no new colors. Weight 600 and `var(--text-muted)` are the only typographic variation used for hierarchy.
- **Two capitalization registers.** The existing title (`ai ecosystem transactions`) and tagline stay lowercase. Every other UI label uses normal sentence or title case.
- **Composable toggles, not mode tabs.** Any combination of Trace + Timeline + Cluster can be active simultaneously. Only one concurrent animation at a time; competing motions are gated (see Section 4 / Section 5).
- **No varying node sizes, no color-coded edges.** All nodes are white fill + charcoal border, all edges are 1px charcoal. Opacity is the only signal used for state (path, pre/post time, filtered out).
- **No arrow symbols anywhere** — not in text, not as arrowheads on graph edges. Direction is communicated textually (e.g., `NVIDIA to TSMC to ASML` in the status strip).

## Scope (in-scope / out-of-scope)

**In scope.**
- Top toolbar (search + three toggles) above the graph.
- Right-anchored, responsive-width panel with two content modes (company, deal).
- Trace flow with all-shortest-paths BFS, path selector, filtered transactions table.
- Timeline dock with scrubber + play/pause, opacity-based fade of inactive nodes/edges.
- Cluster toggle with value-chain centroid arrangement and sentence-case labels.
- Motion-safety rules that prevent concurrent competing animations.
- Mobile behavior: bottom-sheet panel, full-width responsive toolbar.
- One schema housekeeping fix: fill in missing `CATEGORIES` label entries.

**Out of scope.**
- New YAML fields in the `compute-deal-map-data` repo.
- Keyboard-driven command bar or power-user shortcuts.
- Saving UI state in the URL (shareable view links) — could be a follow-up.
- Mobile-specific gestures beyond basic swipe-down dismiss on the bottom sheet.

---

## Section 1 — Top strip, toolbar, and layout frame

### Tagline update (existing header)

One sentence added to the existing tagline; no structural change. Updated copy:

> a structured, source-backed dataset of publicly disclosed ai ecosystem transactions across sovereign AI, hyperscaler capex, custom silicon, and the hardware providers behind them. maintained by justin wang. last updated april 16, 2026. source data public repository [here].

The `last updated` date binds to the build timestamp and is rendered in lowercase (e.g., `april 16, 2026`) to match the tagline's editorial tone.

### New toolbar above the graph

A single 48px-tall strip above the graph container. Horizontal padding 48px to match the existing page header.

**Left: one search input.**
- 240px wide, 32px tall, 1px `var(--border)` border (matches the existing `.filterSearchMinimal` input pattern), sharp corners, transparent fill.
- 12px Inter placeholder: `Search companies, deals, categories`.
- Typing filters the graph and the transactions table live (reuses the existing `applyFilters` pipeline).
- This is the *only* search bar on the site. The search field in `FilterBar.jsx` is removed.

**24px gap.**

**Right: three toggle chips: `Trace`, `Timeline`, `Cluster`.**
- 12px Inter, weight 400 default, weight 500 active.
- Padding 4px 12px. Gap between chips: 12px.
- Active state: 1px charcoal underline 2px below the text baseline. No color change, no border, no fill.
- Hover: opacity 0.7 → 1.0 (subtle).
- Transition: 100ms on all property changes.

No bottom border on the toolbar; separation from the graph is 24px of vertical whitespace.

### Filter bar below the graph — pared down

`FilterBar.jsx`:
- Remove the search field.
- Keep the category and deal type chips.
- These continue to filter **the transactions table only** (not the graph). Graph filtering is driven by the top-strip search plus the three toggles.

### Right-panel slot

Reserved (invisible when empty) on the right edge of the graph container. Panel width: `clamp(280px, 35%, 440px)` on desktop. Mobile (< 900px): bottom sheet, 85vh.

### Responsive

- Below 900px: search becomes full-width on its own row; chips wrap below as a 3-up row.
- Below 600px: right panel becomes a bottom sheet; toolbar remains vertically stacked.

---

## Section 2 — Right panel (company + deal modes)

### Container

- Width: `clamp(280px, 35%, 440px)`. Overlays the right edge of the graph container (does not push it).
- Background: `var(--bg)`.
- 1px `var(--border)` on the left edge only.
- No shadow, no rounded corners.
- Padding: 16px.
- Close affordance top-right: reuses the existing `graphClose` pattern — 11px Inter, `var(--text-muted)`, text `Close`, 150ms color transition on hover.
- Overflow-y: auto. Height equals the graph container's height.

### Typography and color — uniform

- Default: 12px Inter, `var(--text)`. Everywhere.
- Weight 600 on: company name, subheads (`Counterparties`, `Deals · N`), counterparty names in rows.
- `var(--text-muted)` on: ticker, metadata lines, dates, categories, dollar values, aggregate lines.
- Links use the existing underline pattern (`text-decoration-color: var(--link-underline)`, offset 2px).
- No serif typeface. No new sizes. No new colors.

### Company mode

1. **Identity line.** `Name` (weight 600) + `Ticker` (muted), inline, 8px gap.
2. **Metadata (two lines, both muted).**
   - Line 1: `11 deals · 7 counterparties · 2019–2026`.
   - Line 2: `custom silicon, GPU supply, memory supply` — top 3 deal categories by frequency for this company.
3. **Counterparties block.**
   - Subhead `Counterparties` (weight 600).
   - Rows sorted by deal count descending. Each row: counterparty name (weight 600) left-aligned, count (muted) right-aligned.
   - Clicking a row filters the deal ledger below and shows a dismissible filter indicator above the ledger.
4. **Deals block.**
   - Subhead `Deals · 11` (weight 600).
   - Rows newest first, 2-3 lines each:
     - Line 1: date (muted) — counterparty (weight 600) — deal type (muted), middle-dot separators.
     - Line 2: one-line description.
     - Line 3: value (muted) — `View source` link.
   - Row hover: `var(--row-hover)` background (matches existing table).
   - Row click scrolls the transactions table to that deal via the existing `onScrollToRow` callback.

### Deal mode

1. **Identity line.** `NVIDIA and CoreWeave` (weight 600). Below, muted: deal category and deal type, comma-separated.
2. **Aggregate line** (multi-deal edges only): `3 deals · $X.XB aggregate` (muted).
3. **Per-deal rows.** Same row pattern as the Deals block, minus the counterparty field.
4. **Footer — jump.** `View company profile: [Buyer name] · [Seller name]`. Both are links; clicking swaps the panel to that company's profile.

### Panel behavior in other modes

- `Trace` active: clicks on nodes/edges pick path endpoints; the panel does not open.
- `Timeline` active: deal rows with dates outside the current scrubber range render at 30% opacity.
- `Cluster`: no effect on panel content.

Dark mode works automatically via CSS vars (no per-mode overrides needed).

### Mobile

- Panel becomes a bottom sheet, 85vh tall.
- Drag handle at the top (4px tall, 40px wide, `var(--text-muted)`, 8px above content).
- Content layout unchanged.
- Dismiss: click outside, swipe down on the handle, or tap `Close`.

### Triggers

- Click a node → panel opens in company mode for that node.
- Click an edge → panel opens in deal mode for that edge.
- Subsequent clicks replace the panel content; only one panel is open at a time.
- Clicking outside the panel, pressing `Escape`, or clicking `Close` dismisses.

Hover popovers (`CompanyCard`, `DealCard`) remain unchanged — they're the lightweight preview, the panel is the persistent drill-in.

---

## Section 3 — Trace (directional, multi-path)

### Direction convention

- Edges are directional, following `source -> target` in the data (i.e., supplier to customer, which is the supply-flow direction).
- Traversal during Trace strictly follows this direction. If any candidate path would require an edge in reverse, it is not considered a valid path.
- The graph never renders arrowheads. Direction is communicated textually via the path description in the status strip (e.g., `NVIDIA to TSMC to ASML`) and via the no-path message.

### State machine

**Sub-state 1 — picking origin.**
- Activated by clicking the `Trace` chip in the toolbar.
- Chip enters active state (weight 500 + underline).
- Graph: all nodes and edges fade to 20% opacity. Cursor on node hover: pointer.
- A 28px **status strip** appears directly below the toolbar row (12px Inter, `var(--text)`): `Pick an origin company`. Right side: `Cancel` link (muted, hover underline) — exits Trace entirely.
- Clicking a node: that node becomes the origin and returns to full opacity. No border change, no color change — opacity contrast is the only signal.

**Sub-state 2 — picking destination.**
- Status strip updates: `Origin: NVIDIA · Pick a destination company` (origin name in weight 600). Right side: `Clear` (resets to sub-state 1), `Cancel` (exits entirely).
- Clicking a node triggers directed BFS from origin to destination over the unique `source -> target` edge set. Multi-deal edges collapse to single directed edges for pathfinding; individual deals surface in the table.
- All shortest paths are enumerated (BFS layer-by-layer), not just one. Deduplicated by node sequence.

**Sub-state 3 — path(s) displayed.**

*Single-path case:*
- Status strip: `NVIDIA to TSMC to ASML · 2 hops · 1 path` (node names weight 600). Right side: `Clear · Cancel`.
- Path nodes and path edges: full opacity. All others: 20% opacity. Edges in the graph are otherwise unchanged (1px charcoal).
- Transactions table filters to the deals along the path, in path order (buyer-side deals first, then next hop). Dismissible banner above the table: `Showing 7 deals along the path from NVIDIA to ASML · Clear`.

*Multi-path case (equal-length shortest paths):*
- Status strip: `NVIDIA to ASML · 3 hops · 2 paths`. Right side: `Clear · Cancel`.
- A **path selector row** (28px, below the status strip) appears with chips: `All` (active by default) + one chip per path, labeled `Path 1: NVIDIA to TSMC to ASML`, `Path 2: NVIDIA to Samsung to ASML`, etc. Active chip: weight 500 + underline.
- `All` active: every node and edge that belongs to at least one path at full opacity. Edges shared across paths render once.
- `Path N` active: only that path's nodes and edges at full opacity. All others (including other-path-only nodes) at 20%.
- Transactions table filters to the deals along the currently-selected path.

*No-path case:*
- Status strip: `No path from Microsoft to ASML (following supply flow). Try Swap · Cancel`. `Swap` flips origin and destination and re-runs BFS. On success, transitions to sub-state 3 without requiring re-picks. If the reversed path also has no result, the status strip updates to `No path either direction between Microsoft and ASML · Pick different companies · Cancel` and returns to sub-state 2 (destination still set as the swapped value for convenience).

*Same-node case:*
- Status strip: `Origin and destination are the same company · Pick a different destination`. Stays in sub-state 2.

### Click behavior while path is displayed

- Click a path node: panel opens in company mode. Trace stays active.
- Click a path edge: panel opens in deal mode for that edge's deal(s).
- Click an off-path node/edge: no panel opens; the element briefly flashes to signal it's off-path.
- `Escape` or clicking `Cancel`: exits Trace mode entirely. `Clear` resets to sub-state 1.

### Pathfinding details

- Algorithm: directed BFS over the adjacency list of unique `source -> target` edges.
- Tie-break for equal-length paths: enumerate all of them (not a single arbitrary winner).
- Performance: 81 nodes, ~186 directed edges → all-shortest-paths BFS in well under a millisecond. No precomputation.

### Composition with other modes

- **+ Timeline:** Timeline is the dominant filter. A path edge whose deal date is after the slider value is hidden (opacity 0) along with every other Timeline-inactive edge — not dimmed to 20% like off-path edges. The status strip appends `Path incomplete as of <date> · N of M hops active` when any hop is currently Timeline-inactive. Path node opacity follows the same rule as any other node (20% when Timeline-inactive, full when active and on-path). Scrubbing forward reveals missing hops and completes the path.
- **+ Cluster:** path highlighting persists through the 400ms cluster layout transition. Off-path dimming remains.
- **+ Search:** search filter applies first (narrowing visible nodes); Trace operates on the filtered set. If search filters out either endpoint mid-path, Trace exits automatically and surfaces `Search removed the origin or destination — Trace cancelled` for 2 seconds.

---

## Section 4 — Timeline (scrubber and playback)

### Dock

- A 24px strip appears at the bottom of the graph container when `Timeline` is active. When inactive, the strip collapses to 0px. The graph container reserves 32px of bottom padding regardless, so toggling does not cause layout jump.
- Single-row dock layout:
  - **Left:** Play/Pause text control. `Play` idle, `Pause` playing. 11px Inter, `var(--text-muted)`, transparent background, sharp corners. Hover: `var(--text)`.
  - **Middle:** Slider track. 2px tall. Unfilled: `var(--border)`. Filled (left of thumb): `var(--text)`. Thumb: 10x10 square, `var(--text)` fill, 1px `var(--bg)` stroke, sharp corners, no shadow.
  - **Right:** Current value readout. 12px Inter, `var(--text)`. Format: `Oct 2024` (same as `date_display` elsewhere).

### Range and granularity

- Range: earliest deal date in the dataset (computed at build time) to today.
- Granularity: monthly. Drag snaps to month boundaries.
- Initial position: max (today). All deals shown; toggle-on is non-disruptive.

### Scrub semantics

- A deal is **active as of T** iff its `date` is less than or equal to the slider value.
- **Edges:** inactive deals' edges are hidden (opacity 0). They don't appear in hover and don't count for Trace BFS when Timeline is active.
- **Nodes:** a node is active iff at least one of its inbound or outbound deals is active. Inactive nodes render at 20% opacity in their force-layout position. Positions do NOT re-run on scrub — the layout is computed once against the full dataset, so scrubbing produces a stable fade-in animation.
- **Transactions table:** filters to active deals. Dismissible banner above the table: `Showing 127 deals as of Oct 2024`. Dismissing the banner also exits Timeline.

### Playback

- Default speed: 3 years per second (full range ≈ 23 years ≈ 8 seconds of playback).
- Clicking `Play` from any position advances forward. If slider is at max, `Play` first rewinds to earliest, then advances.
- Auto-pauses at max.
- `Pause` holds current position; clicking `Play` resumes from there.
- Dragging the thumb during playback auto-pauses.

### Undated deals

- Every current deal has a `YYYY-MM` date. Future-proof case: deals without parseable dates are always visible regardless of the scrubber, and a footnote appears below the dock: `N deals without dates always shown` (rendered only if N > 0).

### Composition with other modes

- **+ Cluster:** motion-safe — if Timeline is playing and the user toggles Cluster, Timeline pauses, the 400ms cluster layout animation completes, then Timeline resumes at the scrubbed value. No concurrent competing animations.
- **+ Trace:** as described above — Timeline filter applies to path edges; status strip indicates path incompleteness when applicable.
- **+ Search:** both filters compose multiplicatively.

---

## Section 5 — Cluster (role-grouped layout)

### Group set

- Groups are determined by each company's `category` field in `companies.generated.json`.
- Categories present in data today: `chip_designer`, `hyperscaler`, `neocloud`, `ai_lab`, `data_center`, `investor`, `memory`, `equipment`, `networking`, `packaging`, `power`, `server_oem`.
- Group set is derived at build time from the data. New categories added to the data repo are picked up automatically.

### Labels

Rendered sentence case, matching the site's capitalization rule:

`Chip designers`, `Hyperscalers`, `Neoclouds`, `AI labs`, `Data centers`, `Investors`, `Memory`, `Equipment`, `Networking`, `Packaging`, `Power`, `Server OEMs`.

Labels:
- 12px Inter, `var(--text-muted)`, weight 500.
- Positioned near each centroid, offset so they never overlap with nodes.
- One label per non-empty cluster. Labels for empty clusters hide automatically.
- Fade in over the 400ms layout transition.

### Value-chain arrangement

Centroids positioned roughly left-to-right following the supply chain:

- **Left:** `Equipment`, `Memory`, `Packaging`.
- **Left-center:** `Networking`, `Power`.
- **Center:** `Chip designers`.
- **Right-center:** `Neoclouds`, `Data centers`, `Server OEMs`.
- **Right:** `Hyperscalers`, `AI labs`.
- **Orthogonal (top or far edge):** `Investors`.

Exact centroid coordinates are tuned during implementation; the rule is "left-to-right follows upstream-to-downstream; Investors sits outside the value-chain line."

### Layout mechanism

- The existing D3 force simulation runs with added `forceX` and `forceY` per-node terms that point at that node's cluster centroid.
- Strength of the centroid pull is tuned so nodes visibly cluster while edges still pull highly-connected nodes toward the boundary between their cluster and their frequent counterparties (e.g., NVIDIA sits in `Chip designers` but on the side closest to `Hyperscalers`).
- Transition: 400ms ease-in-out. Positions are computed at toggle time and tweened — no continuous re-simulation during the transition.

### Node and edge treatment

- Unchanged. White fill, charcoal border, 12px Inter label, 1px charcoal edges.
- No color coding by cluster. Cluster identity is communicated entirely by spatial grouping plus the cluster label.

### Filter interactions

- Empty clusters: label hides.
- Search filtering first narrows visible nodes; the cluster layout operates over the filtered set. Mid-search toggling re-runs the 400ms transition.

### Composition with other modes

- **+ Timeline:** motion-safe (see Section 4). Cluster labels render at full opacity regardless of Timeline opacity state on nodes.
- **+ Trace:** path highlighting persists through the layout transition.
- **+ Search:** described above.

---

## Section 6 — Data, derived state, and schema

### No source-data changes required

No changes to YAML files in `compute-deal-map-data`. All four flows derive from existing fields:

- Deals: `source_slug`, `target_slug`, `source_category`, `target_category`, `deal_type`, `date` (YYYY-MM), `value_billions`, `description`, `source_url`, `date_display`, `value_display`.
- Companies: `name`, `ticker`, `slug`, `category`.

### Derived at runtime

- **Per-company aggregates** (profile panel): total deal count, unique counterparties, year range, top 3 deal categories by frequency.
- **Directed adjacency list** (Trace BFS): built once per filter-change; all-shortest-paths BFS runs on demand.
- **Active deal mask** (Timeline): boolean mask computed on each scrub; drives edge and node opacity + table filtering.
- **Cluster centroids**: derived from graph container dimensions and the value-chain arrangement.

All derived state is computed in milliseconds at this dataset size; no memoization or server-side computation needed.

### Small housekeeping additions

1. **Fill in the `CATEGORIES` label map in `companies.js`.** Currently it covers 6 of the 12 category values used in the data. Add entries for `data_center`, `equipment`, `memory`, `networking`, `packaging`, `power`, `server_oem`. Labels use the sentence-case forms listed in Section 5. Drop the `fill`/`border` color fields (removed per the black-and-white node rule) or keep them inert — implementation choice.
2. **Build-time `EARLIEST_DATE` and `LATEST_DATE` exports in `data.js`.** Timeline uses these to compute its range.

---

## Section 7 — Video shot list (suggested)

A 20-second sequence that exercises all four flows. Adjust to taste.

| Time | Shot |
|---|---|
| 0-2s | Default view. Graph settles into the force layout. Title and tagline visible above. |
| 2-4s | Hover over NVIDIA. Existing hover popover appears briefly. |
| 4-7s | Click NVIDIA. Right panel slides in. Show the profile: counts line, categories line, counterparties block, top of the deal ledger. Scroll one or two rows. |
| 7-8s | Close the panel. |
| 8-11s | Click `Trace`. Click ASML as origin. Click Microsoft as destination. Path lights up: `ASML to TSMC to NVIDIA to Microsoft`. Transactions table filters to path deals with the banner visible. |
| 11-12s | Click `Cancel` to exit Trace. |
| 12-13s | Click `Timeline`. Drag slider back to 2018. Most AI-era nodes fade to 20%. |
| 13-17s | Click `Play`. Watch the ecosystem fill in over ~4 seconds as the scrubber sweeps to 2026. AI labs and neoclouds populate post-2022. |
| 17-19s | Scrubber near 2026. Click `Cluster`. Layout transitions into the value-chain arrangement. `Equipment` cluster's small size contrasts with the dense `Chip designers` and `Hyperscalers` clusters. |
| 19-20s | Hold on the cluster view. End card overlay with `github.com/jstwng/compute-deal-map-data` and Justin's handle. |

Every transition is already spec'd for 200-400ms, which stitches to ~8 interaction moments in 20 seconds — the right cadence for an X post.

---

## Motion safety rules (cross-cutting)

- No more than one concurrent animation on the graph at any time.
- Timeline playback auto-pauses while Cluster is animating (400ms), then resumes.
- Layout transitions (Cluster on/off) always run to completion before any other animation starts.
- Path dimming is instantaneous (opacity transition 0ms) — it does not count as animation and can coexist with Timeline scrubs or Cluster transitions.
- All chip toggle state changes are 100ms and do not gate other animations.

## Typography and color tokens (reference)

- **Font:** Inter (system fallback), 12px default.
- **Weights used:** 400 (default), 500 (active chip, cluster label), 600 (identity names, subheads, counterparty names).
- **Color tokens:** `var(--text)`, `var(--text-muted)`, `var(--text-faint)`, `var(--bg)`, `var(--border)`, `var(--border-strong)`, `var(--row-hover)`, `var(--link-underline)`. No new tokens added.
- **Capitalization:** title and tagline stay lowercase (existing editorial tone); every other label uses sentence or title case.
- **No serif typefaces. No all-uppercase UI. No color coding on nodes or edges.**

## Testing surface (high level)

- **Trace:** BFS correctness, including directed traversal, all-shortest-paths enumeration, no-path case, same-node case, multi-path visual state transitions, swap behavior.
- **Timeline:** date filtering correctness including YYYY-MM granularity, playback timing, auto-pause/resume around Cluster, undated deal handling, table banner sync.
- **Cluster:** label rendering, centroid stability, empty-cluster label hide, 400ms transition timing, composition with Timeline (no concurrent animation).
- **Panel:** mode switching, scroll-to-row handoff, row hover state, mobile bottom sheet, escape/close/outside-click dismiss.
- **Composition:** search + timeline, trace + timeline (incomplete path), trace + cluster, all four active simultaneously.
- **Filters:** graph filter pipeline consistency (top search affects graph; below-graph filters affect table only).

Unit tests for pure logic (BFS, date filtering, cluster grouping, per-company aggregates). E2E smoke tests for each flow. Visual regression screenshots across Explore / Trace / Timeline / Cluster states.

## File-level impact (preview)

- `src/components/ComputeDealMap/index.jsx` — wire toolbar + panel + trace/timeline/cluster state.
- `src/components/ComputeDealMap/Toolbar.jsx` (new) — search + three chip toggles.
- `src/components/ComputeDealMap/ProfilePanel.jsx` (new) — company + deal modes.
- `src/components/ComputeDealMap/TraceStrip.jsx` (new) — status strip + path selector.
- `src/components/ComputeDealMap/TimelineDock.jsx` (new) — play/pause + slider + year readout.
- `src/components/ComputeDealMap/Graph.jsx` — extend with opacity state, cluster layout, directional adjacency export.
- `src/components/ComputeDealMap/FilterBar.jsx` — remove search field; keep category and deal type chips.
- `src/components/ComputeDealMap/DealTable.jsx` — accept an optional filter override (for path-filtered or timeline-filtered state) and render the banner.
- `src/components/ComputeDealMap/companies.js` — fill in `CATEGORIES` label map.
- `src/components/ComputeDealMap/data.js` — export `EARLIEST_DATE`, `LATEST_DATE`.
- `src/components/ComputeDealMap/logic.js` — add `buildDirectedAdjacency`, `allShortestPaths`, `perCompanyAggregates`, `activeAsOf`.
- `src/components/ComputeDealMap/styles.module.css` — new classes for toolbar, panel, strip, dock; preserve existing tokens.

This breakdown is a preview for the implementation plan; the plan will resolve exact file boundaries and sequencing.
