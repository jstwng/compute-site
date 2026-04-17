import { useMemo, useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import styles from './components/ComputeDealMap/styles.module.css'
import { DEALS, EARLIEST_DATE, LATEST_DATE } from './components/ComputeDealMap/data.js'
import { COMPANIES, CATEGORIES } from './components/ComputeDealMap/companies.js'
import {
  applyFilters,
  perCompanyAggregates,
  allShortestPaths,
  inDateRange,
  reachableFrom,
  edgeDealTypes,
  nodeEffectiveCategory,
} from './components/ComputeDealMap/logic.js'
import Toolbar from './components/ComputeDealMap/Toolbar.jsx'
import FilterBar from './components/ComputeDealMap/FilterBar.jsx'
import Graph from './components/ComputeDealMap/Graph.jsx'
import DealTable from './components/ComputeDealMap/DealTable.jsx'
import SourcesSection from './components/ComputeDealMap/SourcesSection.jsx'
import ProfilePanel from './components/ComputeDealMap/ProfilePanel.jsx'
import useMediaQuery from './components/ComputeDealMap/useMediaQuery.js'

const BUILD_DATE_LABEL = (() => {
  const iso = typeof __BUILD_DATE__ === 'string' ? __BUILD_DATE__ : new Date().toISOString()
  return new Date(iso)
    .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    .toLowerCase()
})()

const DEFAULT_TIMELINE = { from: EARLIEST_DATE, to: LATEST_DATE }

export default function App() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [taglineExpanded, setTaglineExpanded] = useState(false)
  const taglineInnerRef = useRef(null)
  const [taglineFullHeight, setTaglineFullHeight] = useState(0)
  useLayoutEffect(() => {
    const el = taglineInnerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => setTaglineFullHeight(el.scrollHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const [filters, setFilters] = useState({ dealType: 'all', category: 'all', search: '' })
  const [hoveredEdge, setHoveredEdge] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [scrollToDealId, setScrollToDealId] = useState(null)
  const [graphMaximized, setGraphMaximized] = useState(false)
  // focusedNodes is a Set (size 1 for company focus, size 2 for deal focus).
  // Drives both the panel + the graph's narrow-to-neighborhood view.
  const [focusedNodes, setFocusedNodes] = useState(null)
  const [panelMode, setPanelMode] = useState(null)
  const [panelKey, setPanelKey] = useState(null)
  const [counterpartyFilter, setCounterpartyFilter] = useState(null)

  // Three mode-state variables. At most one of trace/timeline/cluster is
  // active at a time (mutual exclusivity is enforced in the setter wrappers).
  const [traceOrigin, setTraceOrigin] = useState(null)
  const [traceDestination, setTraceDestination] = useState(null)
  // Always points to a specific path index (0..n-1) when paths exist;
  // 0 by default. There's no "all paths" mode.
  const [tracePathIndex, setTracePathIndex] = useState(0)
  // Hop-count filter for the trace path picker. null = show all lengths.
  // Auto-defaults to the shortest available length when paths first load
  // so the user lands on the most relevant chip without a click.
  const [tracePathLength, setTracePathLength] = useState(null)
  const [timelineRange, setTimelineRange] = useState(DEFAULT_TIMELINE)
  // Multi-select: Set of category slugs currently highlighted as a cluster.
  const [clusterCategories, setClusterCategories] = useState(() => new Set())

  const handleSearch = useCallback(v => setFilters(f => ({ ...f, search: v })), [])

  const filteredDeals = useMemo(() => applyFilters(DEALS, filters), [filters])

  // Trace / Timeline / Cluster are independent — multiple can be active at once.
  const resetTrace = useCallback(() => {
    setTraceOrigin(null)
    setTraceDestination(null)
    setTracePathIndex(0)
  }, [])

  const handleChangeTraceOrigin = useCallback(name => {
    setTraceOrigin(name)
    setTracePathIndex(0)
    // If the current destination is no longer reachable from the new origin,
    // clear it so the dropdown doesn't display a stale invalid value.
    if (name && traceDestination) {
      const reachable = reachableFrom(filteredDeals, name)
      if (!reachable.has(traceDestination)) setTraceDestination(null)
    }
  }, [traceDestination, filteredDeals])

  const handleChangeTraceDestination = useCallback(name => {
    setTraceDestination(name)
    setTracePathIndex(0)
  }, [])

  const handleClearTrace = useCallback(() => resetTrace(), [resetTrace])

  const handleChangeTimeline = useCallback(range => {
    setTimelineRange(range)
  }, [])

  const handleClearTimeline = useCallback(() => setTimelineRange(DEFAULT_TIMELINE), [])

  const handleToggleCluster = useCallback(category => {
    setClusterCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }, [])

  const handleClearCluster = useCallback(() => setClusterCategories(new Set()), [])

  const handleClearAllFilters = useCallback(() => {
    resetTrace()
    setTimelineRange(DEFAULT_TIMELINE)
    setClusterCategories(new Set())
  }, [resetTrace])

  const isTimelineActive =
    timelineRange.from !== EARLIEST_DATE || timelineRange.to !== LATEST_DATE

  const timelineDeals = useMemo(
    () => isTimelineActive ? inDateRange(filteredDeals, timelineRange.from, timelineRange.to) : filteredDeals,
    [isTimelineActive, filteredDeals, timelineRange]
  )

  const activeNodeSet = useMemo(() => {
    if (!isTimelineActive) return null
    const set = new Set()
    for (const d of timelineDeals) {
      if (d.source) set.add(d.source)
      if (d.target) set.add(d.target)
    }
    return set
  }, [isTimelineActive, timelineDeals])

  const activeEdgeSet = useMemo(() => {
    if (!isTimelineActive) return null
    const set = new Set()
    for (const d of timelineDeals) set.add(`${d.source}__${d.target}`)
    return set
  }, [isTimelineActive, timelineDeals])

  const companyAggregates = useMemo(() => perCompanyAggregates(filteredDeals), [filteredDeals])

  const traceDeals = isTimelineActive ? timelineDeals : filteredDeals

  const reachableFromOrigin = useMemo(
    () => traceOrigin ? reachableFrom(traceDeals, traceOrigin) : null,
    [traceOrigin, traceDeals]
  )

  const tracePaths = useMemo(() => {
    if (!traceOrigin || !traceDestination) return null
    if (traceOrigin === traceDestination) return []
    return allShortestPaths(traceDeals, traceOrigin, traceDestination)
  }, [traceOrigin, traceDestination, traceDeals])

  const traceReversePaths = useMemo(() => {
    if (!traceOrigin || !traceDestination) return null
    if (traceOrigin === traceDestination) return []
    if (tracePaths && tracePaths.length > 0) return null
    return allShortestPaths(traceDeals, traceDestination, traceOrigin)
  }, [traceOrigin, traceDestination, traceDeals, tracePaths])

  const traceNoPath = !!traceOrigin && !!traceDestination &&
    traceOrigin !== traceDestination && tracePaths && tracePaths.length === 0 &&
    !(traceReversePaths && traceReversePaths.length > 0)
  const traceNoPathBoth = traceNoPath && traceReversePaths && traceReversePaths.length === 0

  const swapTrace = useCallback(() => {
    setTraceOrigin(prevOrigin => {
      setTraceDestination(prevOrigin)
      return traceDestination
    })
    setTracePathIndex(0)
  }, [traceDestination])

  // Hop-count buckets: { len: number, count: number }[], sorted ascending.
  // Hop count == path.length - 1 (edges), surfaced to the user instead of
  // node-count so the chip label matches the way they describe the path.
  const tracePathBuckets = useMemo(() => {
    if (!tracePaths || tracePaths.length === 0) return []
    const counts = new Map()
    for (const p of tracePaths) {
      const hops = p.length - 1
      counts.set(hops, (counts.get(hops) || 0) + 1)
    }
    return [...counts.entries()]
      .map(([len, count]) => ({ len, count }))
      .sort((a, b) => a.len - b.len)
  }, [tracePaths])

  // Reset/auto-default the hop-count filter whenever the path set changes
  // (new origin/destination/data). Pick the shortest available length so
  // the user lands on the most coherent route without an extra click.
  useEffect(() => {
    if (!tracePaths || tracePaths.length === 0) {
      setTracePathLength(null)
      return
    }
    const shortest = tracePathBuckets[0]?.len ?? null
    setTracePathLength(prev => {
      // Keep the existing filter if it's still valid for the new bucket set.
      const stillValid = tracePathBuckets.some(b => b.len === prev)
      return stillValid ? prev : shortest
    })
    setTracePathIndex(0)
  }, [tracePaths, tracePathBuckets])

  // Filtered view: paths matching the current hop-count chip. The Toolbar
  // renders this list; the graph still highlights the active path index
  // within the FILTERED list.
  const visibleTracePaths = useMemo(() => {
    if (!tracePaths || tracePaths.length === 0) return tracePaths
    if (tracePathLength == null) return tracePaths
    return tracePaths.filter(p => p.length - 1 === tracePathLength)
  }, [tracePaths, tracePathLength])

  // Group visible paths by value-chain SHAPE (sequence of category tiers).
  // 42 paths from ASML to OpenAI collapses to ~4 shapes; the user scans
  // shapes to pick a "kind" of route, then picks the specific company
  // route within. Each group: { shape: ['equipment', 'foundry', ...],
  // shapeLabel: 'Equipment > Foundry > Chip Designer > ...', paths: [...],
  // pathStartIndex: number (offset into visibleTracePaths so the picker
  // can map a path to its global tracePathIndex). }
  const tracePathGroups = useMemo(() => {
    if (!visibleTracePaths || visibleTracePaths.length === 0) return null
    const groups = new Map()
    visibleTracePaths.forEach((p, i) => {
      const shape = p.map(n => nodeEffectiveCategory(traceDeals, n) || '?')
      const key = shape.join('>')
      if (!groups.has(key)) {
        const shapeLabel = shape
          .map(s => CATEGORIES[s]?.label || s.replace(/_/g, ' '))
          .join(' · ')
        groups.set(key, { shape, shapeLabel, paths: [], indices: [] })
      }
      const g = groups.get(key)
      g.paths.push(p)
      g.indices.push(i)
    })
    return [...groups.values()]
  }, [visibleTracePaths, traceDeals])

  // Clamp tracePathIndex into the FILTERED range so an out-of-bounds
  // index from a previous selection never breaks rendering.
  const safePathIndex = (visibleTracePaths && visibleTracePaths.length > 0)
    ? Math.min(Math.max(tracePathIndex, 0), visibleTracePaths.length - 1)
    : 0

  const tracePathNodes = useMemo(() => {
    // If both endpoints are picked but no path exists, still highlight them
    // — keeps the graph quiet (just two lit nodes) instead of falling back
    // to the default "everything dim" view.
    if (!traceOrigin || !traceDestination) return null
    if (visibleTracePaths && visibleTracePaths.length > 0) {
      return new Set(visibleTracePaths[safePathIndex])
    }
    return new Set([traceOrigin, traceDestination])
  }, [traceOrigin, traceDestination, visibleTracePaths, safePathIndex])

  const tracePathEdges = useMemo(() => {
    if (!visibleTracePaths || visibleTracePaths.length === 0) return null
    const set = new Set()
    const p = visibleTracePaths[safePathIndex]
    for (let i = 0; i < p.length - 1; i++) set.add(`${p[i]}__${p[i + 1]}`)
    return set
  }, [visibleTracePaths, safePathIndex])

  const clusterHighlightSet = useMemo(() => {
    if (clusterCategories.size === 0) return null
    return new Set(
      COMPANIES.filter(c => clusterCategories.has(c.category)).map(c => c.name)
    )
  }, [clusterCategories])

  const clusterHighlightCount = clusterHighlightSet ? clusterHighlightSet.size : 0

  // Deal-type map keyed by "source__target" — Toolbar renders the types
  // under each hop in the Trace path breakdown.
  const pathEdgeTypes = useMemo(() => edgeDealTypes(traceDeals), [traceDeals])

  // Defer the focus-change (which triggers the graph's heavy recompute)
  // to the next frame so the panel open/close transition can paint first.
  // Otherwise the render-time graph recompute blocks the main thread and
  // the slide animation appears to stall for ~100-300ms before starting.
  const closePanel = useCallback(() => {
    setPanelMode(null)
    setPanelKey(null)
    setCounterpartyFilter(null)
    requestAnimationFrame(() => setFocusedNodes(null))
  }, [])

  const openCompany = useCallback(name => {
    if (panelMode === 'company' && panelKey === name) {
      closePanel()
      return
    }
    setPanelMode('company')
    setPanelKey(name)
    setCounterpartyFilter(null)
    requestAnimationFrame(() => setFocusedNodes(new Set([name])))
  }, [panelMode, panelKey, closePanel])

  const openDeal = useCallback(edge => {
    const key = `${edge.source}__${edge.target}`
    if (panelMode === 'deal' && panelKey === key) {
      closePanel()
      return
    }
    setPanelMode('deal')
    setPanelKey(key)
    requestAnimationFrame(() => setFocusedNodes(new Set([edge.source, edge.target])))
  }, [panelMode, panelKey, closePanel])

  const panelContent = useMemo(() => {
    if (!panelMode || !panelKey) return null
    if (panelMode === 'company') {
      const company = COMPANIES.find(c => c.name === panelKey)
      if (!company) return null
      const relevantDeals = filteredDeals
        .filter(d => d.source === panelKey || d.target === panelKey)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      const aggregates = companyAggregates.get(panelKey) || {
        totalDeals: 0,
        counterparties: new Set(),
        earliest: null,
        latest: null,
        topDealTypes: [],
      }
      return {
        mode: 'company',
        company,
        aggregates,
        deals: relevantDeals,
        counterpartyFilter,
        onSetCounterpartyFilter: setCounterpartyFilter,
      }
    }
    if (panelMode === 'deal') {
      const [src, tgt] = panelKey.split('__')
      const deals = filteredDeals
        .filter(d => d.source === src && d.target === tgt)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      if (deals.length === 0) return null
      return {
        mode: 'deal',
        edge: { source: src, target: tgt },
        deals,
      }
    }
    return null
  }, [panelMode, panelKey, filteredDeals, companyAggregates, counterpartyFilter])

  const pathDealIds = useMemo(() => {
    if (!tracePathEdges) return null
    const set = new Set()
    for (const d of filteredDeals) {
      if (tracePathEdges.has(`${d.source}__${d.target}`)) set.add(d.id)
    }
    return set
  }, [tracePathEdges, filteredDeals])

  const tableDeals = useMemo(() => {
    let base = isTimelineActive ? timelineDeals : filteredDeals
    if (pathDealIds) base = base.filter(d => pathDealIds.has(d.id))
    return base
  }, [isTimelineActive, timelineDeals, filteredDeals, pathDealIds])

  const tableBanner = (() => {
    if (pathDealIds && visibleTracePaths && visibleTracePaths.length > 0) {
      const pathLabel = visibleTracePaths.length > 1 ? `Path ${safePathIndex + 1}` : 'the path'
      return (
        <>
          <span>
            Showing {pathDealIds.size} deal{pathDealIds.size === 1 ? '' : 's'} along {pathLabel} from {traceOrigin} to {traceDestination}
          </span>
          <button type="button" className={styles.toolbarPanelLink} onClick={handleClearTrace}>Clear</button>
        </>
      )
    }
    return null
  })()

  useEffect(() => {
    if (!graphMaximized) return
    const onKey = e => { if (e.key === 'Escape') setGraphMaximized(false) }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [graphMaximized])

  // Two-state mount so the modal gets both an enter AND an exit
  // transition. `modalMounted` controls presence in the DOM;
  // `modalOpen` flips the opacity/scale to their open values. On open
  // we mount first, then flip open on the next frame so the browser
  // sees opacity 0 -> 1 as a real transition. On close we flip open
  // off immediately, wait for the transition, then unmount.
  const [modalMounted, setModalMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (graphMaximized) {
      setModalMounted(true)
      const raf = requestAnimationFrame(() => setModalOpen(true))
      return () => cancelAnimationFrame(raf)
    }
    setModalOpen(false)
    const t = setTimeout(() => setModalMounted(false), 220)
    return () => clearTimeout(t)
  }, [graphMaximized])

  const tableFilters = { dealType: filters.dealType, category: filters.category }
  const setTableFilters = next => setFilters(f => ({ ...f, dealType: next.dealType, category: next.category }))

  const panelOpen = !!panelContent

  return (
    <div className={`computePage${panelOpen ? ' panelOpen' : ''}`}>
      <header className="computeHeader">
        <h1 className="computeTitle">
          ai ecosystem transactions <span className="computeTitleBy">by <a href="https://jstwng.com" target="_blank" rel="noreferrer">justin wang</a></span>
        </h1>
        <div
          className={`computeTagline${taglineExpanded ? ' computeTaglineExpanded' : ''}`}
          style={taglineFullHeight ? { '--tagline-full-h': `${taglineFullHeight}px` } : undefined}
        >
          <p ref={taglineInnerRef} className="computeTaglineInner">
            a structured, source-backed dataset of publicly disclosed ai ecosystem transactions across sovereign AI, hyperscaler capex, custom silicon, and the hardware providers behind them. last updated {BUILD_DATE_LABEL}. source data public repository{' '}
            <a href="https://github.com/jstwng/compute-deal-map-data" target="_blank" rel="noreferrer">here</a>.
          </p>
        </div>
        <button
          type="button"
          className="computeTaglineToggle"
          onClick={() => setTaglineExpanded(v => !v)}
        >
          {taglineExpanded ? 'less' : 'more'}
        </button>
      </header>

      <Toolbar
        search={filters.search}
        onSearch={handleSearch}
        traceOrigin={traceOrigin}
        traceDestination={traceDestination}
        reachableFromOrigin={reachableFromOrigin}
        tracePaths={visibleTracePaths}
        tracePathIndex={safePathIndex}
        tracePathBuckets={tracePathBuckets}
        tracePathLength={tracePathLength}
        onSelectTracePathLength={setTracePathLength}
        tracePathGroups={tracePathGroups}
        traceNoPath={traceNoPath}
        traceNoPathBoth={traceNoPathBoth}
        onChangeTraceOrigin={handleChangeTraceOrigin}
        onChangeTraceDestination={handleChangeTraceDestination}
        onSwapTrace={swapTrace}
        onClearTrace={handleClearTrace}
        onSelectTracePath={setTracePathIndex}
        timelineFrom={timelineRange.from}
        timelineTo={timelineRange.to}
        timelineCount={timelineDeals.length}
        onChangeTimeline={handleChangeTimeline}
        onClearTimeline={handleClearTimeline}
        clusterCategories={clusterCategories}
        clusterCount={clusterHighlightCount}
        onToggleCluster={handleToggleCluster}
        onClearCluster={handleClearCluster}
        pathEdgeTypes={pathEdgeTypes}
      />

      <section className={styles.section}>
        <div className="graphBlock" style={{ position: 'relative' }}>
          <Graph
            deals={filteredDeals}
            hoveredEdge={hoveredEdge}
            onHoverEdge={setHoveredEdge}
            hoveredNode={hoveredNode}
            onHoverNode={setHoveredNode}
            onScrollToRow={id => setScrollToDealId(id)}
            onRequestMaximize={isMobile ? undefined : () => setGraphMaximized(true)}
            onClickNode={openCompany}
            onClickEdge={openDeal}
            focusedNodes={focusedNodes}
            onFocusChange={setFocusedNodes}
            pathNodes={tracePathNodes}
            pathEdges={tracePathEdges}
            dimAll={false}
            activeNodeSet={activeNodeSet}
            activeEdgeSet={activeEdgeSet}
            highlightNodeSet={clusterHighlightSet}
          />
          <ProfilePanel
            content={panelContent}
            onClose={closePanel}
            onOpenCompany={openCompany}
            onScrollToRow={id => setScrollToDealId(id)}
            timelineRange={isTimelineActive ? timelineRange : null}
          />
        </div>
        {modalMounted && (
          <div
            className={`${styles.graphModalBackdrop}${modalOpen ? ' ' + styles.graphModalBackdropOpen : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Expanded graph view"
            onClick={() => setGraphMaximized(false)}
          >
            <div
              className={styles.graphModalFrame}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.graphModalToolbar}>
                <Toolbar
                  search={filters.search}
                  onSearch={handleSearch}
                  traceOrigin={traceOrigin}
                  traceDestination={traceDestination}
                  reachableFromOrigin={reachableFromOrigin}
                  tracePaths={visibleTracePaths}
                  tracePathIndex={safePathIndex}
                  tracePathBuckets={tracePathBuckets}
                  tracePathLength={tracePathLength}
                  onSelectTracePathLength={setTracePathLength}
                  tracePathGroups={tracePathGroups}
                  traceNoPath={traceNoPath}
                  traceNoPathBoth={traceNoPathBoth}
                  onChangeTraceOrigin={handleChangeTraceOrigin}
                  onChangeTraceDestination={handleChangeTraceDestination}
                  onSwapTrace={swapTrace}
                  onClearTrace={handleClearTrace}
                  onSelectTracePath={setTracePathIndex}
                  timelineFrom={timelineRange.from}
                  timelineTo={timelineRange.to}
                  timelineCount={timelineDeals.length}
                  onChangeTimeline={handleChangeTimeline}
                  onClearTimeline={handleClearTimeline}
                  clusterCategories={clusterCategories}
                  clusterCount={clusterHighlightCount}
                  onToggleCluster={handleToggleCluster}
                  onClearCluster={handleClearCluster}
                  pathEdgeTypes={pathEdgeTypes}
                />
                {(traceOrigin || traceDestination || isTimelineActive || clusterCategories.size > 0) && (
                  <button
                    type="button"
                    className={styles.graphModalClearAll}
                    onClick={handleClearAllFilters}
                  >
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  className={styles.graphModalClose}
                  onClick={() => setGraphMaximized(false)}
                  aria-label="Close expanded graph"
                >
                  <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M1 1 L11 11 M11 1 L1 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                  </svg>
                  <span>Close</span>
                </button>
              </div>
              <div className={styles.graphModalGraphSlot}>
                <Graph
                  deals={filteredDeals}
                  hoveredEdge={hoveredEdge}
                  onHoverEdge={setHoveredEdge}
                  hoveredNode={hoveredNode}
                  onHoverNode={setHoveredNode}
                  onScrollToRow={id => setScrollToDealId(id)}
                  pathNodes={tracePathNodes}
                  pathEdges={tracePathEdges}
                  dimAll={false}
                  activeNodeSet={activeNodeSet}
                  activeEdgeSet={activeEdgeSet}
                  highlightNodeSet={clusterHighlightSet}
                  isModal
                  maximizable={false}
                />
              </div>
            </div>
          </div>
        )}

        <h3 className={styles.sectionSubheader}>
          Transactions <span className={styles.sectionSubheaderHint}>tap a row to expand</span>
        </h3>
        <FilterBar filters={tableFilters} onChange={setTableFilters} />
        <DealTable
          deals={tableDeals}
          hoveredEdge={hoveredEdge}
          scrollToDealId={scrollToDealId}
          onHoverEdge={setHoveredEdge}
          onClickCompany={openCompany}
          onClickDeal={openDeal}
          banner={tableBanner}
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
