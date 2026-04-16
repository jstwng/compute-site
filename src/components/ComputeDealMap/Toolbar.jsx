import { useMemo, useState } from 'react'
import styles from './styles.module.css'
import Dropdown from './Dropdown.jsx'
import { COMPANIES, CATEGORIES } from './companies.js'
import { EARLIEST_DATE, LATEST_DATE, DEAL_TYPES } from './data.js'

const earliestYear = parseInt(EARLIEST_DATE.slice(0, 4), 10)
const latestYear = parseInt(LATEST_DATE.slice(0, 4), 10)

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

  const formatEdgeTypes = (source, target) => {
    if (!pathEdgeTypes) return ''
    const types = pathEdgeTypes.get(`${source}__${target}`)
    if (!types || types.length === 0) return ''
    return types.map(t => DEAL_TYPES[t]?.label || t).join(', ')
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarChips}>
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
            {tracePaths && tracePaths.length > 0 && (
              <div className={styles.toolbarPathList}>
                {tracePaths.map((p, i) => {
                  const isActive = i === tracePathIndex
                  const isSelectable = tracePaths.length > 1
                  const hasMultipleEdges = p.length > 2
                  const label = `Path ${i + 1}: ${p.join(' to ')}`
                  return (
                    <div key={i} className={styles.toolbarPathItem}>
                      {isSelectable ? (
                        <button
                          type="button"
                          className={isActive ? styles.toolbarPathRowActive : styles.toolbarPathRow}
                          onClick={() => onSelectTracePath(i)}
                        >
                          {label}
                        </button>
                      ) : (
                        <div className={styles.toolbarPathRowActive}>{label}</div>
                      )}
                      {isActive && hasMultipleEdges && (
                        <ul className={styles.toolbarPathEdges}>
                          {p.slice(0, -1).map((n, idx) => {
                            const nextNode = p[idx + 1]
                            const edgeTypes = formatEdgeTypes(n, nextNode)
                            return (
                              <li key={idx}>
                                <span className={styles.toolbarPathEdgeHop}>{n} to {nextNode}</span>
                                {edgeTypes && (
                                  <span className={styles.toolbarPathEdgeType}> — {edgeTypes}</span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
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
      </div>
      <input
        className={styles.toolbarSearch}
        type="text"
        placeholder="Search companies, deals, categories"
        value={search}
        onChange={e => onSearch(e.target.value)}
      />
    </div>
  )
}

