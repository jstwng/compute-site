import { useEffect, useMemo, useState } from 'react'
import styles from './styles.module.css'
import { DEAL_TYPES } from './data.js'
import { sortDeals } from './logic.js'
import useMediaQuery from './useMediaQuery.js'
import DealCard from './DealCard.jsx'

const PAGE_SIZE = 20

const COLUMNS = [
  { id: 'source',         label: 'Source',     nowrap: true },
  { id: 'target',         label: 'Target',     nowrap: true },
  { id: 'deal_type',      label: 'Deal Type',  nowrap: true },
  { id: 'value_billions', label: 'Value',      align: 'right', nowrap: true },
  { id: 'date',           label: 'Date',       nowrap: true },
  { id: 'description',    label: 'Description' },
  { id: 'source_url',     label: 'Source',     align: 'center' },
]

export default function DealTable({ deals, hoveredEdge, scrollToDealId, onHoverEdge, onClickCompany, onClickDeal, banner }) {
  const [sort, setSort] = useState({ column: 'value_billions', direction: 'desc' })
  const [flashedId, setFlashedId] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const isMobile = useMediaQuery('(max-width: 767px)')

  const sorted = useMemo(() => sortDeals(deals, sort), [deals, sort])
  const visible = sorted.slice(0, visibleCount)
  const hoverKey = hoveredEdge ? `${hoveredEdge.source}__${hoveredEdge.target}` : null

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [deals])

  useEffect(() => {
    if (!scrollToDealId) return
    const row = document.querySelector(`tr[data-deal-id="${scrollToDealId}"]`)
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setFlashedId(scrollToDealId)
      const t = setTimeout(() => setFlashedId(null), 1400)
      return () => clearTimeout(t)
    }
  }, [scrollToDealId])

  const toggleSort = (col) => {
    if (sort.column === col) {
      setSort({ column: col, direction: sort.direction === 'asc' ? 'desc' : 'asc' })
    } else {
      setSort({ column: col, direction: col === 'value_billions' ? 'desc' : 'asc' })
    }
  }

  return (
    <div className={styles.tableWrap}>
      {banner && <div className={styles.tableBanner}>{banner}</div>}
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
      {!isMobile && (
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map(c => (
                <th
                  key={c.id}
                  onClick={() => toggleSort(c.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleSort(c.id) }}
                  data-align={c.align}
                  tabIndex={0}
                  scope="col"
                  aria-sort={sort.column === c.id ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                  style={{
                    ...(c.width ? { width: c.width } : {}),
                    ...(c.nowrap ? { whiteSpace: 'nowrap' } : {}),
                  }}
                >
                  {c.label}
                  {sort.column === c.id && (
                    <span className={styles.sortIndicator}>
                      {sort.direction === 'asc' ? ' \u2191' : ' \u2193'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(d => {
              const dealKey = `${d.source}__${d.target}`
              const highlighted = hoverKey === dealKey
              const flashing = flashedId === d.id
              const type = DEAL_TYPES[d.deal_type]
              const description = d.description?.endsWith('.') ? d.description : `${d.description ?? ''}.`
              return (
                <tr
                  key={d.id}
                  data-deal-id={d.id}
                  className={[
                    flashing ? styles.flashRow : '',
                    highlighted ? styles.highlighted : '',
                    styles.clickableRow,
                  ].filter(Boolean).join(' ')}
                  onMouseEnter={() => onHoverEdge?.({ source: d.source, target: d.target })}
                  onMouseLeave={() => onHoverEdge?.(null)}
                  onClick={() => onClickDeal?.({ source: d.source, target: d.target })}
                >
                  <td>
                    {onClickCompany ? (
                      <span
                        className={styles.companyNameLink}
                        onClick={e => { e.stopPropagation(); onClickCompany(d.source) }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onClickCompany(d.source) } }}
                      >
                        {d.source}
                      </span>
                    ) : d.source}
                  </td>
                  <td>
                    {d.source === d.target ? <span className={styles.fundingDash}>—</span> : (
                      onClickCompany ? (
                        <span
                          className={styles.companyNameLink}
                          onClick={e => { e.stopPropagation(); onClickCompany(d.target) }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onClickCompany(d.target) } }}
                        >
                          {d.target}
                        </span>
                      ) : d.target
                    )}
                  </td>
                  <td>
                    <span className={styles.dealTypePill}>
                      {type.label}
                    </span>
                  </td>
                  <td className={styles.valueCell}>{d.value_display}</td>
                  <td>{d.date_display}</td>
                  <td className={styles.descCell}>
                    <div className={styles.descTextTruncated}>
                      {description}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <a className={styles.sourceLink} href={d.source_url} target="_blank" rel="noreferrer">↗</a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {sorted.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: 0,
          fontSize: '12px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '6px 12px',
          }}>
            {sorted.length > visibleCount && (() => {
              const remaining = sorted.length - visibleCount
              const nextChunk = Math.min(PAGE_SIZE, remaining)
              return (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => setVisibleCount(prev => prev + nextChunk)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setVisibleCount(prev => prev + nextChunk) }}
                  style={{ cursor: 'pointer', fontWeight: 400, color: 'var(--text)' }}
                >
                  Show {nextChunk} more
                </span>
              )
            })()}
            <span style={{ color: 'var(--text-muted)' }}>
              Showing {Math.min(visibleCount, sorted.length) === sorted.length
                ? `all ${sorted.length}`
                : `1-${Math.min(visibleCount, sorted.length)} of ${sorted.length}`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
