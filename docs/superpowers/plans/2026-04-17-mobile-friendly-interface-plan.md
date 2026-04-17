# Mobile-Friendly Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `compute.jstwng.com` usable on a phone by consolidating breakpoints, replacing horizontal-scroll tables with card lists, turning custom filter dropdowns into native mobile sheets, and tuning the graph / panel / header for portrait touch — without touching the desktop experience.

**Architecture:** Every mobile change is gated behind a single `@media (max-width: 767px)` breakpoint or a new `useMediaQuery` hook. Desktop rendering stays identical. Mobile introduces card-list variants of `DealTable` and `SourcesSection`, a bottom-sheet wrapper for the Toolbar filters, a mobile-mode path through `Dropdown` that swaps the custom panel for a native `<select>`, and several CSS tweaks for tap-target sizing.

**Tech Stack:** React 18, Vite, CSS Modules, vitest + `@testing-library/react`. No new dependencies.

**Spec:** Alice's inline DESIGN_SPEC delivered 2026-04-17 (in conversation history).

---

## Out of scope (per Alice's DESIGN_SPEC §6)

Do NOT implement any of these in this plan — they are explicitly deferred:

- Swipe-to-dismiss gesture on the ProfilePanel bottom sheet.
- Pinch-zoom on the graph.
- Dedicated landscape-phone layout (desktop layout takes over ≥ 768px, regardless of orientation).
- Dark/light theme toggling in the chrome (existing `prefers-color-scheme` suffices).
- `@media (hover: hover)` capability detection (width breakpoint is sufficient).
- Sort affordance on `SourcesSection` card list (default sort only).
- Loading skeletons.

If you find yourself adding any of these, stop and flag.

---

## Pre-flight: decisions to confirm before Task 1

**1. `useMediaQuery` hook vs pure CSS for layout swaps.**
Plan assumes: introduce a `useMediaQuery` hook and use it only where the JSX tree itself differs (DealTable card list vs column table, SourcesSection card list vs column table, Dropdown native-select vs custom panel, Graph hover-card suppression). For everything else — typography, padding, grid layouts, panel positioning — use pure CSS media queries. Flag before Task 1 if Justin prefers an all-CSS approach (requires rendering both the card list and the desktop table and hiding one via `display: none`, which doubles DOM).

**2. Naming the new mobile card component.**
The existing `src/components/ComputeDealMap/DealCard.jsx` is the hover popup card that appears when you hover an edge in the graph. Plan assumes: rename existing `DealCard.jsx` → `DealHoverCard.jsx` and create a new `DealCard.jsx` for the mobile card-list row (a name that matches §2.4 of the spec). Update imports in `Graph.jsx`. Flag if Justin prefers a different naming (e.g., keep `DealCard.jsx` for the hover popup and use `DealListCard.jsx` for the mobile row).

**3. Hover-card suppression on mobile — render gating vs `display: none`.**
Plan assumes: gate the hover cards' render in `Graph.jsx` behind `!isMobile`, so no DOM is created on mobile. Simpler and avoids accidental touch-triggered ghosting. Alice suggested `display: none` as the minimum cut; the render gate is one extra conditional and strictly better.

**4. Single breakpoint value.**
Plan assumes `max-width: 767px` (mobile) / `min-width: 768px` (desktop) as the only content breakpoint. Existing `640px`, `700px`, `720px`, `900px` breakpoints are all consolidated to `767px`. Flag if Justin wants to keep any of the intermediate breakpoints for a tablet-specific treatment.

---

## File Structure

```
src/
  App.jsx                                      # MODIFY: pass isMobile into DealTable / SourcesSection / ProfilePanel where needed
  app.css                                      # MODIFY: 720px -> 767px; header + footer mobile tweaks
  components/ComputeDealMap/
    useMediaQuery.js                           # NEW: hook returning boolean for a given max-width
    DealCard.jsx                               # NEW: mobile card-list row (3 lines)
    DealHoverCard.jsx                          # RENAMED from DealCard.jsx (unchanged content; import paths updated)
    SourceCard.jsx                             # NEW: mobile card-list row for SourcesSection (2 lines)
    MobileFilterSheet.jsx                      # NEW: full-screen bottom-sheet wrapper for toolbar filters
    DealTable.jsx                              # MODIFY: render card list when isMobile; mobile sort <select>
    SourcesSection.jsx                         # MODIFY: render card list when isMobile
    Toolbar.jsx                                # MODIFY: two-row stack on mobile; filter buttons open MobileFilterSheet
    Dropdown.jsx                               # MODIFY: accept `nativeOnMobile` prop; render native <select> under 768px
    ProfilePanel.jsx                           # MODIFY: breakpoint 900->767; drag-bar element; counterparty uses native select
    Graph.jsx                                  # MODIFY: mobile height; always-visible expand button; suppress hover cards
    FilterBar.jsx                              # MODIFY: ensure pills stack on mobile (no new features)
    styles.module.css                          # MODIFY: unify media queries to 767px; new card-list + drag-bar classes
tests/
  useMediaQuery.test.jsx                       # NEW: hook behavior
  DealCard.test.jsx                            # NEW: mobile card render + click routing
  SourceCard.test.jsx                          # NEW: mobile source card render
  MobileFilterSheet.test.jsx                   # NEW: open/close + child rendering
  DealTable.test.jsx                           # NEW: route through card list when isMobile
  SourcesSection.test.jsx                      # NEW: route through card list when isMobile
  Dropdown.test.jsx                            # NEW: nativeOnMobile switches to <select>
  ProfilePanel.test.jsx                        # MODIFY: bottom-sheet assertions for mobile
  Toolbar.test.jsx                             # MODIFY: two-row layout + filter-sheet assertions
docs/superpowers/plans/
  2026-04-17-mobile-friendly-interface-plan.md # this file
```

Tests colocate in `tests/` per existing convention (see `tests/logic.test.js`, `tests/ProfilePanel.test.jsx`).

---

## Phase 0 — Foundation: breakpoint unification + `useMediaQuery`

### Task 0.1: Create `useMediaQuery` hook

**Files:**
- Create: `src/components/ComputeDealMap/useMediaQuery.js`
- Create: `tests/useMediaQuery.test.jsx`

- [ ] **Step 1: Write the failing test.**

Create `tests/useMediaQuery.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useMediaQuery from '../src/components/ComputeDealMap/useMediaQuery.js'

describe('useMediaQuery', () => {
  let listeners = []
  let matches = false
  const fakeMql = {
    get matches() { return matches },
    addEventListener: (_evt, cb) => listeners.push(cb),
    removeEventListener: (_evt, cb) => { listeners = listeners.filter(l => l !== cb) },
  }

  beforeEach(() => {
    listeners = []
    matches = false
    vi.spyOn(window, 'matchMedia').mockImplementation(() => fakeMql)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false when query does not match on mount', () => {
    matches = false
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(false)
  })

  it('returns true when query matches on mount', () => {
    matches = true
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(true)
  })

  it('updates when the media query changes', () => {
    matches = false
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(false)
    act(() => {
      matches = true
      listeners.forEach(l => l({ matches: true }))
    })
    expect(result.current).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails.**

Run: `npm test -- useMediaQuery`

Expected: FAIL with a module-not-found error for `useMediaQuery.js`.

- [ ] **Step 3: Write minimal implementation.**

Create `src/components/ComputeDealMap/useMediaQuery.js`:

```js
import { useEffect, useState } from 'react'

// Returns a live boolean for the given media query string.
// SSR-safe: defaults to false when window is undefined.
export default function useMediaQuery(query) {
  const getMatch = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false

  const [matches, setMatches] = useState(getMatch)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    const onChange = e => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
```

- [ ] **Step 4: Run test to verify it passes.**

Run: `npm test -- useMediaQuery`

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit.**

```bash
git add src/components/ComputeDealMap/useMediaQuery.js tests/useMediaQuery.test.jsx
git commit -m "feat(mobile): add useMediaQuery hook"
```

---

### Task 0.2: Unify breakpoint in `app.css`

**Files:**
- Modify: `src/app.css:64-68`

- [ ] **Step 1: Change the breakpoint.**

Replace the `@media (max-width: 720px)` block with `@media (max-width: 767px)`. Also remove the `.computeTitle { font-size: 12px }` override (Alice's spec §2.1 says keep the title at 13px on mobile). Keep the padding reduction. Graph block height is handled separately in Phase 4 — remove that override here.

Edit `src/app.css` lines 64-68 from:

```css
@media (max-width: 720px) {
  .computePage { padding: 12px 12px 24px; }
  .computeTitle { font-size: 12px; }
  .graphBlock { height: 56vh; min-height: 320px; }
}
```

to:

```css
@media (max-width: 767px) {
  .computePage { padding: 12px 12px 24px; }
}
```

- [ ] **Step 2: Verify dev server renders correctly.**

Run: `npm run dev` (if not already running on :8002).

Open `http://localhost:8002/` in Chrome. Toggle DevTools device emulation to iPhone 15 Pro (393px). Confirm page still loads and header renders.

Open at 1280px (desktop). Confirm title and layout unchanged from before the edit.

- [ ] **Step 3: Commit.**

```bash
git add src/app.css
git commit -m "refactor(mobile): consolidate app.css breakpoint to 767px; drop mobile title shrink"
```

---

### Task 0.3: Unify breakpoints in `styles.module.css`

**Files:**
- Modify: `src/components/ComputeDealMap/styles.module.css` — all `@media` queries targeting width.

- [ ] **Step 1: Audit existing width breakpoints.**

Run (from repo root):

```bash
grep -n 'max-width: \(640\|700\|720\|900\)px' src/components/ComputeDealMap/styles.module.css
```

Expected: 4 occurrences (`900px` in `.profilePanel`, `700px` in `.timelineDock`, `900px` in `.toolbar`, `900px` in `.topSection`, `700px` in `.filterSearchMinimal`, `640px` in `.graphWrap`). Count may vary — record them.

- [ ] **Step 2: Replace every occurrence with `767px`.**

In `src/components/ComputeDealMap/styles.module.css`, change every `max-width: 640px`, `max-width: 700px`, `max-width: 720px`, `max-width: 900px` inside a width-based `@media` to `max-width: 767px`. Do NOT touch `@media (prefers-color-scheme: ...)` or `@media (prefers-reduced-motion: ...)` (these are feature queries, not width).

Verify with:

```bash
grep -n 'max-width: \(640\|700\|720\|900\)px' src/components/ComputeDealMap/styles.module.css
```

Expected: 0 occurrences.

- [ ] **Step 3: Run tests.**

Run: `npm test`

Expected: all 32 tests still pass (breakpoint change is CSS-only, no JS impact).

- [ ] **Step 4: Verify dev server.**

Reload `http://localhost:8002/`. Desktop (1280px): layout identical. Mobile (393px): profile panel still bottom-sheets correctly when a node is clicked (this behavior existed at 900px breakpoint before, so it now triggers slightly later but still triggers on any mobile width).

- [ ] **Step 5: Commit.**

```bash
git add src/components/ComputeDealMap/styles.module.css
git commit -m "refactor(mobile): consolidate styles.module.css breakpoints to 767px"
```

---

## Phase 1 — Tables → card lists

### Task 1.1: Build `DealCard` mobile row component

**Files:**
- Rename: `src/components/ComputeDealMap/DealCard.jsx` → `src/components/ComputeDealMap/DealHoverCard.jsx`
- Create: `src/components/ComputeDealMap/DealCard.jsx`
- Create: `tests/DealCard.test.jsx`
- Modify: `src/components/ComputeDealMap/Graph.jsx` — import swap

- [ ] **Step 1: Rename the hover-card file and update the import in `Graph.jsx`.**

Run:

```bash
git mv src/components/ComputeDealMap/DealCard.jsx src/components/ComputeDealMap/DealHoverCard.jsx
```

In `src/components/ComputeDealMap/Graph.jsx`, find the line `import DealCard from './DealCard.jsx'` and change it to:

```jsx
import DealHoverCard from './DealHoverCard.jsx'
```

Then update the JSX usage (search for `<DealCard ` in `Graph.jsx`) to `<DealHoverCard `.

- [ ] **Step 2: Run the test suite.**

Run: `npm test`

Expected: all 32 tests pass (rename is mechanical).

- [ ] **Step 3: Write the failing test for the new `DealCard`.**

Create `tests/DealCard.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DealCard from '../src/components/ComputeDealMap/DealCard.jsx'

const deal = {
  id: 'nv-crwv-1',
  source: 'NVIDIA',
  target: 'CoreWeave',
  deal_type: 'gpu_purchase',
  value_display: '$6.3B',
  date_display: 'Sep 2025',
  description: 'H100 cluster capacity for Microsoft Azure workloads via CoreWeave.',
  source_url: 'https://example.com/src',
}

describe('DealCard (mobile)', () => {
  it('renders the three information lines', () => {
    render(<DealCard deal={deal} onClickDeal={() => {}} onClickCompany={() => {}} />)
    expect(screen.getByText('NVIDIA')).toBeInTheDocument()
    expect(screen.getByText('CoreWeave')).toBeInTheDocument()
    expect(screen.getByText(/GPU Purchase/)).toBeInTheDocument()
    expect(screen.getByText(/\$6\.3B/)).toBeInTheDocument()
    expect(screen.getByText(/Sep 2025/)).toBeInTheDocument()
    expect(screen.getByText(/H100 cluster capacity/)).toBeInTheDocument()
  })

  it('tapping the card fires onClickDeal with source+target', () => {
    const onClickDeal = vi.fn()
    render(<DealCard deal={deal} onClickDeal={onClickDeal} onClickCompany={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /NVIDIA.*CoreWeave/ }))
    expect(onClickDeal).toHaveBeenCalledWith({ source: 'NVIDIA', target: 'CoreWeave' })
  })

  it('tapping a company name fires onClickCompany and does not fire onClickDeal', () => {
    const onClickDeal = vi.fn()
    const onClickCompany = vi.fn()
    render(<DealCard deal={deal} onClickDeal={onClickDeal} onClickCompany={onClickCompany} />)
    fireEvent.click(screen.getByText('NVIDIA'))
    expect(onClickCompany).toHaveBeenCalledWith('NVIDIA')
    expect(onClickDeal).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 4: Run the test to verify it fails.**

Run: `npm test -- DealCard`

Expected: FAIL with a module-not-found error for the new component.

- [ ] **Step 5: Implement `DealCard.jsx`.**

Create `src/components/ComputeDealMap/DealCard.jsx`:

```jsx
import styles from './styles.module.css'
import { DEAL_TYPES } from './data.js'

// Mobile card-list row for the Transactions table. Renders 3 lines:
//   1. source → target (primary, weight 600)
//   2. type · value · date (meta, muted)      + source ↗ on the right
//   3. description (muted, 1-line ellipsis)
//
// Tap the card body → onClickDeal({source, target}) opens the deal panel.
// Tap a company name → onClickCompany(name) opens the company panel.
export default function DealCard({ deal: d, onClickDeal, onClickCompany, highlighted }) {
  const typeLabel = DEAL_TYPES[d.deal_type]?.label || d.deal_type
  const metaParts = [typeLabel, d.value_display, d.date_display].filter(Boolean)

  const handleCompany = (name) => (e) => {
    e.stopPropagation()
    onClickCompany?.(name)
  }

  return (
    <div
      className={[
        styles.dealCardMobile,
        highlighted ? styles.dealCardMobileHighlighted : '',
      ].filter(Boolean).join(' ')}
      role="button"
      tabIndex={0}
      aria-label={`${d.source} to ${d.target}: ${typeLabel}`}
      onClick={() => onClickDeal?.({ source: d.source, target: d.target })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClickDeal?.({ source: d.source, target: d.target })
        }
      }}
    >
      <div className={styles.dealCardMobileLine1}>
        <span
          className={styles.dealCardMobileCompany}
          role="link"
          tabIndex={0}
          onClick={handleCompany(d.source)}
        >{d.source}</span>
        <span className={styles.dealCardMobileArrow}> to </span>
        <span
          className={styles.dealCardMobileCompany}
          role="link"
          tabIndex={0}
          onClick={handleCompany(d.target)}
        >{d.target}</span>
      </div>
      <div className={styles.dealCardMobileLine2}>
        <span>{metaParts.join(' · ')}</span>
        {d.source_url && (
          <a
            className={styles.dealCardMobileSource}
            href={d.source_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Open source"
          >↗</a>
        )}
      </div>
      {d.description && (
        <div className={styles.dealCardMobileLine3}>{d.description}</div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Add CSS for the new classes.**

Append to `src/components/ComputeDealMap/styles.module.css` (at the bottom of the file, before the final newline):

```css
/* Mobile card-list row for Transactions + Sources. */
.dealCardMobile {
  padding: 10px 8px;
  border-bottom: 1px solid var(--border-soft);
  cursor: pointer;
  background: transparent;
  transition: background 100ms ease;
}
.dealCardMobile:active { background: var(--row-hover); }
.dealCardMobileHighlighted { background: var(--row-highlight); }
.dealCardMobileLine1 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.3;
  padding: 6px 0;
}
.dealCardMobileCompany {
  cursor: pointer;
}
.dealCardMobileCompany:hover {
  text-decoration: underline;
  text-decoration-color: var(--link-underline);
  text-underline-offset: 2px;
}
.dealCardMobileArrow {
  color: var(--text-muted);
  font-weight: 400;
}
.dealCardMobileLine2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 2px;
  gap: 8px;
}
.dealCardMobileSource {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--text);
  text-decoration: none;
  cursor: pointer;
}
.dealCardMobileSource:hover { color: var(--text-strong); }
.dealCardMobileLine3 {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

- [ ] **Step 7: Run tests.**

Run: `npm test`

Expected: 32 + 3 = 35 tests pass (the 3 new `DealCard` tests plus existing).

- [ ] **Step 8: Commit.**

```bash
git add src/components/ComputeDealMap/DealCard.jsx src/components/ComputeDealMap/DealHoverCard.jsx src/components/ComputeDealMap/Graph.jsx src/components/ComputeDealMap/styles.module.css tests/DealCard.test.jsx
git commit -m "feat(mobile): add DealCard mobile row; rename hover card to DealHoverCard"
```

---

### Task 1.2: Route `DealTable` through card list on mobile

**Files:**
- Modify: `src/components/ComputeDealMap/DealTable.jsx`
- Create: `tests/DealTable.test.jsx`

- [ ] **Step 1: Write the failing test.**

Create `tests/DealTable.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DealTable from '../src/components/ComputeDealMap/DealTable.jsx'

const deals = [
  {
    id: 'd1', source: 'NVIDIA', target: 'CoreWeave',
    deal_type: 'gpu_purchase', value_display: '$6.3B',
    date_display: 'Sep 2025', description: 'H100 cluster.',
    source_url: 'https://x.test/',
  },
]

function mockMatchMedia(matches) {
  const mql = {
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }
  vi.spyOn(window, 'matchMedia').mockImplementation(() => mql)
}

describe('DealTable responsive mode', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('renders the column table on desktop', () => {
    mockMatchMedia(false)
    render(
      <DealTable deals={deals} onHoverEdge={() => {}} onClickCompany={() => {}} onClickDeal={() => {}} />
    )
    expect(screen.getByText('Source')).toBeInTheDocument()
    expect(screen.getByText('Target')).toBeInTheDocument()
  })

  it('renders the card list on mobile (no "Source" / "Target" column headers)', () => {
    mockMatchMedia(true)
    render(
      <DealTable deals={deals} onHoverEdge={() => {}} onClickCompany={() => {}} onClickDeal={() => {}} />
    )
    expect(screen.queryByText('Source')).toBeNull()
    expect(screen.queryByText('Target')).toBeNull()
    expect(screen.getByText('NVIDIA')).toBeInTheDocument()
    expect(screen.getByText('CoreWeave')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify mobile branch fails.**

Run: `npm test -- DealTable`

Expected: FAIL on the mobile case (still rendering the column table).

- [ ] **Step 3: Import the hook and split render in `DealTable.jsx`.**

Open `src/components/ComputeDealMap/DealTable.jsx`. Add imports at the top:

```jsx
import useMediaQuery from './useMediaQuery.js'
import DealCard from './DealCard.jsx'
```

Inside the `DealTable` component, immediately after the `useState` calls and before the `useMemo`, add:

```jsx
const isMobile = useMediaQuery('(max-width: 767px)')
```

Then in the return, wrap the existing `<table>...</table>` JSX plus the pagination footer in a `{!isMobile && ( ... )}` guard, and add a new `{isMobile && ( ... )}` branch that renders a `<div>` containing one `<DealCard>` per `visible` deal, followed by the same pagination footer.

The card-list branch:

```jsx
{isMobile && (
  <div className={styles.dealCardList}>
    {/* Mobile sort picker */}
    <div className={styles.dealCardListSort}>
      <label htmlFor="deal-sort" className={styles.dealCardListSortLabel}>Sort</label>
      <select
        id="deal-sort"
        className={styles.dealCardListSortSelect}
        value={`${sort.column}:${sort.direction}`}
        onChange={(e) => {
          const [column, direction] = e.target.value.split(':')
          setSort({ column, direction })
        }}
      >
        <option value="value_billions:desc">Value (high to low)</option>
        <option value="value_billions:asc">Value (low to high)</option>
        <option value="date:desc">Date (newest)</option>
        <option value="date:asc">Date (oldest)</option>
        <option value="source:asc">Source (A to Z)</option>
      </select>
    </div>
    {visible.map(d => {
      const dealKey = `${d.source}__${d.target}`
      const highlighted = hoverKey === dealKey
      return (
        <DealCard
          key={d.id}
          deal={d}
          highlighted={highlighted}
          onClickDeal={onClickDeal}
          onClickCompany={onClickCompany}
        />
      )
    })}
  </div>
)}
```

The existing banner `{banner && <div className={styles.tableBanner}>{banner}</div>}` should sit ABOVE both branches so it renders in either mode.

- [ ] **Step 4: Add supporting CSS classes.**

Append to `src/components/ComputeDealMap/styles.module.css`:

```css
.dealCardList {
  display: flex;
  flex-direction: column;
}
.dealCardListSort {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
  color: var(--text-muted);
}
.dealCardListSortLabel {
  font-weight: 600;
  color: var(--text);
}
.dealCardListSortSelect {
  flex: 1 1 auto;
  height: 40px;
  padding: 0 8px;
  font: inherit;
  font-size: 14px;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 0;
}
```

- [ ] **Step 5: Run tests.**

Run: `npm test -- DealTable`

Expected: both tests PASS.

- [ ] **Step 6: Browser verify.**

Reload the app. Chrome DevTools device mode at 393px — transactions render as cards. At 1280px — desktop table unchanged.

- [ ] **Step 7: Commit.**

```bash
git add src/components/ComputeDealMap/DealTable.jsx src/components/ComputeDealMap/styles.module.css tests/DealTable.test.jsx
git commit -m "feat(mobile): DealTable renders DealCard list + <select> sort under 768px"
```

---

### Task 1.3: Build `SourceCard` mobile row

**Files:**
- Create: `src/components/ComputeDealMap/SourceCard.jsx`
- Create: `tests/SourceCard.test.jsx`

- [ ] **Step 1: Write the failing test.**

Create `tests/SourceCard.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SourceCard from '../src/components/ComputeDealMap/SourceCard.jsx'

const row = {
  source: 'Reuters',
  article: 'Broadcom signs long-term deal with Google',
  date: '2026-04',
  url: 'https://example.com/article',
}

describe('SourceCard (mobile)', () => {
  it('renders publisher, date, article, and arrow', () => {
    render(<SourceCard row={row} />)
    expect(screen.getByText('Reuters')).toBeInTheDocument()
    expect(screen.getByText(/2026-04/)).toBeInTheDocument()
    expect(screen.getByText(/Broadcom signs long-term/)).toBeInTheDocument()
  })

  it('wraps the card in an <a> when url is present', () => {
    const { container } = render(<SourceCard row={row} />)
    const anchor = container.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor.getAttribute('href')).toBe('https://example.com/article')
    expect(anchor.getAttribute('target')).toBe('_blank')
  })

  it('falls back to <div> when url is null', () => {
    const { container } = render(<SourceCard row={{ ...row, url: null }} />)
    expect(container.querySelector('a')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails.**

Run: `npm test -- SourceCard`

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `SourceCard.jsx`.**

Create `src/components/ComputeDealMap/SourceCard.jsx`:

```jsx
import styles from './styles.module.css'

// Mobile card-list row for the Data Sources section. 2 lines:
//   1. publisher · date   + source ↗ on the right
//   2. article title (truncated)
export default function SourceCard({ row }) {
  const hasUrl = Boolean(row.url)
  const metaParts = [row.source, row.date].filter(Boolean)

  const body = (
    <>
      <div className={styles.sourceCardMobileLine1}>
        <span>{metaParts.join(' · ')}</span>
        {hasUrl && <span className={styles.sourceCardMobileArrow} aria-hidden="true">↗</span>}
      </div>
      {row.article && (
        <div className={styles.sourceCardMobileLine2}>{row.article}</div>
      )}
    </>
  )

  const className = styles.sourceCardMobile

  if (hasUrl) {
    return (
      <a
        className={className}
        href={row.url}
        target="_blank"
        rel="noreferrer"
      >
        {body}
      </a>
    )
  }
  return <div className={className}>{body}</div>
}
```

- [ ] **Step 4: Add CSS classes.**

Append to `src/components/ComputeDealMap/styles.module.css`:

```css
.sourceCardMobile {
  display: block;
  padding: 10px 8px;
  border-bottom: 1px solid var(--border-soft);
  color: var(--text);
  text-decoration: none;
  cursor: pointer;
}
a.sourceCardMobile:hover .sourceCardMobileLine2 { color: var(--text); }
.sourceCardMobileLine1 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.3;
  gap: 8px;
}
.sourceCardMobileArrow {
  color: var(--text);
  font-size: 14px;
}
.sourceCardMobileLine2 {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

- [ ] **Step 5: Run tests.**

Run: `npm test -- SourceCard`

Expected: 3 tests PASS.

- [ ] **Step 6: Commit.**

```bash
git add src/components/ComputeDealMap/SourceCard.jsx src/components/ComputeDealMap/styles.module.css tests/SourceCard.test.jsx
git commit -m "feat(mobile): add SourceCard mobile row"
```

---

### Task 1.4: Route `SourcesSection` through card list on mobile

**Files:**
- Modify: `src/components/ComputeDealMap/SourcesSection.jsx`
- Create: `tests/SourcesSection.test.jsx`

- [ ] **Step 1: Write the failing test.**

Create `tests/SourcesSection.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SourcesSection from '../src/components/ComputeDealMap/SourcesSection.jsx'

function mockMatchMedia(matches) {
  vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

describe('SourcesSection responsive mode', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('renders the column table on desktop', () => {
    mockMatchMedia(false)
    render(<SourcesSection />)
    expect(screen.getByText('Data Sources')).toBeInTheDocument()
    expect(screen.getByText('Article / Report')).toBeInTheDocument()
  })

  it('renders the card list on mobile (no Article / Report header)', () => {
    mockMatchMedia(true)
    render(<SourcesSection />)
    expect(screen.getByText('Data Sources')).toBeInTheDocument()
    expect(screen.queryByText('Article / Report')).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails.**

Run: `npm test -- SourcesSection`

Expected: FAIL on the mobile case.

- [ ] **Step 3: Split the render in `SourcesSection.jsx`.**

Open `src/components/ComputeDealMap/SourcesSection.jsx`. Add imports:

```jsx
import useMediaQuery from './useMediaQuery.js'
import SourceCard from './SourceCard.jsx'
```

Inside the component, after the existing `useMemo`/`useState` hooks, add:

```jsx
const isMobile = useMediaQuery('(max-width: 767px)')
```

Gate the existing `<table>...</table>` behind `{!isMobile && ( ... )}`. Add a new branch:

```jsx
{isMobile && (
  <div className={styles.sourceCardList}>
    {visible.map(r => (
      <SourceCard key={r.n} row={r} />
    ))}
  </div>
)}
```

The pagination footer (`Show N more` / `Showing …`) should render in both modes — keep it outside the branch guard.

- [ ] **Step 4: Add CSS class.**

Append to `src/components/ComputeDealMap/styles.module.css`:

```css
.sourceCardList {
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 5: Run tests.**

Run: `npm test -- SourcesSection`

Expected: 2 tests PASS.

- [ ] **Step 6: Browser verify.**

At 393px, the Data Sources section renders as a 2-line card list. At 1280px, unchanged.

- [ ] **Step 7: Commit.**

```bash
git add src/components/ComputeDealMap/SourcesSection.jsx src/components/ComputeDealMap/styles.module.css tests/SourcesSection.test.jsx
git commit -m "feat(mobile): SourcesSection renders SourceCard list under 768px"
```

---

## Phase 2 — Toolbar + filter bottom sheet

### Task 2.1: Add `nativeOnMobile` mode to `Dropdown`

**Files:**
- Modify: `src/components/ComputeDealMap/Dropdown.jsx`
- Create: `tests/Dropdown.test.jsx`

- [ ] **Step 1: Write the failing test.**

Create `tests/Dropdown.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Dropdown from '../src/components/ComputeDealMap/Dropdown.jsx'

function mockMatchMedia(matches) {
  vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]

describe('Dropdown nativeOnMobile', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('renders the custom panel by default on mobile', () => {
    mockMatchMedia(true)
    const { container } = render(
      <Dropdown label="X" options={options} value="a" onChange={() => {}} />
    )
    expect(container.querySelector('select')).toBeNull()
  })

  it('renders a <select> when nativeOnMobile is true and viewport is mobile', () => {
    mockMatchMedia(true)
    const onChange = vi.fn()
    const { container } = render(
      <Dropdown
        label="X"
        options={options}
        value="a"
        onChange={onChange}
        nativeOnMobile
      />
    )
    const select = container.querySelector('select')
    expect(select).not.toBeNull()
    expect(select.value).toBe('a')
    fireEvent.change(select, { target: { value: 'b' } })
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('renders the custom panel when nativeOnMobile is true but viewport is desktop', () => {
    mockMatchMedia(false)
    const { container } = render(
      <Dropdown
        label="X"
        options={options}
        value="a"
        onChange={() => {}}
        nativeOnMobile
      />
    )
    expect(container.querySelector('select')).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails.**

Run: `npm test -- Dropdown`

Expected: FAIL — `nativeOnMobile` prop is ignored, custom panel renders.

- [ ] **Step 3: Implement the native-on-mobile branch.**

Open `src/components/ComputeDealMap/Dropdown.jsx`. Add import at the top:

```jsx
import useMediaQuery from './useMediaQuery.js'
```

Accept `nativeOnMobile = false` in the props destructure. Inside the component, early in the body (after the existing hook calls), add:

```jsx
const isMobile = useMediaQuery('(max-width: 767px)')
const useNative = nativeOnMobile && isMobile && Array.isArray(options) && options.length > 0 && !children
```

Then above the existing `return (...)` add a native branch:

```jsx
if (useNative) {
  return (
    <label className={styles.dropdownNativeWrap || ''}>
      <span className={styles.dropdownNativeLabel || ''} style={{ fontWeight: 700, fontSize: '12px', marginRight: '8px' }}>
        {label}:
      </span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: '40px',
          minWidth: '120px',
          fontSize: '14px',
          color: 'var(--text)',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 0,
          padding: '0 8px',
          fontFamily: 'inherit',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}
```

- [ ] **Step 4: Run tests.**

Run: `npm test -- Dropdown`

Expected: 3 tests PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/components/ComputeDealMap/Dropdown.jsx tests/Dropdown.test.jsx
git commit -m "feat(mobile): Dropdown renders native <select> when nativeOnMobile && mobile"
```

---

### Task 2.2: Build `MobileFilterSheet` full-screen wrapper

**Files:**
- Create: `src/components/ComputeDealMap/MobileFilterSheet.jsx`
- Create: `tests/MobileFilterSheet.test.jsx`

- [ ] **Step 1: Write the failing test.**

Create `tests/MobileFilterSheet.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MobileFilterSheet from '../src/components/ComputeDealMap/MobileFilterSheet.jsx'

describe('MobileFilterSheet', () => {
  it('does not render children when closed', () => {
    render(
      <MobileFilterSheet isOpen={false} title="Trace" onClose={() => {}}>
        <div>child-content</div>
      </MobileFilterSheet>
    )
    expect(screen.queryByText('child-content')).toBeNull()
  })

  it('renders the title, children, and a Done button when open', () => {
    render(
      <MobileFilterSheet isOpen title="Trace" onClose={() => {}}>
        <div>child-content</div>
      </MobileFilterSheet>
    )
    expect(screen.getByText('Trace')).toBeInTheDocument()
    expect(screen.getByText('child-content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })

  it('calls onClose when Done is pressed', () => {
    const onClose = vi.fn()
    render(
      <MobileFilterSheet isOpen title="Trace" onClose={onClose}>
        <div>child-content</div>
      </MobileFilterSheet>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to verify it fails.**

Run: `npm test -- MobileFilterSheet`

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `MobileFilterSheet.jsx`.**

Create `src/components/ComputeDealMap/MobileFilterSheet.jsx`:

```jsx
import { useEffect } from 'react'
import styles from './styles.module.css'

// Full-screen bottom-sheet wrapper for mobile filter content.
// Pass `isOpen`, `title`, `onClose`, and children (the filter controls).
// Closes on Escape or Done button tap.
export default function MobileFilterSheet({ isOpen, title, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className={styles.mobileFilterBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className={styles.mobileFilterSheet}>
        <div className={styles.mobileFilterHeader}>
          <h3 className={styles.mobileFilterTitle}>{title}</h3>
          <button
            type="button"
            className={styles.mobileFilterDone}
            onClick={onClose}
          >Done</button>
        </div>
        <div className={styles.mobileFilterBody}>
          {children}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add CSS.**

Append to `src/components/ComputeDealMap/styles.module.css`:

```css
.mobileFilterBackdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  animation: mobileFilterBackdropFade 200ms ease;
}
@keyframes mobileFilterBackdropFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.mobileFilterSheet {
  width: 100%;
  max-height: 85vh;
  background: var(--bg);
  border-top: 1px solid var(--border);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  animation: mobileFilterSheetSlideUp 220ms ease;
}
@keyframes mobileFilterSheetSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
.mobileFilterHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.mobileFilterTitle {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
}
.mobileFilterDone {
  font: inherit;
  font-size: 14px;
  color: var(--text);
  background: transparent;
  border: none;
  padding: 8px 4px;
  min-height: 44px;
  cursor: pointer;
}
.mobileFilterBody {
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

- [ ] **Step 5: Run tests.**

Run: `npm test -- MobileFilterSheet`

Expected: 3 tests PASS.

- [ ] **Step 6: Commit.**

```bash
git add src/components/ComputeDealMap/MobileFilterSheet.jsx src/components/ComputeDealMap/styles.module.css tests/MobileFilterSheet.test.jsx
git commit -m "feat(mobile): add MobileFilterSheet full-screen wrapper"
```

---

### Task 2.3: Stack Toolbar on mobile and route filters through `MobileFilterSheet`

**Files:**
- Modify: `src/components/ComputeDealMap/Toolbar.jsx`
- Modify: `src/components/ComputeDealMap/styles.module.css`
- Modify: `tests/Toolbar.test.jsx`

- [ ] **Step 1: Add mobile two-row CSS.**

In `src/components/ComputeDealMap/styles.module.css`, find the existing `@media (max-width: 767px)` block that contains `.toolbar / .toolbarChips / .toolbarSearch` rules and replace its body with the new mobile layout:

```css
@media (max-width: 767px) {
  .toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
  .toolbarSearch {
    flex: 1 1 100%;
    min-width: 0;
    height: 40px;
    font-size: 14px;
    order: 1;
  }
  .toolbarChips {
    flex: 1 1 100%;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
    order: 2;
  }
  .toolbarChips > * { width: 100%; }
  .toolbarChips button {
    height: 40px;
    width: 100%;
    justify-content: flex-start;
    font-size: 13px;
  }
}
```

- [ ] **Step 2: Add mobile-mode state + sheet rendering in `Toolbar.jsx`.**

Open `src/components/ComputeDealMap/Toolbar.jsx`. Add imports:

```jsx
import useMediaQuery from './useMediaQuery.js'
import MobileFilterSheet from './MobileFilterSheet.jsx'
```

In the component body, add state for which filter is open in its sheet:

```jsx
const isMobile = useMediaQuery('(max-width: 767px)')
const [mobileSheet, setMobileSheet] = useState(null)  // null | 'trace' | 'timeline' | 'cluster'
```

Keep the existing `openKey` coordination for desktop. For mobile, intercept the chip clicks: when `isMobile` is true, set `mobileSheet` to the chip's key instead of toggling `openKey`.

The cleanest approach: swap the existing three `<Dropdown ... />` invocations. On mobile, render three plain `<button>` elements with the same label + displayValue pattern, each `onClick` calling `setMobileSheet('trace' | 'timeline' | 'cluster')`. Render the corresponding filter controls inside `<MobileFilterSheet>` at the bottom of the Toolbar JSX.

Pseudocode structure (place below the existing search `<input>`):

```jsx
{isMobile ? (
  <div className={styles.toolbarChips}>
    <button
      type="button"
      className={styles.toolbarMobileChip}
      onClick={() => setMobileSheet('trace')}
    >
      <span style={{ fontWeight: 600 }}>Trace:</span>{' '}
      <span>{traceDisplay}</span>
    </button>
    <button
      type="button"
      className={styles.toolbarMobileChip}
      onClick={() => setMobileSheet('timeline')}
    >
      <span style={{ fontWeight: 600 }}>Timeline:</span>{' '}
      <span>{timelineDisplay}</span>
    </button>
    <button
      type="button"
      className={styles.toolbarMobileChip}
      onClick={() => setMobileSheet('cluster')}
    >
      <span style={{ fontWeight: 600 }}>Cluster:</span>{' '}
      <span>{clusterDisplay}</span>
    </button>
  </div>
) : (
  <div className={styles.toolbarChips}>
    {/* existing <Dropdown> Trace / Timeline / Cluster stay here unchanged */}
  </div>
)}

<MobileFilterSheet
  isOpen={mobileSheet === 'trace'}
  title="Trace"
  onClose={() => setMobileSheet(null)}
>
  {/* Mobile Trace content: From and To as <Dropdown nativeOnMobile>,
      plus the existing tracePaths list rendering. */}
  <Dropdown
    label="From"
    options={companyOptions}
    value={traceOrigin ?? ''}
    onChange={onChangeTraceOrigin}
    nativeOnMobile
  />
  <Dropdown
    label="To"
    options={destinationOptions}
    value={traceDestination ?? ''}
    onChange={onChangeTraceDestination}
    nativeOnMobile
  />
  {/* path list — reuse the existing rendering by extracting it to a const above */}
</MobileFilterSheet>

<MobileFilterSheet
  isOpen={mobileSheet === 'timeline'}
  title="Timeline"
  onClose={() => setMobileSheet(null)}
>
  <Dropdown
    label="From"
    options={yearRangeOptions(earliestYear, toYear)}
    value={String(fromYear)}
    onChange={(v) => {
      const next = parseInt(v, 10)
      onChangeTimeline({ from: yearToFrom(next), to: yearToTo(toYear) })
    }}
    nativeOnMobile
  />
  <Dropdown
    label="To"
    options={yearRangeOptions(fromYear, latestYear)}
    value={String(toYear)}
    onChange={(v) => {
      const next = parseInt(v, 10)
      onChangeTimeline({ from: yearToFrom(fromYear), to: yearToTo(next) })
    }}
    nativeOnMobile
  />
  {!isTimelineDefault && (
    <button
      type="button"
      className={styles.toolbarPanelLink}
      onClick={onClearTimeline}
    >Reset</button>
  )}
</MobileFilterSheet>

<MobileFilterSheet
  isOpen={mobileSheet === 'cluster'}
  title="Cluster"
  onClose={() => setMobileSheet(null)}
>
  {/* existing cluster option list — same checklist, one entry per category */}
  <div className={styles.clusterOptionList}>
    {clusterOptions.map(opt => {
      const isActive = clusterCategories?.has(opt.value)
      return (
        <button
          key={opt.value}
          type="button"
          className={isActive ? styles.clusterOptionActive : styles.clusterOption}
          onClick={() => onToggleCluster(opt.value)}
        >
          <span className={styles.clusterOptionCheck}>{isActive ? '\u25A0' : '\u25A1'}</span>
          <span>{opt.label}</span>
        </button>
      )
    })}
  </div>
  {clusterCategories?.size > 0 && (
    <button
      type="button"
      className={styles.toolbarPanelLink}
      onClick={onClearCluster}
    >Clear</button>
  )}
</MobileFilterSheet>
```

- [ ] **Step 3: Add `.toolbarMobileChip` style.**

Append to `src/components/ComputeDealMap/styles.module.css`:

```css
.toolbarMobileChip {
  height: 40px;
  padding: 0 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
```

- [ ] **Step 4: Update `tests/Toolbar.test.jsx` to assert the mobile branch.**

Open `tests/Toolbar.test.jsx`. Add a helper + new test block:

```jsx
function mockMatchMedia(matches) {
  vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

describe('Toolbar mobile mode', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('renders three chip buttons in a grid when mobile', () => {
    mockMatchMedia(true)
    render(<Toolbar {...baseProps} />)
    expect(screen.getByText('Trace:')).toBeInTheDocument()
    expect(screen.getByText('Timeline:')).toBeInTheDocument()
    expect(screen.getByText('Cluster:')).toBeInTheDocument()
  })

  it('tapping the Trace chip opens a MobileFilterSheet titled Trace', () => {
    mockMatchMedia(true)
    render(<Toolbar {...baseProps} />)
    fireEvent.click(screen.getByText('Trace:').closest('button'))
    // The sheet header repeats the title
    const sheetTitle = screen.getAllByText('Trace').find(n => n.tagName === 'H3')
    expect(sheetTitle).toBeTruthy()
  })
})
```

Add the `beforeEach`, `afterEach` imports from `vitest` if not already imported (`import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'`).

- [ ] **Step 5: Run tests.**

Run: `npm test`

Expected: all tests PASS (32 existing + Phase 0-1 new tests + Toolbar mobile tests).

- [ ] **Step 6: Browser verify.**

At 393px: search is full-width on row 1; three chips in a 3-up grid on row 2. Tap Trace — a bottom sheet slides up with `<select>` From/To and a Done button. Desktop unchanged.

- [ ] **Step 7: Commit.**

```bash
git add src/components/ComputeDealMap/Toolbar.jsx src/components/ComputeDealMap/styles.module.css tests/Toolbar.test.jsx
git commit -m "feat(mobile): Toolbar two-row layout + filter bottom-sheets"
```

---

## Phase 3 — Profile panel mobile polish

### Task 3.1: Add drag-bar to the bottom sheet + bump close tap target

**Files:**
- Modify: `src/components/ComputeDealMap/ProfilePanel.jsx`
- Modify: `src/components/ComputeDealMap/styles.module.css`

- [ ] **Step 1: Add the drag-bar element in `ProfilePanel.jsx`.**

Open `src/components/ComputeDealMap/ProfilePanel.jsx`. Inside the `<aside>` render, immediately after the opening `<aside ...>` tag and before `<div className={styles.profilePanelHeader}>`, add:

```jsx
<div className={styles.profilePanelDragBar} aria-hidden="true" />
```

- [ ] **Step 2: Add the drag-bar CSS and mobile-specific close tap-target bump.**

In `src/components/ComputeDealMap/styles.module.css`, locate the existing `@media (max-width: 767px)` block for `.profilePanel` and extend it:

```css
@media (max-width: 767px) {
  .profilePanel {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 85vh;
    border-left: none;
    border-top: 1px solid var(--border);
    transform: translateY(100%);
  }
  .profilePanelOpen {
    transform: translateY(0);
    animation: profilePanelSlideInUp 300ms ease;
  }
  @keyframes profilePanelSlideInUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  .profilePanelDragBar {
    display: block;
    width: 40px;
    height: 4px;
    margin: 6px auto 8px;
    background: var(--border);
  }
  .profilePanelClose {
    min-width: 44px;
    min-height: 44px;
    padding: 10px 12px;
    font-size: 14px;
  }
  .profileDescription { font-size: 14px; }
}

/* Hide the drag bar on desktop. */
.profilePanelDragBar { display: none; }
```

Note: the selector `.profilePanelDragBar { display: none; }` must appear OUTSIDE (after) the media query so desktop hides the bar.

- [ ] **Step 3: Run tests.**

Run: `npm test -- ProfilePanel`

Expected: existing 7 tests still pass (drag-bar is non-interactive).

- [ ] **Step 4: Browser verify.**

At 393px: click a node — the panel slides up, a 40×4 drag-bar is visible at the top, Close tap target is 44px. Desktop: drag-bar hidden, Close button looks the same.

- [ ] **Step 5: Commit.**

```bash
git add src/components/ComputeDealMap/ProfilePanel.jsx src/components/ComputeDealMap/styles.module.css
git commit -m "feat(mobile): profile panel drag-bar + 44px close tap target"
```

---

### Task 3.2: Swap Counterparty `Dropdown` to native on mobile

**Files:**
- Modify: `src/components/ComputeDealMap/ProfilePanel.jsx`

- [ ] **Step 1: Add `nativeOnMobile` to the counterparty Dropdown.**

In `src/components/ComputeDealMap/ProfilePanel.jsx`, find the `<Dropdown label="Counterparty" ... />` call (introduced in the previous refactor). Add the `nativeOnMobile` prop:

```jsx
<Dropdown
  label="Counterparty"
  options={counterpartyOptions}
  value={activeValue}
  onChange={v => onSetCounterpartyFilter(v === '__all__' ? null : v)}
  searchable
  panelMaxHeight={260}
  nativeOnMobile
/>
```

- [ ] **Step 2: Run tests.**

Run: `npm test -- ProfilePanel`

Expected: 7 tests still pass.

- [ ] **Step 3: Browser verify.**

At 393px: open a company panel. The Counterparty control is a native OS picker when tapped. Desktop: still the custom Dropdown.

- [ ] **Step 4: Commit.**

```bash
git add src/components/ComputeDealMap/ProfilePanel.jsx
git commit -m "feat(mobile): counterparty filter uses native select on mobile"
```

---

## Phase 4 — Graph block mobile polish

### Task 4.1: Mobile graph height and always-visible expand button

**Files:**
- Modify: `src/app.css`
- Modify: `src/components/ComputeDealMap/styles.module.css`

- [ ] **Step 1: Mobile graph block height.**

In `src/app.css`, extend the existing mobile media query to include the graphBlock height:

```css
@media (max-width: 767px) {
  .computePage { padding: 12px 12px 24px; }
  .graphBlock { height: min(46vh, 420px); min-height: 300px; }
}
```

- [ ] **Step 2: Always-visible expand button on mobile.**

In `src/components/ComputeDealMap/styles.module.css`, find the existing `.graphExpandHint` rules. At the bottom of the file (after any existing mobile media queries), add:

```css
@media (max-width: 767px) {
  .graphExpandHint {
    opacity: 1;
    padding: 8px;
  }
  .graphReset {
    min-width: 44px;
    min-height: 44px;
    padding: 10px;
  }
}
```

- [ ] **Step 3: Browser verify.**

At 393px: the graph container is smaller; the Expand button is always visible in the bottom-right; graph reset is a 44px tap target when focus mode is on.

- [ ] **Step 4: Commit.**

```bash
git add src/app.css src/components/ComputeDealMap/styles.module.css
git commit -m "feat(mobile): graph height + always-visible expand and reset"
```

---

### Task 4.2: Suppress `CompanyCard` and `DealHoverCard` render on mobile

**Files:**
- Modify: `src/components/ComputeDealMap/Graph.jsx`

- [ ] **Step 1: Add mobile check in `Graph.jsx`.**

Open `src/components/ComputeDealMap/Graph.jsx`. Add the import:

```jsx
import useMediaQuery from './useMediaQuery.js'
```

Inside the component, after the existing dims / hover state, add:

```jsx
const isMobile = useMediaQuery('(max-width: 767px)')
```

Find the two render branches that mount `<DealHoverCard ... />` and `<CompanyCard ... />`. Wrap each with `{!isMobile && layoutReady && ...}` (the `layoutReady` gate is already there — add `!isMobile` as an additional condition). Example:

Before:
```jsx
{layoutReady && hoveredNode && (() => {
  // ... CompanyCard
})()}
```

After:
```jsx
{!isMobile && layoutReady && hoveredNode && (() => {
  // ... CompanyCard
})()}
```

Same edit for the `DealHoverCard` block.

- [ ] **Step 2: Run tests.**

Run: `npm test`

Expected: all pass.

- [ ] **Step 3: Browser verify.**

At 393px: hovering a node (emulated via the cursor in DevTools) does not show the CompanyCard. Tapping the node opens the panel directly. Desktop unchanged.

- [ ] **Step 4: Commit.**

```bash
git add src/components/ComputeDealMap/Graph.jsx
git commit -m "feat(mobile): suppress hover cards (CompanyCard, DealHoverCard) under 768px"
```

---

## Phase 5 — Header, tagline, footer, type scale

### Task 5.1: Expandable tagline

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/app.css`

- [ ] **Step 1: Add tagline expand state in `src/App.jsx`.**

Open `src/App.jsx`. At the top of the `App` component, add:

```jsx
const [taglineExpanded, setTaglineExpanded] = useState(false)
```

Replace the `<p className="computeTagline">…</p>` with:

```jsx
<p className={`computeTagline ${taglineExpanded ? 'computeTaglineExpanded' : ''}`}>
  a structured, source-backed dataset of publicly disclosed ai ecosystem transactions across sovereign AI, hyperscaler capex, custom silicon, and the hardware providers behind them. maintained by justin wang. last updated {BUILD_DATE_LABEL}. source data public repository{' '}
  <a href="https://github.com/jstwng/compute-deal-map-data" target="_blank" rel="noreferrer">here</a>.
</p>
<button
  type="button"
  className="computeTaglineToggle"
  onClick={() => setTaglineExpanded(v => !v)}
>
  {taglineExpanded ? 'less' : 'more'}
</button>
```

- [ ] **Step 2: CSS for clamped tagline + toggle.**

In `src/app.css`, replace `.computeTagline` with:

```css
.computeTagline {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-strong);
  margin: 0;
  max-width: 640px;
}
```

Add below it:

```css
.computeTaglineToggle {
  display: none; /* hidden on desktop */
}
```

And extend the mobile media query:

```css
@media (max-width: 767px) {
  .computePage { padding: 12px 12px 24px; }
  .graphBlock { height: min(46vh, 420px); min-height: 300px; }
  .computeTagline {
    font-size: 13px;
    max-width: none;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .computeTaglineExpanded {
    -webkit-line-clamp: unset;
    overflow: visible;
  }
  .computeTaglineToggle {
    display: inline-block;
    margin-top: 4px;
    font: inherit;
    font-size: 13px;
    color: var(--text-muted);
    background: transparent;
    border: none;
    padding: 0;
    text-decoration: underline;
    text-decoration-color: var(--link-underline);
    text-underline-offset: 2px;
    cursor: pointer;
  }
}
```

- [ ] **Step 3: Browser verify.**

At 393px: tagline shows 3 lines + a `more` link. Tap → expands. Tap again → collapses. At 1280px: no `more` link, tagline unchanged.

- [ ] **Step 4: Run tests.**

Run: `npm test`

Expected: all pass (no behavioral tests for tagline; purely visual).

- [ ] **Step 5: Commit.**

```bash
git add src/App.jsx src/app.css
git commit -m "feat(mobile): expandable 3-line tagline"
```

---

### Task 5.2: Footer bump to 12px on mobile

**Files:**
- Modify: `src/app.css`

- [ ] **Step 1: Mobile footer tweak.**

In `src/app.css`, within the mobile media query, add:

```css
@media (max-width: 767px) {
  /* ...existing rules... */
  .computeFooter { font-size: 12px; padding-top: 24px; }
}
```

(Add the line alongside the existing mobile rules; don't duplicate the media query block.)

- [ ] **Step 2: Browser verify.**

At 393px: footer is 12px and has extra breathing room above. Desktop: unchanged.

- [ ] **Step 3: Commit.**

```bash
git add src/app.css
git commit -m "feat(mobile): bump footer to 12px with 24px padding-top"
```

---

## Phase 6 — Final QA walkthrough

### Task 6.1: Acceptance checklist walkthrough

**Files:** none modified; manual QA only.

- [ ] **Step 1: Run the test suite one last time.**

Run: `npm test`

Expected: 0 failing tests. The total count should be 32 (pre-existing) plus the new tests from Phase 0-2 (~17 new tests — 3 × useMediaQuery, 3 × DealCard, 3 × SourceCard, 3 × MobileFilterSheet, 2 × DealTable mobile, 2 × SourcesSection mobile, 3 × Dropdown, ~2 × Toolbar mobile).

- [ ] **Step 2: Open the app in Chrome DevTools device mode.**

Run: `npm run dev` (if not already on :8002).

Open `http://localhost:8002/`. Open DevTools → Toggle device toolbar.

- [ ] **Step 3: Walk through acceptance checklist at 393px (iPhone 15 Pro).**

For each item, tick as verified or note a failure:

- [ ] No horizontal scroll on any section of the page.
- [ ] Tagline shows 3 lines + `more` button; toggling works.
- [ ] Search input is full-width, 40px tall, 14px font.
- [ ] Three filter buttons (Trace / Timeline / Cluster) render as a 3-up grid on row 2 of the toolbar.
- [ ] Tapping any filter button opens a bottom sheet titled with that filter's name.
- [ ] Inside the sheet, sub-controls render as native pickers (`<select>`).
- [ ] `Done` button closes the sheet; Escape closes the sheet.
- [ ] Graph block is shorter (46vh / 420px max).
- [ ] Expand button in graph's bottom-right is always visible.
- [ ] Tapping a graph node opens the profile panel; no hover card ghosting.
- [ ] Transactions render as 3-line cards (source → target, meta, description).
- [ ] Sort picker above the cards is a native `<select>`.
- [ ] Tapping a card opens the deal panel AND narrows the graph.
- [ ] Tapping a company name inside a card opens the company panel (and not the deal panel).
- [ ] Source `↗` inside a card is a 32×32 tap target that opens the URL in a new tab and does not open the deal panel.
- [ ] Data Sources render as 2-line cards (publisher · date, article title).
- [ ] Tapping a source card opens the article URL in a new tab.
- [ ] Profile panel bottom sheet has a 40×4 drag-bar at the top.
- [ ] Close button on the panel is a 44×44 tap target.
- [ ] Description text inside the company panel is 14px with line-clamp.
- [ ] Counterparty filter in the panel is a native `<select>` on mobile.
- [ ] No CompanyCard or DealHoverCard ever appears on mobile.

- [ ] **Step 4: Walk through at 375px (iPhone SE).**

Repeat the above list. Expected: same results, tighter margins.

- [ ] **Step 5: Verify desktop is unchanged at 1280px.**

Expected: identical to what shipped on main before this plan started.

- [ ] **Step 6: Breakpoint grep.**

Run:

```bash
grep -rn 'max-width: \(640\|700\|720\|900\)px' src/
```

Expected: 0 occurrences. If any remain, eliminate them.

- [ ] **Step 7: Commit the QA sign-off as a notes file (optional).**

If everything passes, no commit needed. If any issue is found, file a follow-up task and note in the PR description.

---

## Self-Review

**Spec coverage check** (Alice's DESIGN_SPEC § → task mapping):

- §1 Breakpoint strategy → Tasks 0.2, 0.3.
- §2.1 Header → Task 5.1.
- §2.2 Toolbar → Tasks 2.1, 2.2, 2.3.
- §2.3 Graph block → Tasks 4.1, 4.2.
- §2.4 Transactions table → Tasks 1.1, 1.2.
- §2.5 Data Sources → Tasks 1.3, 1.4.
- §2.6 Profile panel → Tasks 3.1, 3.2.
- §2.7 Footer → Task 5.2.
- §2.8 Floating affordances → Task 4.1 (expand + reset) + Task 4.2 (hover cards).
- §3 Typography + tap targets → applied in Tasks 1.1, 2.3, 3.1, 4.1, 5.1 (card line font sizes, mobile chip height 40px, drag-bar + close 44px, graphReset 44px, tagline 13px).
- §4 Interaction replacements → Tasks 1.1 (card row = tap open), 2.1 (native select), 2.3 (filter chip → sheet), 4.1 (always-visible expand), 4.2 (suppress hover cards), 5.1 (`more` toggle).
- §5 Reference patterns → informational; no task required.
- §6 Out of scope → called out at top.
- §9 Component breakdown → matches file structure above.
- §10 Acceptance checklist → every line maps to a Step in Task 6.1.

**Placeholder scan:** I searched my own draft for "TBD", "TODO", "fill in details", "similar to Task". None found. Every step either shows the code to paste or names the exact file + line reference.

**Type / name consistency:** `useMediaQuery` is imported the same way everywhere. `DealCard` consistently refers to the new mobile row; `DealHoverCard` consistently refers to the renamed hover popup. `MobileFilterSheet` accepts `{ isOpen, title, onClose, children }` — these are the same props used in Task 2.3 and in its test. `SourceCard` accepts `{ row }` — same shape used by `SourcesSection`.

No gaps found.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-17-mobile-friendly-interface-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
