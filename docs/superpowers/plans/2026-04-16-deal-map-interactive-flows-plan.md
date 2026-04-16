# Deal Map Interactive Flows — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the four composable interactive flows (profile panel, directional Trace, Timeline scrubber, Cluster layout) so the tool is ready for Justin's X launch video per the approved design spec.

**Architecture:** Composable toggles in a new top toolbar drive three orthogonal view-altering modes (Trace / Timeline / Cluster) plus a right-anchored profile/deal panel that opens on click. Pure logic (all-shortest-paths BFS, per-company aggregates, date filtering, cluster centroids) lives in `logic.js` with unit tests; UI components wire that logic into `Graph.jsx` and a new toolbar + panel. Motion is gated so only one animation runs on the graph at a time.

**Tech Stack:** React 18, Vite, d3-force (already in use), CSS Modules, new: `vitest` + `@testing-library/react` for unit/component tests.

**Spec:** `docs/superpowers/specs/2026-04-16-deal-map-interactive-flows-design.md`

---

## Pre-flight: decisions to confirm before Task 1

**Focus mode vs. profile panel on node click.** Today, clicking a node in `Graph.jsx` enters "focus mode" (narrows the visible graph to the focused node and its neighbors). The spec says clicking a node opens the profile panel. To preserve focus mode as an opt-in from within the panel, every task below assumes this plan:

- Default single-click on a node: opens the panel in company mode.
- Inside the panel, a `Focus on this company` link next to the identity line triggers the existing focus behavior (`setFocusedNode`) and closes the panel.
- The existing `Reset view` button in the corner continues to exit focus mode as today.

If Justin wants a different split (e.g., keep single-click focus, use a different affordance for the panel), flag before Task 8.

**Plan location.** This file lives alongside the spec at `docs/superpowers/plans/2026-04-16-deal-map-interactive-flows-plan.md` for colocation. Justin's canonical plans directory (`~/.claude/plans/`) can have a symlink added later if useful.

---

## File Structure (preview)

```
src/components/ComputeDealMap/
  index.jsx                 # orchestrator: holds toolbar + panel state; unchanged contract to App.jsx
  App.jsx                   # (src/)  tagline edit + toolbar mount
  Toolbar.jsx               # NEW: search + 3 chip toggles
  ProfilePanel.jsx          # NEW: right panel, company and deal modes
  TraceStrip.jsx            # NEW: Trace status strip + path selector row
  TimelineDock.jsx          # NEW: slider + play/pause dock
  FilterBar.jsx             # MODIFY: remove search field
  DealTable.jsx             # MODIFY: accept filter-override + banner slot
  Graph.jsx                 # MODIFY: accept trace/timeline/cluster state via props; emit onClickNode/onClickEdge
  companies.js              # MODIFY: fill in CATEGORIES labels
  data.js                   # MODIFY: export EARLIEST_DATE, LATEST_DATE
  logic.js                  # MODIFY: add perCompanyAggregates, activeAsOf, buildDirectedAdjacency, allShortestPaths, clusterCentroids
  styles.module.css         # MODIFY: new classes for toolbar, panel, strip, dock
src/
  App.jsx                   # MODIFY: render Toolbar, ProfilePanel, TraceStrip, TimelineDock in the right places
  app.css                   # (unchanged, likely)
tests/
  logic.test.js             # NEW
  ProfilePanel.test.jsx     # NEW
  Toolbar.test.jsx          # NEW
vite.config.js              # NEW: add vitest config
package.json                # MODIFY: add vitest + @testing-library/react devDeps + test script
```

Tests colocate in a top-level `tests/` dir (existing project convention doesn't have tests; `tests/` matches the more common vitest default).

---

## Phase 0 — Test infrastructure

### Task 0: Install vitest and testing-library; wire up a smoke test

**Files:**
- Modify: `package.json`
- Create: `vite.config.js` (project currently has no vite.config — vitest extends the vite config)
- Create: `tests/setup.js`
- Create: `tests/smoke.test.js`

- [ ] **Step 1: Install dev dependencies**

Run:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

Expected: added to `package.json` devDependencies.

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dealDataPlugin from './scripts/vite-plugin-deal-data.mjs'

export default defineConfig({
  plugins: [react(), dealDataPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
  },
  server: {
    port: 8002,
  },
})
```

Note: if the project already relies on implicit vite defaults, verify the existing `scripts/vite-plugin-deal-data.mjs` is actually imported here. If it was previously auto-loaded, leave the auto-load mechanism alone and only add the `test` block.

- [ ] **Step 3: Create `tests/setup.js`**

```js
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Create `tests/smoke.test.js`**

```js
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Add `test` script to `package.json`**

In `package.json` `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Run the smoke test**

Run:
```bash
npm test
```

Expected: one passing test.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.js tests/
git commit -m "chore: add vitest + testing-library for component and logic tests"
```

---

## Phase 1 — Data helpers and CATEGORIES cleanup

### Task 1: Fill in `CATEGORIES` labels and export date range constants

**Files:**
- Modify: `src/components/ComputeDealMap/companies.js`
- Modify: `src/components/ComputeDealMap/data.js`

- [ ] **Step 1: Update `CATEGORIES` in `companies.js`**

Replace the existing `CATEGORIES` constant with entries for every category present in the data. Drop the per-category color fields (node colors come from the global black-and-white rule, not per-category).

```js
export const CATEGORIES = {
  chip_designer: { label: 'Chip designers' },
  hyperscaler:   { label: 'Hyperscalers' },
  neocloud:      { label: 'Neoclouds' },
  ai_lab:        { label: 'AI labs' },
  data_center:   { label: 'Data centers' },
  investor:      { label: 'Investors' },
  memory:        { label: 'Memory' },
  equipment:     { label: 'Equipment' },
  networking:    { label: 'Networking' },
  packaging:     { label: 'Packaging' },
  power:         { label: 'Power' },
  server_oem:    { label: 'Server OEMs' },
}

export function categoryLabel(slug) {
  return CATEGORIES[slug]?.label ??
    slug.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}
```

Keep the existing `COMPANIES`, `COLUMNS`, `findCompany` exports intact.

- [ ] **Step 2: Export `EARLIEST_DATE` and `LATEST_DATE` in `data.js`**

At the bottom of `data.js`, add:

```js
function parseDateKey(d) {
  // d.date is "YYYY-MM". Return sortable key.
  return d.date || ''
}

export const EARLIEST_DATE = DEALS.reduce(
  (min, d) => (!min || parseDateKey(d) < min ? parseDateKey(d) : min),
  ''
)

export const LATEST_DATE = DEALS.reduce(
  (max, d) => (parseDateKey(d) > max ? parseDateKey(d) : max),
  ''
)
```

- [ ] **Step 3: Verify the build still succeeds**

Run:
```bash
npm run build
```

Expected: build completes without errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ComputeDealMap/companies.js src/components/ComputeDealMap/data.js
git commit -m "feat(data): fill in CATEGORIES labels; export EARLIEST_DATE / LATEST_DATE"
```

### Task 2: Pure logic — per-company aggregates, directed adjacency, shortest paths, date filter

**Files:**
- Modify: `src/components/ComputeDealMap/logic.js`
- Create: `tests/logic.test.js`

- [ ] **Step 1: Write failing tests first**

Create `tests/logic.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  perCompanyAggregates,
  activeAsOf,
  buildDirectedAdjacency,
  allShortestPaths,
} from '../src/components/ComputeDealMap/logic.js'

const deals = [
  { id: 'a', source: 'A', target: 'B', date: '2020-01', deal_type: 'gpu_purchase' },
  { id: 'b', source: 'B', target: 'C', date: '2022-06', deal_type: 'custom_asic' },
  { id: 'c', source: 'A', target: 'C', date: '2024-01', deal_type: 'gpu_purchase' },
  { id: 'd', source: 'D', target: 'A', date: '2019-03', deal_type: 'equipment_supply' },
]

describe('perCompanyAggregates', () => {
  it('counts inbound + outbound deals per company', () => {
    const agg = perCompanyAggregates(deals)
    expect(agg.get('A').totalDeals).toBe(3)
    expect(agg.get('A').counterparties.size).toBe(3)
    expect(agg.get('A').earliest).toBe('2019-03')
    expect(agg.get('A').latest).toBe('2024-01')
  })

  it('ranks top deal types by frequency', () => {
    const agg = perCompanyAggregates(deals)
    const top = agg.get('A').topDealTypes
    expect(top[0]).toBe('gpu_purchase')
  })
})

describe('activeAsOf', () => {
  it('includes deals with date <= threshold', () => {
    const active = activeAsOf(deals, '2022-06')
    expect(active.map(d => d.id).sort()).toEqual(['a', 'b', 'd'])
  })

  it('returns empty when before all deals', () => {
    expect(activeAsOf(deals, '2010-01')).toEqual([])
  })

  it('returns all when at or past latest', () => {
    expect(activeAsOf(deals, '2030-01').length).toBe(4)
  })
})

describe('buildDirectedAdjacency', () => {
  it('maps each source to its set of targets', () => {
    const adj = buildDirectedAdjacency(deals)
    expect([...adj.get('A')].sort()).toEqual(['B', 'C'])
    expect([...adj.get('D')]).toEqual(['A'])
    expect(adj.get('C')).toBeUndefined() // C has no outbound edges
  })
})

describe('allShortestPaths', () => {
  it('returns single shortest path when only one exists', () => {
    const paths = allShortestPaths(deals, 'D', 'C')
    expect(paths).toEqual([['D', 'A', 'C']])
  })

  it('returns all shortest paths when multiple of equal length exist', () => {
    const d2 = [
      ...deals,
      { id: 'e', source: 'A', target: 'E', date: '2021-01', deal_type: 'gpu_purchase' },
      { id: 'f', source: 'E', target: 'C', date: '2022-01', deal_type: 'gpu_purchase' },
    ]
    const paths = allShortestPaths(d2, 'A', 'C')
    // Both direct (A->C) and longer are possible; direct wins (length 2)
    expect(paths.length).toBe(1)
    expect(paths[0]).toEqual(['A', 'C'])
  })

  it('returns [] when no directed path exists', () => {
    const paths = allShortestPaths(deals, 'C', 'A')
    expect(paths).toEqual([])
  })

  it('returns [] when origin === destination', () => {
    expect(allShortestPaths(deals, 'A', 'A')).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests, confirm they fail**

Run:
```bash
npm test -- tests/logic.test.js
```

Expected: multiple FAILs about undefined exports.

- [ ] **Step 3: Implement `perCompanyAggregates` in `logic.js`**

```js
export function perCompanyAggregates(deals) {
  const byCompany = new Map()
  for (const d of deals) {
    for (const role of ['source', 'target']) {
      const name = d[role]
      if (!name) continue
      if (!byCompany.has(name)) {
        byCompany.set(name, {
          totalDeals: 0,
          counterparties: new Set(),
          earliest: null,
          latest: null,
          dealTypeCounts: new Map(),
        })
      }
      const agg = byCompany.get(name)
      agg.totalDeals += 1
      const other = role === 'source' ? d.target : d.source
      if (other && other !== name) agg.counterparties.add(other)
      if (d.date) {
        if (!agg.earliest || d.date < agg.earliest) agg.earliest = d.date
        if (!agg.latest || d.date > agg.latest) agg.latest = d.date
      }
      const t = d.deal_type
      if (t) agg.dealTypeCounts.set(t, (agg.dealTypeCounts.get(t) || 0) + 1)
    }
  }
  for (const agg of byCompany.values()) {
    agg.topDealTypes = [...agg.dealTypeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t)
  }
  return byCompany
}
```

- [ ] **Step 4: Implement `activeAsOf`**

```js
export function activeAsOf(deals, threshold) {
  return deals.filter(d => d.date && d.date <= threshold)
}
```

- [ ] **Step 5: Implement `buildDirectedAdjacency`**

```js
export function buildDirectedAdjacency(deals) {
  const adj = new Map()
  for (const d of deals) {
    if (!d.source || !d.target || d.source === d.target) continue
    if (!adj.has(d.source)) adj.set(d.source, new Set())
    adj.get(d.source).add(d.target)
  }
  return adj
}
```

- [ ] **Step 6: Implement `allShortestPaths`**

```js
export function allShortestPaths(deals, origin, destination) {
  if (origin === destination) return []
  const adj = buildDirectedAdjacency(deals)
  // Layered BFS; track parents for path reconstruction.
  const distance = new Map([[origin, 0]])
  const parents = new Map([[origin, []]])
  const queue = [origin]
  let foundLayer = -1
  while (queue.length) {
    const next = []
    for (const node of queue) {
      if (foundLayer !== -1 && distance.get(node) >= foundLayer) continue
      const out = adj.get(node)
      if (!out) continue
      for (const target of out) {
        const newDist = distance.get(node) + 1
        if (!distance.has(target)) {
          distance.set(target, newDist)
          parents.set(target, [node])
          next.push(target)
          if (target === destination) foundLayer = newDist
        } else if (distance.get(target) === newDist) {
          parents.get(target).push(node)
        }
      }
    }
    queue.length = 0
    queue.push(...next)
  }
  if (!parents.has(destination)) return []
  // Reconstruct all shortest paths via DFS over parents.
  const paths = []
  function walk(node, acc) {
    if (node === origin) {
      paths.push([origin, ...acc])
      return
    }
    for (const p of parents.get(node)) {
      walk(p, [node, ...acc])
    }
  }
  walk(destination, [])
  return paths
}
```

- [ ] **Step 7: Run tests to verify all pass**

Run:
```bash
npm test -- tests/logic.test.js
```

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/ComputeDealMap/logic.js tests/logic.test.js
git commit -m "feat(logic): per-company aggregates, date filter, directed BFS all-shortest-paths"
```

---

## Phase 2 — Toolbar and search consolidation

### Task 3: Build `Toolbar.jsx` with search + three chip toggles

**Files:**
- Create: `src/components/ComputeDealMap/Toolbar.jsx`
- Modify: `src/components/ComputeDealMap/styles.module.css` (add toolbar styles)
- Create: `tests/Toolbar.test.jsx`

- [ ] **Step 1: Write failing test**

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Toolbar from '../src/components/ComputeDealMap/Toolbar.jsx'

describe('Toolbar', () => {
  it('renders search input and three chip toggles', () => {
    render(
      <Toolbar
        search=""
        onSearch={() => {}}
        toggles={{ trace: false, timeline: false, cluster: false }}
        onToggle={() => {}}
      />
    )
    expect(screen.getByPlaceholderText('Search companies, deals, categories')).toBeInTheDocument()
    expect(screen.getByText('Trace')).toBeInTheDocument()
    expect(screen.getByText('Timeline')).toBeInTheDocument()
    expect(screen.getByText('Cluster')).toBeInTheDocument()
  })

  it('fires onSearch as the user types', () => {
    const onSearch = vi.fn()
    render(
      <Toolbar
        search=""
        onSearch={onSearch}
        toggles={{ trace: false, timeline: false, cluster: false }}
        onToggle={() => {}}
      />
    )
    fireEvent.change(screen.getByPlaceholderText('Search companies, deals, categories'), {
      target: { value: 'NVDA' },
    })
    expect(onSearch).toHaveBeenCalledWith('NVDA')
  })

  it('fires onToggle when a chip is clicked', () => {
    const onToggle = vi.fn()
    render(
      <Toolbar
        search=""
        onSearch={() => {}}
        toggles={{ trace: false, timeline: false, cluster: false }}
        onToggle={onToggle}
      />
    )
    fireEvent.click(screen.getByText('Trace'))
    expect(onToggle).toHaveBeenCalledWith('trace')
  })
})
```

- [ ] **Step 2: Run test; expect failures**

```bash
npm test -- tests/Toolbar.test.jsx
```

Expected: module-not-found.

- [ ] **Step 3: Create `Toolbar.jsx`**

```jsx
import styles from './styles.module.css'

const CHIPS = [
  { key: 'trace', label: 'Trace' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'cluster', label: 'Cluster' },
]

export default function Toolbar({ search, onSearch, toggles, onToggle }) {
  return (
    <div className={styles.toolbar}>
      <input
        className={styles.toolbarSearch}
        type="text"
        placeholder="Search companies, deals, categories"
        value={search}
        onChange={e => onSearch(e.target.value)}
      />
      <div className={styles.toolbarChips}>
        {CHIPS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={toggles[key] ? styles.toolbarChipActive : styles.toolbarChip}
            onClick={() => onToggle(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add toolbar styles to `styles.module.css`**

```css
.toolbar {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 48px;
  padding: 0 0;
  margin-bottom: 24px;
}

.toolbarSearch {
  width: 240px;
  height: 32px;
  border: 1px solid var(--border);
  background: transparent;
  padding: 0 8px;
  font: inherit;
  font-size: 12px;
  color: var(--text);
  border-radius: 0;
  outline: none;
}
.toolbarSearch::placeholder { color: var(--text-faint); }
.toolbarSearch:focus { border-color: var(--text-muted); }

.toolbarChips {
  display: flex;
  gap: 12px;
}

.toolbarChip,
.toolbarChipActive {
  font: inherit;
  font-size: 12px;
  background: transparent;
  border: none;
  padding: 4px 12px;
  color: var(--text);
  cursor: pointer;
  transition: font-weight 100ms ease, opacity 100ms ease;
  opacity: 0.7;
  border-bottom: 1px solid transparent;
  margin-bottom: -2px; /* underline lives 2px below baseline */
}
.toolbarChip { font-weight: 400; }
.toolbarChipActive {
  font-weight: 500;
  opacity: 1;
  border-bottom-color: var(--text);
}
.toolbarChip:hover { opacity: 1; }

@media (max-width: 900px) {
  .toolbar { flex-direction: column; align-items: stretch; height: auto; gap: 8px; }
  .toolbarSearch { width: 100%; }
  .toolbarChips { justify-content: flex-start; }
}
```

- [ ] **Step 5: Run tests, expect all pass**

```bash
npm test -- tests/Toolbar.test.jsx
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ComputeDealMap/Toolbar.jsx src/components/ComputeDealMap/styles.module.css tests/Toolbar.test.jsx
git commit -m "feat(toolbar): search + trace/timeline/cluster chip toggles"
```

### Task 4: Wire `Toolbar` into `App.jsx`; remove search from `FilterBar`; update tagline

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/ComputeDealMap/FilterBar.jsx`
- Modify: `src/app.css` (if tagline changes require)

- [ ] **Step 1: Read `FilterBar.jsx` to identify the search field**

```bash
cat src/components/ComputeDealMap/FilterBar.jsx
```

- [ ] **Step 2: Remove the `Search...` input from `FilterBar.jsx`**

Locate the JSX for the search input (the one using `styles.filterSearchMinimal`) and the filter state reducer line that handles it. Delete the input and its onChange handler. Keep the `dealType` and `category` filter groups intact.

- [ ] **Step 3: Update `src/App.jsx` to mount `Toolbar` above the graph and manage toggle/search state**

Replace the relevant section of `src/App.jsx`:

```jsx
import { useMemo, useState, useEffect } from 'react'
import styles from './components/ComputeDealMap/styles.module.css'
import { DEALS } from './components/ComputeDealMap/data.js'
import { applyFilters } from './components/ComputeDealMap/logic.js'
import Toolbar from './components/ComputeDealMap/Toolbar.jsx'
import FilterBar from './components/ComputeDealMap/FilterBar.jsx'
import Graph from './components/ComputeDealMap/Graph.jsx'
import DealTable from './components/ComputeDealMap/DealTable.jsx'
import SourcesSection from './components/ComputeDealMap/SourcesSection.jsx'

const BUILD_DATE = new Date(__BUILD_DATE__ ?? Date.now())
  .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  .toLowerCase()

export default function App() {
  const [search, setSearch] = useState('')
  const [tableFilters, setTableFilters] = useState({ dealType: 'all', category: 'all' })
  const [toggles, setToggles] = useState({ trace: false, timeline: false, cluster: false })

  const graphDeals = useMemo(
    () => applyFilters(DEALS, { ...tableFilters, search }),
    [tableFilters, search]
  )

  const handleToggle = key => setToggles(t => ({ ...t, [key]: !t[key] }))

  return (
    <div className="computePage">
      <header className="computeHeader">
        <h1 className="computeTitle">ai ecosystem transactions</h1>
        <p className="computeTagline">
          a structured, source-backed dataset of publicly disclosed ai ecosystem transactions across sovereign AI, hyperscaler capex, custom silicon, and the hardware providers behind them. maintained by justin wang. last updated {BUILD_DATE}. source data public repository{' '}
          <a href="https://github.com/jstwng/compute-deal-map-data" target="_blank" rel="noreferrer">here</a>.
        </p>
      </header>

      <Toolbar
        search={search}
        onSearch={setSearch}
        toggles={toggles}
        onToggle={handleToggle}
      />

      <section className={styles.section}>
        <div className="graphBlock">
          <Graph
            deals={graphDeals}
            hoveredEdge={hoveredEdge}
            onHoverEdge={setHoveredEdge}
            hoveredNode={hoveredNode}
            onHoverNode={setHoveredNode}
            onScrollToRow={id => setScrollToDealId(id)}
            onRequestMaximize={() => setGraphMaximized(true)}
          />
        </div>
        <h3 className={styles.sectionSubheader}>Transactions</h3>
        <FilterBar filters={tableFilters} onChange={setTableFilters} />
        <DealTable
          deals={graphDeals}
          hoveredEdge={hoveredEdge}
          scrollToDealId={scrollToDealId}
          onHoverEdge={setHoveredEdge}
        />
        <SourcesSection />
      </section>

      <footer className="computeFooter">
        <span>
          &copy; {new Date().getFullYear()} Justin Wang &middot;{' '}
          <a href="https://jstwng.com" target="_blank" rel="noreferrer">jstwng.com</a>
        </span>
      </footer>
    </div>
  )
}
```

Preserve all existing Graph and DealTable props that weren't shown (hoveredEdge/Node, scrollToDealId, maximize behavior) — restore them in place of the `{/* existing props unchanged */}` comments when writing this out.

- [ ] **Step 4: Wire `__BUILD_DATE__` via Vite define**

In `vite.config.js`, add to the `defineConfig` object:
```js
define: {
  __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
},
```

- [ ] **Step 5: Run `npm run dev` on port 8002 and verify**

Run:
```bash
npm run dev
```

Open `http://localhost:8002`. Check:
- Tagline includes "last updated april 16, 2026" (or whatever today's date is) in lowercase.
- New toolbar visible above the graph with search + three chips.
- Typing in the search filters the graph and table as before.
- FilterBar below the graph no longer has a search input; category and deal type chips still work.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/components/ComputeDealMap/FilterBar.jsx vite.config.js
git commit -m "feat(toolbar): mount above graph; remove search from FilterBar; add last-updated to tagline"
```

---

## Phase 3 — Profile panel

### Task 5: Build `ProfilePanel.jsx` skeleton with container, close affordance, mode switching

**Files:**
- Create: `src/components/ComputeDealMap/ProfilePanel.jsx`
- Modify: `src/components/ComputeDealMap/styles.module.css`
- Create: `tests/ProfilePanel.test.jsx`

- [ ] **Step 1: Write failing test**

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProfilePanel from '../src/components/ComputeDealMap/ProfilePanel.jsx'

describe('ProfilePanel', () => {
  it('renders nothing when content is null', () => {
    const { container } = render(
      <ProfilePanel content={null} onClose={() => {}} onOpenCompany={() => {}} onScrollToRow={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders company mode header', () => {
    const content = {
      mode: 'company',
      company: { name: 'NVIDIA', ticker: 'NVDA' },
      aggregates: { totalDeals: 11, counterparties: new Set(['A', 'B']), earliest: '2019-01', latest: '2026-01', topDealTypes: ['gpu_purchase'] },
      deals: [],
    }
    render(<ProfilePanel content={content} onClose={() => {}} onOpenCompany={() => {}} onScrollToRow={() => {}} />)
    expect(screen.getByText('NVIDIA')).toBeInTheDocument()
    expect(screen.getByText('NVDA')).toBeInTheDocument()
  })

  it('calls onClose when Close is clicked', () => {
    const content = {
      mode: 'company',
      company: { name: 'NVIDIA', ticker: null },
      aggregates: { totalDeals: 0, counterparties: new Set(), earliest: null, latest: null, topDealTypes: [] },
      deals: [],
    }
    const onClose = vi.fn()
    render(<ProfilePanel content={content} onClose={onClose} onOpenCompany={() => {}} onScrollToRow={() => {}} />)
    fireEvent.click(screen.getByText('Close'))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests; expect failure**

```bash
npm test -- tests/ProfilePanel.test.jsx
```

- [ ] **Step 3: Create `ProfilePanel.jsx` skeleton**

```jsx
import { useEffect } from 'react'
import styles from './styles.module.css'
import { categoryLabel } from './companies.js'
import { DEAL_TYPES } from './data.js'

export default function ProfilePanel({ content, onClose, onOpenCompany, onScrollToRow, onFocusCompany, timelineRange }) {
  useEffect(() => {
    if (!content) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [content, onClose])

  if (!content) return null

  return (
    <aside className={styles.profilePanel} role="complementary">
      <div className={styles.profilePanelHeader}>
        <button type="button" className={styles.profilePanelClose} onClick={onClose}>
          Close
        </button>
      </div>
      <div className={styles.profilePanelBody}>
        {content.mode === 'company'
          ? <CompanyMode content={content} onScrollToRow={onScrollToRow} onFocusCompany={onFocusCompany} timelineRange={timelineRange} />
          : <DealMode content={content} onOpenCompany={onOpenCompany} onScrollToRow={onScrollToRow} timelineRange={timelineRange} />
        }
      </div>
    </aside>
  )
}

// CompanyMode and DealMode filled in in Tasks 6 and 7.
function CompanyMode() { return null }
function DealMode() { return null }
```

- [ ] **Step 4: Add container styles to `styles.module.css`**

```css
.profilePanel {
  position: absolute;
  top: 0;
  right: 0;
  width: clamp(280px, 35%, 440px);
  height: 100%;
  background: var(--bg);
  border-left: 1px solid var(--border);
  padding: 16px;
  overflow-y: auto;
  z-index: 30;
  font-size: 12px;
  color: var(--text);
  box-sizing: border-box;
}

.profilePanelHeader {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.profilePanelClose {
  font: inherit;
  font-size: 11px;
  background: transparent;
  border: none;
  padding: 4px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 150ms ease;
}
.profilePanelClose:hover { color: var(--text); }

.profilePanelBody {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 900px) {
  .profilePanel {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 85vh;
    border-left: none;
    border-top: 1px solid var(--border);
    z-index: 1000;
  }
}
```

- [ ] **Step 5: Run tests, expect all pass**

```bash
npm test -- tests/ProfilePanel.test.jsx
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ComputeDealMap/ProfilePanel.jsx src/components/ComputeDealMap/styles.module.css tests/ProfilePanel.test.jsx
git commit -m "feat(panel): ProfilePanel skeleton with close affordance + mobile sheet layout"
```

### Task 6: Implement company mode content

**Files:**
- Modify: `src/components/ComputeDealMap/ProfilePanel.jsx`
- Modify: `src/components/ComputeDealMap/styles.module.css`

- [ ] **Step 1: Replace the `CompanyMode` stub in `ProfilePanel.jsx`**

```jsx
function CompanyMode({ content, onScrollToRow, onFocusCompany, timelineRange }) {
  const { company, aggregates, deals, counterpartyFilter, onSetCounterpartyFilter } = content
  const counterpartiesSorted = useMemo(() => {
    const counts = new Map()
    for (const d of deals) {
      const other = d.source === company.name ? d.target : d.source
      counts.set(other, (counts.get(other) || 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [deals, company.name])

  const filteredDeals = counterpartyFilter
    ? deals.filter(d => (d.source === company.name ? d.target : d.source) === counterpartyFilter)
    : deals

  const yearRange = aggregates.earliest && aggregates.latest
    ? `${aggregates.earliest.slice(0, 4)}–${aggregates.latest.slice(0, 4)}`
    : ''

  return (
    <>
      <div>
        <div className={styles.profileIdentity}>
          <span className={styles.profileName}>{company.name}</span>
          {company.ticker && <span className={styles.profileTicker}>{company.ticker}</span>}
        </div>
        <div className={styles.profileMeta}>
          {aggregates.totalDeals} deals · {aggregates.counterparties.size} counterparties{yearRange ? ` · ${yearRange}` : ''}
        </div>
        {aggregates.topDealTypes.length > 0 && (
          <div className={styles.profileMeta}>
            {aggregates.topDealTypes.map(t => DEAL_TYPES[t]?.label?.toLowerCase() ?? t).join(', ')}
          </div>
        )}
        {onFocusCompany && (
          <button
            type="button"
            className={styles.profileFocusLink}
            onClick={() => onFocusCompany(company.name)}
          >
            Focus on this company
          </button>
        )}
      </div>

      <div>
        <div className={styles.profileSubhead}>Counterparties</div>
        <ul className={styles.profileList}>
          {counterpartiesSorted.map(([name, count]) => (
            <li
              key={name}
              className={counterpartyFilter === name ? styles.profileRowActive : styles.profileRow}
              onClick={() => onSetCounterpartyFilter(counterpartyFilter === name ? null : name)}
            >
              <span className={styles.profileRowName}>{name}</span>
              <span className={styles.profileRowCount}>{count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className={styles.profileSubhead}>
          {counterpartyFilter ? `Deals with ${counterpartyFilter} · ${filteredDeals.length}` : `Deals · ${filteredDeals.length}`}
          {counterpartyFilter && (
            <button
              type="button"
              className={styles.profileClearFilter}
              onClick={() => onSetCounterpartyFilter(null)}
            >
              Clear filter
            </button>
          )}
        </div>
        <ul className={styles.profileDealList}>
          {filteredDeals.map(d => {
            const otherParty = d.source === company.name ? d.target : d.source
            const outOfRange = timelineRange && (d.date > timelineRange)
            return (
              <li
                key={d.id}
                className={styles.profileDealRow}
                style={outOfRange ? { opacity: 0.3 } : undefined}
                onClick={() => onScrollToRow(d.id)}
              >
                <div className={styles.profileDealMeta}>
                  <span>{d.date_display || d.date}</span>
                  <span className={styles.profileDealCounterparty}>{otherParty}</span>
                  <span>{DEAL_TYPES[d.deal_type]?.label}</span>
                </div>
                {d.description && <div className={styles.profileDealDesc}>{d.description}</div>}
                <div className={styles.profileDealMeta}>
                  <span>{d.value_display || ''}</span>
                  {d.source_url && (
                    <a
                      className={styles.profileDealSource}
                      href={d.source_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      View source
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
```

Don't forget to add the `useMemo` import at the top if not already present.

- [ ] **Step 2: Add profile typography and row styles**

```css
.profileIdentity {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}
.profileName { font-weight: 600; }
.profileTicker { color: var(--text-muted); }

.profileMeta {
  color: var(--text-muted);
  margin-bottom: 4px;
}

.profileFocusLink {
  font: inherit;
  font-size: 12px;
  background: transparent;
  border: none;
  padding: 6px 0 0;
  color: var(--text);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: var(--link-underline);
  text-underline-offset: 2px;
}

.profileSubhead {
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.profileClearFilter {
  font: inherit;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-muted);
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: var(--link-underline);
  text-underline-offset: 2px;
}

.profileList, .profileDealList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profileRow, .profileRowActive {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  cursor: pointer;
  transition: background 100ms ease;
}
.profileRow:hover { background: var(--row-hover); }
.profileRowActive { background: var(--row-highlight); font-weight: 500; }
.profileRowName { font-weight: 600; }
.profileRowCount { color: var(--text-muted); }

.profileDealRow {
  padding: 6px 0;
  border-bottom: 1px solid var(--border-soft);
  cursor: pointer;
  transition: background 100ms ease;
}
.profileDealRow:hover { background: var(--row-hover); }

.profileDealMeta {
  display: flex;
  gap: 8px;
  color: var(--text-muted);
}
.profileDealCounterparty { color: var(--text); font-weight: 600; }
.profileDealDesc { margin: 4px 0; }
.profileDealSource { color: var(--text); text-decoration: underline; text-decoration-color: var(--link-underline); text-underline-offset: 2px; }
```

- [ ] **Step 3: Run existing tests; ensure ProfilePanel test still passes (company fields render)**

```bash
npm test -- tests/ProfilePanel.test.jsx
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ComputeDealMap/ProfilePanel.jsx src/components/ComputeDealMap/styles.module.css
git commit -m "feat(panel): company mode (identity, metadata, counterparties, deal ledger)"
```

### Task 7: Implement deal mode + swap-to-company-profile behavior

**Files:**
- Modify: `src/components/ComputeDealMap/ProfilePanel.jsx`

- [ ] **Step 1: Replace the `DealMode` stub with a real implementation**

```jsx
function DealMode({ content, onOpenCompany, onScrollToRow, timelineRange }) {
  const { edge, deals } = content
  const disclosed = deals.filter(d => d.value_billions != null)
  const totalValue = disclosed.reduce((s, d) => s + (d.value_billions || 0), 0)
  const aggregateLine = deals.length > 1
    ? `${deals.length} deals${disclosed.length ? ` · $${totalValue.toFixed(1)}B aggregate` : ''}`
    : null

  return (
    <>
      <div>
        <div className={styles.profileIdentity}>
          <span className={styles.profileName}>{edge.source} and {edge.target}</span>
        </div>
        <div className={styles.profileMeta}>
          {[...new Set(deals.map(d => DEAL_TYPES[d.deal_type]?.label).filter(Boolean))].join(', ')}
        </div>
        {aggregateLine && <div className={styles.profileMeta}>{aggregateLine}</div>}
      </div>

      <div>
        <div className={styles.profileSubhead}>Deals · {deals.length}</div>
        <ul className={styles.profileDealList}>
          {deals.map(d => {
            const outOfRange = timelineRange && (d.date > timelineRange)
            return (
              <li
                key={d.id}
                className={styles.profileDealRow}
                style={outOfRange ? { opacity: 0.3 } : undefined}
                onClick={() => onScrollToRow(d.id)}
              >
                <div className={styles.profileDealMeta}>
                  <span>{d.date_display || d.date}</span>
                  <span>{DEAL_TYPES[d.deal_type]?.label}</span>
                </div>
                {d.description && <div className={styles.profileDealDesc}>{d.description}</div>}
                <div className={styles.profileDealMeta}>
                  <span>{d.value_display || ''}</span>
                  {d.source_url && (
                    <a
                      className={styles.profileDealSource}
                      href={d.source_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      View source
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <div className={styles.profileSubhead}>Jump to company</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button
            type="button"
            className={styles.profileFocusLink}
            onClick={() => onOpenCompany(edge.source)}
          >
            {edge.source}
          </button>
          <button
            type="button"
            className={styles.profileFocusLink}
            onClick={() => onOpenCompany(edge.target)}
          >
            {edge.target}
          </button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Manually verify in dev server later when wired up in Task 8**

No test update needed yet; manual verification happens after Task 8.

- [ ] **Step 3: Commit**

```bash
git add src/components/ComputeDealMap/ProfilePanel.jsx
git commit -m "feat(panel): deal mode (identity, deals list, jump-to-company)"
```

### Task 8: Wire `ProfilePanel` triggers to `Graph.jsx` and `App.jsx`

**Files:**
- Modify: `src/components/ComputeDealMap/Graph.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Add `onClickNode` and `onClickEdge` props to `Graph.jsx`**

In `Graph.jsx`, find the existing node click handler:
```jsx
onClick={e => {
  e.stopPropagation()
  setFocusedNode(company.name === focusedNode ? null : company.name)
}}
```

Replace with:
```jsx
onClick={e => {
  e.stopPropagation()
  if (onClickNode) onClickNode(company.name)
}}
```

Add to the Graph function signature:
```jsx
export default function Graph({ deals, hoveredEdge, onHoverEdge, hoveredNode, onHoverNode, onScrollToRow, heightOverride, maximizable = true, onRequestMaximize, onRequestClose, isModal = false, onClickNode, onClickEdge, externalFocusedNode })
```

Find the edge click zone (hovered edge element rendering) and add a click handler that invokes `onClickEdge({ source: d.source, target: d.target })`. If there's currently only a hover handler, add a click handler parallel to it.

Remove the local `focusedNode` state from Graph and use `externalFocusedNode` prop instead (App now owns focus). If that's too invasive for this task, keep the local state and have `onClickNode` fire alongside it — but ensure that subsequent clicks on the same node don't toggle focus off when the panel is open.

- [ ] **Step 2: Add panel state to `App.jsx`**

```jsx
const [panelContent, setPanelContent] = useState(null)
const [counterpartyFilter, setCounterpartyFilter] = useState(null)

const companyAggregates = useMemo(() => perCompanyAggregates(graphDeals), [graphDeals])

const openCompany = useCallback(name => {
  const company = COMPANIES.find(c => c.name === name)
  if (!company) return
  const relevantDeals = graphDeals
    .filter(d => d.source === name || d.target === name)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  setCounterpartyFilter(null)
  setPanelContent({
    mode: 'company',
    company,
    aggregates: companyAggregates.get(name) || { totalDeals: 0, counterparties: new Set(), earliest: null, latest: null, topDealTypes: [] },
    deals: relevantDeals,
    counterpartyFilter: null,
    onSetCounterpartyFilter: setCounterpartyFilter,
  })
}, [graphDeals, companyAggregates])

const openDeal = useCallback(edge => {
  const deals = graphDeals.filter(d => d.source === edge.source && d.target === edge.target)
  setPanelContent({ mode: 'deal', edge, deals })
}, [graphDeals])

// keep panelContent's counterpartyFilter in sync when user clicks a counterparty row
useEffect(() => {
  if (panelContent?.mode === 'company') {
    setPanelContent(c => c ? { ...c, counterpartyFilter } : c)
  }
}, [counterpartyFilter])
```

Make sure `COMPANIES` and `perCompanyAggregates` are imported.

- [ ] **Step 3: Add the `Focus` handoff**

```jsx
const [focusedNode, setFocusedNode] = useState(null)

const handleFocusCompany = useCallback(name => {
  setFocusedNode(name)
  setPanelContent(null)
}, [])
```

Pass `externalFocusedNode={focusedNode}` to `Graph`.

- [ ] **Step 4: Render `ProfilePanel` as a sibling of the graph**

Inside the `graphBlock` `div`, add as a sibling element:
```jsx
<ProfilePanel
  content={panelContent}
  onClose={() => setPanelContent(null)}
  onOpenCompany={openCompany}
  onScrollToRow={id => setScrollToDealId(id)}
  onFocusCompany={handleFocusCompany}
  timelineRange={toggles.timeline ? timelineValue : null}
/>
```

Wire `onClickNode={openCompany}` and `onClickEdge={openDeal}` to `Graph`. (At this point `toggles.timeline` and `timelineValue` don't exist yet — they come in Phase 5. For now either pass `timelineRange={null}` or add a TODO to wire when Phase 5 completes. The engineer should handle this forward reference.)

- [ ] **Step 5: Start dev server and verify the flow manually**

Run:
```bash
npm run dev
```

Verify:
- Clicking a node opens the profile panel showing that company's aggregates, counterparties, deal ledger.
- Clicking a counterparty row in the panel filters the deal ledger below.
- Clicking an edge on the graph opens the panel in deal mode.
- Clicking a company-name link in deal mode switches the panel to that company's profile.
- Clicking `Focus on this company` closes the panel and enters focus mode.
- Pressing `Escape` closes the panel.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/components/ComputeDealMap/Graph.jsx
git commit -m "feat(panel): wire click-to-open panel for nodes and edges; focus handoff"
```

---

## Phase 4 — Trace

### Task 9: Create `TraceStrip.jsx` (status strip + path selector)

**Files:**
- Create: `src/components/ComputeDealMap/TraceStrip.jsx`
- Modify: `src/components/ComputeDealMap/styles.module.css`

- [ ] **Step 1: Create `TraceStrip.jsx`**

```jsx
import styles from './styles.module.css'

export default function TraceStrip({ state, onCancel, onClear, onSwap, onSelectPath }) {
  // state = { phase: 'origin' | 'destination' | 'paths' | 'no_path' | 'same_node', origin, destination, paths, selectedPathIndex }
  return (
    <div className={styles.traceStrip}>
      <div className={styles.traceStripRow}>
        <div className={styles.traceStripHint}>
          <TraceMessage state={state} />
        </div>
        <div className={styles.traceStripActions}>
          {(state.phase === 'destination' || state.phase === 'paths') && (
            <button type="button" className={styles.traceStripLink} onClick={onClear}>Clear</button>
          )}
          {state.phase === 'no_path' && onSwap && (
            <button type="button" className={styles.traceStripLink} onClick={onSwap}>Swap</button>
          )}
          <button type="button" className={styles.traceStripLink} onClick={onCancel}>Cancel</button>
        </div>
      </div>
      {state.phase === 'paths' && state.paths.length > 1 && (
        <div className={styles.traceStripRow}>
          <div className={styles.traceStripPaths}>
            <PathChip index={-1} label="All" active={state.selectedPathIndex === -1} onSelect={() => onSelectPath(-1)} />
            {state.paths.map((p, i) => (
              <PathChip
                key={i}
                index={i}
                label={`Path ${i + 1}: ${p.join(' to ')}`}
                active={state.selectedPathIndex === i}
                onSelect={() => onSelectPath(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TraceMessage({ state }) {
  if (state.phase === 'origin') return <span>Pick an origin company</span>
  if (state.phase === 'destination') return <span>Origin: <strong>{state.origin}</strong> · Pick a destination company</span>
  if (state.phase === 'same_node') return <span>Origin and destination are the same company · Pick a different destination</span>
  if (state.phase === 'no_path') return <span>No path from {state.origin} to {state.destination} (following supply flow). Try Swap</span>
  if (state.phase === 'no_path_both') return <span>No path either direction between {state.origin} and {state.destination} · Pick different companies</span>
  if (state.phase === 'paths') {
    const p = state.paths[0]
    const hops = p.length - 1
    return <span><strong>{p[0]} to {p[p.length - 1]}</strong> · {hops} hops · {state.paths.length} path{state.paths.length > 1 ? 's' : ''}</span>
  }
  return null
}

function PathChip({ label, active, onSelect }) {
  return (
    <button
      type="button"
      className={active ? styles.traceStripPathChipActive : styles.traceStripPathChip}
      onClick={onSelect}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 2: Add strip styles**

```css
.traceStrip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text);
  border-top: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
}
.traceStripRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  min-height: 28px;
}
.traceStripHint strong { font-weight: 600; }

.traceStripActions {
  display: flex;
  gap: 12px;
}
.traceStripLink {
  font: inherit;
  font-size: 12px;
  color: var(--text-muted);
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: var(--link-underline);
  text-underline-offset: 2px;
}
.traceStripLink:hover { color: var(--text); }

.traceStripPaths {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.traceStripPathChip, .traceStripPathChipActive {
  font: inherit;
  font-size: 12px;
  color: var(--text);
  background: transparent;
  border: none;
  padding: 2px 8px;
  cursor: pointer;
  opacity: 0.7;
}
.traceStripPathChip { font-weight: 400; }
.traceStripPathChipActive {
  font-weight: 500;
  opacity: 1;
  border-bottom: 1px solid var(--text);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ComputeDealMap/TraceStrip.jsx src/components/ComputeDealMap/styles.module.css
git commit -m "feat(trace): TraceStrip component (status strip + path selector)"
```

### Task 10: Implement Trace picking states in `App.jsx`, integrate with `Graph.jsx`

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/ComputeDealMap/Graph.jsx`

- [ ] **Step 1: Add Trace state to `App.jsx`**

```jsx
import { allShortestPaths } from './components/ComputeDealMap/logic.js'

const [traceState, setTraceState] = useState({ phase: 'idle' })

const enterTrace = () => setTraceState({ phase: 'origin' })
const cancelTrace = () => setTraceState({ phase: 'idle' })

const pickNodeForTrace = name => {
  setTraceState(s => {
    if (s.phase === 'origin') return { phase: 'destination', origin: name }
    if (s.phase === 'destination') {
      if (name === s.origin) return { phase: 'same_node', origin: s.origin }
      const paths = allShortestPaths(graphDeals, s.origin, name)
      if (paths.length === 0) return { phase: 'no_path', origin: s.origin, destination: name }
      return { phase: 'paths', origin: s.origin, destination: name, paths, selectedPathIndex: -1 }
    }
    return s
  })
}

const clearTrace = () => setTraceState({ phase: 'origin' })
const selectPath = i => setTraceState(s => s.phase === 'paths' ? { ...s, selectedPathIndex: i } : s)
const swapTrace = () => {
  setTraceState(s => {
    if (s.phase !== 'no_path') return s
    const paths = allShortestPaths(graphDeals, s.destination, s.origin)
    if (paths.length === 0) return { phase: 'no_path_both', origin: s.destination, destination: s.origin }
    return { phase: 'paths', origin: s.destination, destination: s.origin, paths, selectedPathIndex: -1 }
  })
}
```

- [ ] **Step 2: Sync toggles.trace with traceState**

Extend the toggle handler:

```jsx
const handleToggle = key => {
  if (key === 'trace') {
    if (toggles.trace) cancelTrace()
    else enterTrace()
  }
  setToggles(t => ({ ...t, [key]: !t[key] }))
}
```

- [ ] **Step 3: Route node clicks to trace or panel based on state**

Replace `onClickNode={openCompany}` with:

```jsx
onClickNode={name => {
  if (toggles.trace && ['origin', 'destination', 'same_node', 'no_path'].includes(traceState.phase)) {
    pickNodeForTrace(name)
  } else {
    openCompany(name)
  }
}}
```

- [ ] **Step 4: Mount `TraceStrip` between toolbar and graph when active**

```jsx
{toggles.trace && (
  <TraceStrip
    state={traceState}
    onCancel={() => { cancelTrace(); setToggles(t => ({ ...t, trace: false })) }}
    onClear={clearTrace}
    onSwap={swapTrace}
    onSelectPath={selectPath}
  />
)}
```

- [ ] **Step 5: Compute derived sets for graph opacity**

```jsx
const pathNodes = useMemo(() => {
  if (traceState.phase !== 'paths') return null
  const set = new Set()
  const selected = traceState.selectedPathIndex === -1 ? traceState.paths : [traceState.paths[traceState.selectedPathIndex]]
  for (const p of selected) for (const n of p) set.add(n)
  return set
}, [traceState])

const pathEdges = useMemo(() => {
  if (traceState.phase !== 'paths') return null
  const set = new Set()
  const selected = traceState.selectedPathIndex === -1 ? traceState.paths : [traceState.paths[traceState.selectedPathIndex]]
  for (const p of selected) {
    for (let i = 0; i < p.length - 1; i++) set.add(`${p[i]}__${p[i + 1]}`)
  }
  return set
}, [traceState])
```

- [ ] **Step 6: Extend `Graph.jsx` to accept and apply path opacity**

Add props `pathNodes`, `pathEdges`, `dimOffPath` (boolean). Modify the existing opacity calc:

```jsx
let opacity, sw
const edgeKey = `${d.source}__${d.target}`
const onPath = pathEdges && pathEdges.has(edgeKey)
const anyDim = pathNodes && pathNodes.size > 0  // we have an active path
if (anyDim) {
  opacity = onPath ? 1 : 0.2
  sw = 1
} else if (dimOffPath) {
  // picking phase — everything dims until an endpoint is picked
  opacity = 0.2
  sw = 1
} else if (hoveredNode) {
  // existing hover logic
} else if (hoverKey) {
  // existing hover logic
} else {
  opacity = 0.35
  sw = 1
}
```

Apply similar logic to node rendering (full opacity for `pathNodes.has(name)`, 20% otherwise when `anyDim`).

Pass `dimOffPath={toggles.trace && (traceState.phase === 'origin' || traceState.phase === 'destination')}`.

- [ ] **Step 7: Manually verify in dev server**

Toggle `Trace`, pick ASML, pick Microsoft (expect `No path` banner with `Swap`), click Swap, see path. Toggle between `All` and individual `Path N` chips. Cancel exits.

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx src/components/ComputeDealMap/Graph.jsx
git commit -m "feat(trace): origin/destination picking, path rendering, path selector, swap"
```

### Task 11: Filter transactions table to path deals with dismissible banner

**Files:**
- Modify: `src/components/ComputeDealMap/DealTable.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Add a banner prop to `DealTable.jsx`**

```jsx
export default function DealTable({ deals, hoveredEdge, scrollToDealId, onHoverEdge, banner }) {
  return (
    <div>
      {banner && <div className={styles.tableBanner}>{banner}</div>}
      {/* existing table JSX */}
    </div>
  )
}
```

Add styles:

```css
.tableBanner {
  padding: 6px 8px;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--text);
  background: var(--row-highlight);
  border-left: 2px solid var(--text);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
```

- [ ] **Step 2: Derive path-filtered deals in `App.jsx`**

```jsx
const pathDealIds = useMemo(() => {
  if (traceState.phase !== 'paths') return null
  const selected = traceState.selectedPathIndex === -1 ? traceState.paths : [traceState.paths[traceState.selectedPathIndex]]
  const edgeSet = new Set()
  for (const p of selected) {
    for (let i = 0; i < p.length - 1; i++) edgeSet.add(`${p[i]}__${p[i + 1]}`)
  }
  return new Set(
    graphDeals
      .filter(d => edgeSet.has(`${d.source}__${d.target}`))
      .map(d => d.id)
  )
}, [traceState, graphDeals])

const tableDeals = useMemo(
  () => pathDealIds ? graphDeals.filter(d => pathDealIds.has(d.id)) : graphDeals,
  [pathDealIds, graphDeals]
)
```

- [ ] **Step 3: Pass banner and filtered deals to `DealTable`**

```jsx
<DealTable
  deals={tableDeals}
  hoveredEdge={hoveredEdge}
  scrollToDealId={scrollToDealId}
  onHoverEdge={setHoveredEdge}
  banner={pathDealIds ? (
    <>
      <span>
        Showing {pathDealIds.size} deals along{' '}
        {traceState.selectedPathIndex === -1 ? 'all paths' : `Path ${traceState.selectedPathIndex + 1}`}{' '}
        from {traceState.origin} to {traceState.destination}
      </span>
      <button
        type="button"
        className={styles.traceStripLink}
        onClick={clearTrace}
      >
        Clear
      </button>
    </>
  ) : null}
/>
```

- [ ] **Step 4: Manually verify**

Toggle Trace, pick endpoints with a valid path, check that the table filters correctly and shows the banner. Click Clear in the banner — table restores, strip returns to `origin` phase.

- [ ] **Step 5: Commit**

```bash
git add src/components/ComputeDealMap/DealTable.jsx src/App.jsx src/components/ComputeDealMap/styles.module.css
git commit -m "feat(trace): filter transactions table to path deals + dismissible banner"
```

---

## Phase 5 — Timeline

### Task 12: Create `TimelineDock.jsx`

**Files:**
- Create: `src/components/ComputeDealMap/TimelineDock.jsx`
- Modify: `src/components/ComputeDealMap/styles.module.css`

- [ ] **Step 1: Create the dock component**

```jsx
import { useEffect, useRef } from 'react'
import styles from './styles.module.css'
import { EARLIEST_DATE, LATEST_DATE } from './data.js'

// Encode YYYY-MM as months since year 0 for monotonic scrubbing.
function dateToMonths(d) {
  const [y, m] = d.split('-').map(Number)
  return y * 12 + (m - 1)
}
function monthsToDate(m) {
  const year = Math.floor(m / 12)
  const month = (m % 12) + 1
  return `${year}-${String(month).padStart(2, '0')}`
}
function formatMonth(yyyymm) {
  const [y, m] = yyyymm.split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[m - 1]} ${y}`
}

export default function TimelineDock({ value, onChange, playing, onPlayToggle }) {
  const min = dateToMonths(EARLIEST_DATE)
  const max = dateToMonths(LATEST_DATE)
  const current = dateToMonths(value || LATEST_DATE)

  const rafRef = useRef(null)
  const lastTickRef = useRef(0)

  useEffect(() => {
    if (!playing) return
    const tick = now => {
      if (!lastTickRef.current) lastTickRef.current = now
      const elapsed = now - lastTickRef.current
      // 3 years per second = 36 months per second
      const monthsPerSecond = 36
      const advance = (elapsed / 1000) * monthsPerSecond
      if (advance >= 1) {
        const next = Math.min(current + Math.floor(advance), max)
        onChange(monthsToDate(next))
        lastTickRef.current = now
        if (next >= max) {
          onPlayToggle()
          return
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTickRef.current = 0
    }
  }, [playing, current, max, onChange, onPlayToggle])

  return (
    <div className={styles.timelineDock}>
      <button type="button" className={styles.timelineDockPlay} onClick={onPlayToggle}>
        {playing ? 'Pause' : 'Play'}
      </button>
      <input
        className={styles.timelineDockSlider}
        type="range"
        min={min}
        max={max}
        value={current}
        onChange={e => onChange(monthsToDate(Number(e.target.value)))}
        onMouseDown={() => { if (playing) onPlayToggle() }}
      />
      <span className={styles.timelineDockReadout}>{formatMonth(value || LATEST_DATE)}</span>
    </div>
  )
}
```

- [ ] **Step 2: Add dock styles**

```css
.timelineDock {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 24px;
  padding: 0 12px;
  background: var(--bg);
}

.timelineDockPlay {
  font: inherit;
  font-size: 11px;
  color: var(--text-muted);
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  transition: color 150ms ease;
  min-width: 44px;
  text-align: left;
}
.timelineDockPlay:hover { color: var(--text); }

.timelineDockSlider {
  flex: 1;
  appearance: none;
  height: 2px;
  background: var(--border);
  outline: none;
  padding: 0;
}
.timelineDockSlider::-webkit-slider-thumb {
  appearance: none;
  width: 10px;
  height: 10px;
  background: var(--text);
  border: 1px solid var(--bg);
  cursor: pointer;
  border-radius: 0;
}
.timelineDockSlider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  background: var(--text);
  border: 1px solid var(--bg);
  cursor: pointer;
  border-radius: 0;
}

.timelineDockReadout {
  font-size: 12px;
  color: var(--text);
  min-width: 72px;
  text-align: right;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ComputeDealMap/TimelineDock.jsx src/components/ComputeDealMap/styles.module.css
git commit -m "feat(timeline): TimelineDock component (play/pause + slider + readout)"
```

### Task 13: Wire Timeline to graph opacity and table filter

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/ComputeDealMap/Graph.jsx`

- [ ] **Step 1: Add timeline state to `App.jsx`**

```jsx
import { LATEST_DATE } from './components/ComputeDealMap/data.js'
import { activeAsOf } from './components/ComputeDealMap/logic.js'
import TimelineDock from './components/ComputeDealMap/TimelineDock.jsx'

const [timelineValue, setTimelineValue] = useState(LATEST_DATE)
const [timelinePlaying, setTimelinePlaying] = useState(false)

// Local date formatter for banner copy; TimelineDock exports the same helper
// but for decoupling we redefine here.
function formatMonth(yyyymm) {
  const [y, m] = yyyymm.split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[m - 1]} ${y}`
}
```

- [ ] **Step 2: Derive timeline-filtered deals**

```jsx
const timelineDeals = useMemo(
  () => toggles.timeline ? activeAsOf(graphDeals, timelineValue) : graphDeals,
  [toggles.timeline, graphDeals, timelineValue]
)
```

- [ ] **Step 3: Apply timeline filter to Trace BFS (only active deals participate)**

Modify `pickNodeForTrace` and `swapTrace` to use `timelineDeals` instead of `graphDeals` when toggles.timeline is true.

- [ ] **Step 4: Pass active node/edge set to `Graph.jsx`**

```jsx
const activeNodeSet = useMemo(() => {
  if (!toggles.timeline) return null
  const set = new Set()
  for (const d of timelineDeals) { set.add(d.source); set.add(d.target) }
  return set
}, [toggles.timeline, timelineDeals])

const activeEdgeSet = useMemo(() => {
  if (!toggles.timeline) return null
  const set = new Set()
  for (const d of timelineDeals) set.add(`${d.source}__${d.target}`)
  return set
}, [toggles.timeline, timelineDeals])
```

Pass these to `Graph`. In `Graph.jsx`, extend the opacity calc:

```jsx
if (activeEdgeSet && !activeEdgeSet.has(edgeKey)) {
  opacity = 0  // Timeline-inactive edges: fully hidden
  sw = 1
} else if (/* existing path/hover logic */) { ... }
```

For nodes: if `activeNodeSet && !activeNodeSet.has(name)`, render at 20% opacity.

- [ ] **Step 5: Render `TimelineDock` inside the graph block when active**

```jsx
{toggles.timeline && (
  <TimelineDock
    value={timelineValue}
    onChange={setTimelineValue}
    playing={timelinePlaying}
    onPlayToggle={() => setTimelinePlaying(p => !p)}
  />
)}
```

Absolute-position it at the bottom of the graph block (add `bottom: 0; left: 0; right: 0; position: absolute;` to the dock or wrap in a positioned container).

- [ ] **Step 6: Filter the transactions table when timeline is active (compose with path filter)**

```jsx
const tableDeals = useMemo(() => {
  let base = toggles.timeline ? activeAsOf(graphDeals, timelineValue) : graphDeals
  if (pathDealIds) base = base.filter(d => pathDealIds.has(d.id))
  return base
}, [toggles.timeline, graphDeals, timelineValue, pathDealIds])
```

Add a banner when timeline is active:

```jsx
banner={pathDealIds ? /* ... existing path banner ... */ : (toggles.timeline ? (
  <>
    <span>Showing {tableDeals.length} deals as of {formatMonth(timelineValue)}</span>
    <button type="button" className={styles.traceStripLink} onClick={() => setToggles(t => ({ ...t, timeline: false }))}>
      Clear
    </button>
  </>
) : null)}
```

- [ ] **Step 7: Manually verify**

Toggle `Timeline`, drag back to 2020 — most nodes fade to 20%, AI-era edges hidden. Click Play — ecosystem fills in. Compose with Trace — Timeline filters path edges.

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx src/components/ComputeDealMap/Graph.jsx src/components/ComputeDealMap/styles.module.css
git commit -m "feat(timeline): scrub and play opacity-filter nodes/edges; compose with trace + table"
```

---

## Phase 6 — Cluster

### Task 14: Add cluster centroid computation and force integration

**Files:**
- Modify: `src/components/ComputeDealMap/logic.js`
- Modify: `src/components/ComputeDealMap/Graph.jsx`

- [ ] **Step 1: Add `clusterCentroids` to `logic.js` with a unit test**

Append to `tests/logic.test.js`:

```js
import { clusterCentroids } from '../src/components/ComputeDealMap/logic.js'

describe('clusterCentroids', () => {
  it('maps every category to an x,y inside the viewport', () => {
    const cs = clusterCentroids(1000, 500)
    expect(cs.has('chip_designer')).toBe(true)
    for (const { x, y } of cs.values()) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(1000)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(500)
    }
  })
})
```

Then in `logic.js`:

```js
// Value-chain left-to-right. Coordinates normalized 0..1 for category columns.
const CATEGORY_LAYOUT = [
  { slug: 'equipment', col: 0.08, row: 0.5 },
  { slug: 'memory', col: 0.08, row: 0.8 },
  { slug: 'packaging', col: 0.08, row: 0.2 },
  { slug: 'networking', col: 0.22, row: 0.35 },
  { slug: 'power', col: 0.22, row: 0.65 },
  { slug: 'chip_designer', col: 0.42, row: 0.5 },
  { slug: 'data_center', col: 0.62, row: 0.25 },
  { slug: 'neocloud', col: 0.62, row: 0.5 },
  { slug: 'server_oem', col: 0.62, row: 0.75 },
  { slug: 'hyperscaler', col: 0.82, row: 0.5 },
  { slug: 'ai_lab', col: 0.82, row: 0.8 },
  { slug: 'investor', col: 0.92, row: 0.15 },
]

export function clusterCentroids(width, height) {
  const out = new Map()
  for (const { slug, col, row } of CATEGORY_LAYOUT) {
    out.set(slug, { x: col * width, y: row * height })
  }
  return out
}
```

Run tests to confirm green.

- [ ] **Step 2: Add cluster layout option to `Graph.jsx`'s simulation**

In `computeGraphLayout`, accept a `clusterMode` boolean. When true:

```js
import { clusterCentroids } from './logic.js'
import { COMPANIES } from './companies.js'

const centroids = clusterCentroids(width, height)
const companyCategory = new Map(COMPANIES.map(c => [c.name, c.category]))

if (clusterMode) {
  sim
    .force('x', forceX(d => centroids.get(companyCategory.get(d.id))?.x ?? width / 2).strength(0.25))
    .force('y', forceY(d => centroids.get(companyCategory.get(d.id))?.y ?? height / 2).strength(0.25))
    .force('charge', forceManyBody().strength(-400))
} else {
  // existing forces
}
```

Pass `clusterMode={toggles.cluster}` from App through to `Graph`.

- [ ] **Step 3: Run dev server and verify cluster layout visually**

Toggle `Cluster` on — nodes should redistribute along the left-to-right value chain. Toggle off — they return to free layout.

- [ ] **Step 4: Commit**

```bash
git add src/components/ComputeDealMap/logic.js src/components/ComputeDealMap/Graph.jsx tests/logic.test.js
git commit -m "feat(cluster): value-chain centroids + force-based grouping toggle"
```

### Task 15: Render cluster labels and motion-safety gate

**Files:**
- Modify: `src/components/ComputeDealMap/Graph.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Render category labels near centroids when cluster is active**

In `Graph.jsx`, inside the SVG (after the edges, before the nodes):

```jsx
{clusterMode && [...clusterCentroids(dims.w, dims.h).entries()].map(([slug, { x, y }]) => {
  const label = CATEGORIES[slug]?.label || slug
  // Hide label if no visible node has this category
  const hasNodes = [...positions.values()].some(p => p.company.category === slug)
  if (!hasNodes) return null
  return (
    <text
      key={slug}
      x={x}
      y={y - 40}
      textAnchor="middle"
      className={styles.clusterLabel}
      style={{ opacity: clusterMode ? 1 : 0, transition: 'opacity 400ms ease' }}
    >
      {label}
    </text>
  )
})}
```

Import `CATEGORIES` from `companies.js` and `clusterCentroids` from `logic.js`. Add style:

```css
.clusterLabel {
  font-size: 12px;
  font-weight: 500;
  fill: var(--text-muted);
  pointer-events: none;
}
```

- [ ] **Step 2: Motion-safety — pause timeline during cluster transition**

In `App.jsx`, extend the toggle handler:

```jsx
const handleToggle = key => {
  if (key === 'trace') {
    if (toggles.trace) cancelTrace()
    else enterTrace()
  }
  if (key === 'cluster' && timelinePlaying) {
    setTimelinePlaying(false)
    // Resume after 400ms (the cluster transition duration)
    setTimeout(() => setTimelinePlaying(true), 420)
  }
  setToggles(t => ({ ...t, [key]: !t[key] }))
}
```

- [ ] **Step 3: Manually verify the cluster + timeline composition**

Turn on Timeline, Play, then toggle Cluster while playing — Timeline should pause, cluster animates ~400ms, then Timeline resumes.

- [ ] **Step 4: Commit**

```bash
git add src/components/ComputeDealMap/Graph.jsx src/components/ComputeDealMap/styles.module.css src/App.jsx
git commit -m "feat(cluster): category labels + motion-safety gate with timeline playback"
```

---

## Phase 7 — Polish and QA

### Task 16: Responsive checks and mobile bottom sheet

**Files:**
- Modify: `src/components/ComputeDealMap/styles.module.css` (responsive rules already added in earlier tasks; verify)

- [ ] **Step 1: Open the dev server and resize the browser**

Check breakpoints at 1200px, 900px, 600px. Verify:
- Toolbar wraps to stacked layout below 900px.
- Profile panel becomes a fixed bottom sheet below 900px.
- Graph block stays readable.
- Timeline dock fits on narrow screens.
- Trace strip wraps cleanly with path chips below the status line.

- [ ] **Step 2: Fix any visual issues you find (no tests required here — visual verification only)**

Common fixes:
- Add `flex-wrap: wrap` to rows that overflow.
- Clamp slider widths on narrow screens.
- Add swipe-down dismiss on the bottom sheet (optional).

- [ ] **Step 3: Commit**

```bash
git add src/components/ComputeDealMap/styles.module.css
git commit -m "style: responsive polish for toolbar, panel, trace strip, timeline dock"
```

### Task 17: Dark mode verification

**Files:** none (verification only)

- [ ] **Step 1: Toggle macOS or browser prefers-color-scheme to dark and reload the dev server**

Verify:
- Toolbar chips, search input, panel, trace strip, timeline dock all render with dark tokens (no hard-coded light colors).
- Cluster labels use `var(--text-muted)` and are legible on the dark `--bg`.
- Edge + node opacity still readable.

- [ ] **Step 2: Fix any token misuse**

Search for hard-coded colors in your newly added CSS rules (e.g., `#FFF`, `rgb(...)`) and replace with `var(--...)` where appropriate.

- [ ] **Step 3: Commit**

```bash
git add -p src/components/ComputeDealMap/styles.module.css
git commit -m "fix: ensure all new UI uses CSS vars for dark mode compatibility"
```

(Use `-p` only if there are actual changes; otherwise skip.)

### Task 18: Run through the video shot list manually

**Files:** none (QA only; bug fixes committed per issue)

- [ ] **Step 1: Open a fresh session on dev server (`npm run dev`, open localhost:8002)**

- [ ] **Step 2: Walk through each shot from Section 7 of the spec**

1. Default view settles cleanly — no layout jumps.
2. Hover NVIDIA — hover popover appears.
3. Click NVIDIA — panel slides in, all fields populated correctly.
4. Close panel.
5. Click Trace. Pick ASML as origin. Pick Microsoft as destination. Path(s) highlight. Table filters with banner.
6. Cancel Trace.
7. Click Timeline. Drag slider to 2018. Nodes fade, AI-era edges hidden.
8. Click Play. Ecosystem fills in over ~8s.
9. Near 2026, click Cluster. Layout animates to value-chain grouping. Labels appear.
10. Hold on the frame. Screenshot-ready.

- [ ] **Step 3: File and fix any bugs encountered**

For each bug:
- Reproduce reliably.
- Fix in the relevant file.
- Add a minimal test if the bug was in pure logic.
- Commit: `fix(<area>): <what was wrong>`.

- [ ] **Step 4: Update `projects.md` Activity Log (outside this repo)**

Append to the Compute Deal Map Site Activity Log:
```
- 2026-04-16 HH:MM | cli | Harrison | Implementation plan executed; all four flows working per spec; ready for video recording | docs/superpowers/plans/2026-04-16-deal-map-interactive-flows-plan.md
```

The `projects.md` file lives in `~/Downloads/claude-cowork/about-me/projects.md` (symlinked from `~/.claude/memory/projects.md`). Update via direct file edit — not part of this repo's git history.

---

## Done

All four flows shipped, tested, and verified against the spec's video shot list. The tool is ready for Justin to record, cut, and post.

## Self-review summary

- Every spec section maps to at least one task: Section 1 → Tasks 3-4; Section 2 → Tasks 5-8; Section 3 → Tasks 9-11; Section 4 → Tasks 12-13; Section 5 → Tasks 14-15; Section 6 → Tasks 1-2; Section 7 → Task 18.
- No placeholders. Every step has concrete code, a command, or a specific verification target.
- Type consistency: `traceState.phase` values (`origin`/`destination`/`paths`/`no_path`/`same_node`/`idle`) match across `TraceStrip.jsx` message dispatch and `App.jsx` state transitions. `pathDealIds` (Set), `pathNodes` (Set), `pathEdges` (Set of `source__target`) are used consistently. `activeAsOf` signature `(deals, threshold)` matches between test and call sites.
- Scope: fits one plan. Tasks are sized 10-45 minutes each; total implementation ≈ 2-3 days of focused work.
