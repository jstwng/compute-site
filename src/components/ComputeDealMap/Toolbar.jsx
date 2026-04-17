import { Fragment, useMemo, useState } from 'react'
import styles from './styles.module.css'
import Dropdown from './Dropdown.jsx'
import { COMPANIES, CATEGORIES } from './companies.js'
import { EARLIEST_DATE, LATEST_DATE, DEAL_TYPES } from './data.js'
import useMediaQuery from './useMediaQuery.js'
import MobileFilterSheet from './MobileFilterSheet.jsx'

const earliestYear = parseInt(EARLIEST_DATE.slice(0, 4), 10)
const latestYear = parseInt(LATEST_DATE.slice(0, 4), 10)

// Renders a path as a flow of company names separated by tight middot
// connectors. Each company stays on one line (white-space: nowrap on the
// node), but the connector emits a literal whitespace break opportunity
// so a 5-hop walk that exceeds the dropdown's 560px width breaks AT a
// connector boundary rather than overflowing the panel.
function PathPills({ nodes }) {
  return (
    <span className={styles.toolbarPathFlow}>
      {nodes.map((n, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <>
              {' '}
              <span className={styles.toolbarPathConnector} aria-hidden="true">·</span>
              {' '}
            </>
          )}
          <span className={styles.toolbarPathNode}>{n}</span>
        </Fragment>
      ))}
    </span>
  )
}

function yearToFrom(y) { return `${y}-01` }
function yearToTo(y) { return `${y}-12` }
function monthToYear(m) { return m ? parseInt(m.slice(0, 4), 10) : null }

export default function Toolbar({
  search,
  onSearch,
  // Trace
  traceOrigin,
  traceDestination,
  reachableFromOrigin,
  tracePaths,
  tracePathIndex,
  // Hop-count buckets [{ len, count }] sorted ascending. Drives the
  // chip strip that lets the user filter the path picker by hop count.
  tracePathBuckets,
  tracePathLength,
  onSelectTracePathLength,
  // Groups visible paths by value-chain shape (sequence of category tiers).
  // Each group: { shape, shapeLabel, paths, indices }. The `indices` array
  // maps each grouped path back to its position in the flat tracePaths
  // (i.e. tracePathIndex space) so the picker can stay in sync with the
  // graph highlight.
  tracePathGroups,
  traceNoPath,
  traceNoPathBoth,
  onChangeTraceOrigin,
  onChangeTraceDestination,
  onSwapTrace,
  onClearTrace,
  onSelectTracePath,
  // Timeline
  timelineFrom,
  timelineTo,
  timelineCount,
  onChangeTimeline,
  onClearTimeline,
  // Cluster
  clusterCategories,
  clusterCount,
  onToggleCluster,
  onClearCluster,
  // Path edge deal types
  pathEdgeTypes,
}) {
  const companyOptions = useMemo(
    () => [...COMPANIES]
      .map(c => ({ value: c.name, label: c.name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    []
  )

  const destinationOptions = useMemo(() => {
    if (!traceOrigin || !reachableFromOrigin) return companyOptions
    return companyOptions.filter(o => reachableFromOrigin.has(o.value))
  }, [traceOrigin, reachableFromOrigin, companyOptions])

  // The From dropdown only offers years up to the current To value;
  // the To dropdown only offers years at or after the current From value.
  // Recomputed on every render so the options stay in sync with the picks.
  const yearRangeOptions = (lo, hi) => {
    const out = []
    for (let y = lo; y <= hi; y++) out.push({ value: String(y), label: String(y) })
    return out
  }

  // Only one top-level dropdown is expanded at a time. Filters themselves
  // remain independent and can all stay active — just the panels are mutex.
  const [openKey, setOpenKey] = useState(null)
  const dropdownToggle = key => ({
    isOpen: openKey === key,
    onOpenChange: v => setOpenKey(v ? key : null),
  })

  const isMobile = useMediaQuery('(max-width: 767px)')
  const [mobileSheet, setMobileSheet] = useState(null)

  const clusterOptions = useMemo(() => {
    const present = new Set(COMPANIES.map(c => c.category))
    return [...present]
      .filter(slug => CATEGORIES[slug])
      .map(slug => ({ value: slug, label: CATEGORIES[slug].label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [])

  // Display strings for the three primary dropdown buttons.
  const traceDisplay = (() => {
    if (!traceOrigin && !traceDestination) return 'Off'
    if (traceOrigin && !traceDestination) return `${traceOrigin} to —`
    if (!traceOrigin && traceDestination) return `— to ${traceDestination}`
    return `${traceOrigin} to ${traceDestination}`
  })()

  const fromYear = monthToYear(timelineFrom) ?? earliestYear
  const toYear = monthToYear(timelineTo) ?? latestYear
  const isTimelineDefault = fromYear === earliestYear && toYear === latestYear
  const timelineDisplay = isTimelineDefault
    ? 'All years'
    : (fromYear === toYear ? `${fromYear}` : `${fromYear} to ${toYear}`)

  const clusterDisplay = (() => {
    if (!clusterCategories || clusterCategories.size === 0) return 'Off'
    if (clusterCategories.size === 1) {
      const [only] = clusterCategories
      return CATEGORIES[only]?.label || only
    }
    return `${clusterCategories.size} selected`
  })()

  // Hop-count chip strip. Renders one chip per available hop count plus
  // an "All" chip. Chips are click-to-filter; the active one is rendered
  // bolder. Hidden when there's at most one bucket (nothing to filter).
  const renderHopChips = () => {
    if (!tracePathBuckets || tracePathBuckets.length <= 1) return null
    const totalCount = tracePathBuckets.reduce((s, b) => s + b.count, 0)
    return (
      <div className={styles.toolbarHopChips}>
        <button
          type="button"
          className={tracePathLength == null ? styles.toolbarHopChipActive : styles.toolbarHopChip}
          onClick={() => onSelectTracePathLength?.(null)}
        >
          All <span className={styles.toolbarHopChipCount}>{totalCount}</span>
        </button>
        {tracePathBuckets.map(b => (
          <button
            key={b.len}
            type="button"
            className={tracePathLength === b.len ? styles.toolbarHopChipActive : styles.toolbarHopChip}
            onClick={() => onSelectTracePathLength?.(b.len)}
          >
            {b.len} {b.len === 1 ? 'hop' : 'hops'} <span className={styles.toolbarHopChipCount}>{b.count}</span>
          </button>
        ))}
      </div>
    )
  }

  const formatEdgeTypes = (source, target) => {
    if (!pathEdgeTypes) return ''
    const types = pathEdgeTypes.get(`${source}__${target}`)
    if (!types || types.length === 0) return ''
    return types.map(t => DEAL_TYPES[t]?.label || t).join(', ')
  }

  // Renders the path picker for either desktop dropdown or mobile sheet.
  // Paths are grouped by value-chain shape; each shape lists its specific
  // company routes as compact middot-separated rows. Click a row to mark
  // it active (drives graph highlight). No inline hop breakdown — deal
  // types per hop are visible by clicking the corresponding edge in the
  // graph itself.
  const renderPathPicker = () => {
    if (!tracePathGroups || tracePathGroups.length === 0) return null
    const totalPaths = tracePathGroups.reduce((s, g) => s + g.paths.length, 0)
    const showShapeHeaders = tracePathGroups.length > 1
    return (
      <div className={styles.toolbarPathList}>
        {tracePathGroups.map((group, gi) => (
          <div key={gi} className={styles.toolbarPathGroup}>
            {showShapeHeaders && (
              <div className={styles.toolbarPathShapeLabel}>
                {group.shapeLabel}
                <span className={styles.toolbarPathShapeCount}>
                  {group.paths.length}
                </span>
              </div>
            )}
            {group.paths.map((p, pi) => {
              const flatIdx = group.indices[pi]
              const isActive = flatIdx === tracePathIndex
              const isSelectable = totalPaths > 1
              const rowClass = [
                styles.toolbarPathRow,
                isActive ? styles.toolbarPathRowActive : '',
                isSelectable ? '' : styles.toolbarPathRowStatic,
              ].filter(Boolean).join(' ')
              return (
                <div key={flatIdx} className={styles.toolbarPathItem}>
                  {isSelectable ? (
                    <button
                      type="button"
                      className={rowClass}
                      onClick={() => onSelectTracePath(flatIdx)}
                    >
                      <PathPills nodes={p} />
                    </button>
                  ) : (
                    <div className={rowClass}>
                      <PathPills nodes={p} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarChips}>
        {isMobile ? (
          <>
            <button
              type="button"
              className={styles.toolbarMobileChip}
              onClick={() => setMobileSheet('trace')}
            >
              <span className={styles.toolbarMobileChipLabel}>Trace:</span>
              <span className={styles.toolbarMobileChipValue}>{traceDisplay}</span>
            </button>
            <button
              type="button"
              className={styles.toolbarMobileChip}
              onClick={() => setMobileSheet('timeline')}
            >
              <span className={styles.toolbarMobileChipLabel}>Timeline:</span>
              <span className={styles.toolbarMobileChipValue}>{timelineDisplay}</span>
            </button>
            <button
              type="button"
              className={styles.toolbarMobileChip}
              onClick={() => setMobileSheet('cluster')}
            >
              <span className={styles.toolbarMobileChipLabel}>Cluster:</span>
              <span className={styles.toolbarMobileChipValue}>{clusterDisplay}</span>
            </button>
          </>
        ) : (
          <>
            {/* TRACE dropdown */}
            <Dropdown label="Trace" displayValue={traceDisplay} {...dropdownToggle('trace')}>
              <div className={styles.toolbarPanelInner}>
                <div className={styles.toolbarPanelRow}>
                  <Dropdown
                    label="From"
                    options={companyOptions}
                    value={traceOrigin}
                    onChange={onChangeTraceOrigin}
                    searchable
                    placeholder="—"
                    panelMaxHeight={260}
                  />
                  <Dropdown
                    label="To"
                    options={destinationOptions}
                    value={traceDestination}
                    onChange={onChangeTraceDestination}
                    searchable
                    placeholder="—"
                    panelMaxHeight={260}
                  />
                </div>
                {renderHopChips()}
                {renderPathPicker()}
                {(traceOrigin || traceDestination) && (
                  <div className={styles.toolbarPanelActions}>
                    {traceNoPath && (
                      <button type="button" className={styles.toolbarPanelLink} onClick={onSwapTrace}>Swap</button>
                    )}
                    <button type="button" className={styles.toolbarPanelLink} onClick={onClearTrace}>Clear</button>
                  </div>
                )}
              </div>
            </Dropdown>

            {/* TIMELINE dropdown */}
            <Dropdown label="Timeline" displayValue={timelineDisplay} {...dropdownToggle('timeline')}>
              <div className={styles.toolbarPanelInner}>
                <div className={styles.toolbarPanelRow}>
                  <Dropdown
                    label="From"
                    options={yearRangeOptions(earliestYear, toYear)}
                    value={String(fromYear)}
                    onChange={v => {
                      const next = parseInt(v, 10)
                      onChangeTimeline({ from: yearToFrom(next), to: yearToTo(toYear) })
                    }}
                    panelMaxHeight={240}
                  />
                  <Dropdown
                    label="To"
                    options={yearRangeOptions(fromYear, latestYear)}
                    value={String(toYear)}
                    onChange={v => {
                      const next = parseInt(v, 10)
                      onChangeTimeline({ from: yearToFrom(fromYear), to: yearToTo(next) })
                    }}
                    panelMaxHeight={240}
                  />
                </div>
                {!isTimelineDefault && (
                  <div className={styles.toolbarPanelActions}>
                    <button type="button" className={styles.toolbarPanelLink} onClick={onClearTimeline}>Reset</button>
                  </div>
                )}
              </div>
            </Dropdown>

            {/* CLUSTER dropdown — multi-select */}
            <Dropdown label="Cluster" displayValue={clusterDisplay} {...dropdownToggle('cluster')}>
              <div className={styles.toolbarPanelInner}>
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
                  <div className={styles.toolbarPanelActions}>
                    <button type="button" className={styles.toolbarPanelLink} onClick={onClearCluster}>Clear</button>
                  </div>
                )}
              </div>
            </Dropdown>
          </>
        )}
      </div>
      <input
        className={styles.toolbarSearch}
        type="text"
        placeholder="Search companies, deals, categories"
        value={search}
        onChange={e => onSearch(e.target.value)}
      />
      {isMobile && (
        <>
          <MobileFilterSheet
            isOpen={mobileSheet === 'trace'}
            title="Trace"
            onClose={() => setMobileSheet(null)}
          >
            <Dropdown
              label="From"
              options={companyOptions}
              value={traceOrigin}
              onChange={onChangeTraceOrigin}
              placeholder="—"
              searchable
            />
            <Dropdown
              label="To"
              options={destinationOptions}
              value={traceDestination}
              onChange={onChangeTraceDestination}
              placeholder="—"
              searchable
            />
            {renderHopChips()}
            {renderPathPicker()}
            {(traceOrigin || traceDestination) && (
              <div className={styles.toolbarPanelActions}>
                {traceNoPath && (
                  <button type="button" className={styles.toolbarPanelLink} onClick={onSwapTrace}>Swap</button>
                )}
                <button type="button" className={styles.toolbarPanelLink} onClick={onClearTrace}>Clear</button>
              </div>
            )}
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
              searchable
            />
            <Dropdown
              label="To"
              options={yearRangeOptions(fromYear, latestYear)}
              value={String(toYear)}
              onChange={(v) => {
                const next = parseInt(v, 10)
                onChangeTimeline({ from: yearToFrom(fromYear), to: yearToTo(next) })
              }}
              searchable
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
        </>
      )}
    </div>
  )
}

