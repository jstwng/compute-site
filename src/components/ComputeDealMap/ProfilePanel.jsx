import { useEffect, useMemo } from 'react'
import styles from './styles.module.css'
import { DEAL_TYPES } from './data.js'

export default function ProfilePanel({
  content,
  onClose,
  onOpenCompany,
  onScrollToRow,
  onFocusCompany,
  timelineRange,
}) {
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
          ? <CompanyMode
              content={content}
              onScrollToRow={onScrollToRow}
              onFocusCompany={onFocusCompany}
              timelineRange={timelineRange}
            />
          : <DealMode
              content={content}
              onOpenCompany={onOpenCompany}
              onScrollToRow={onScrollToRow}
              timelineRange={timelineRange}
            />
        }
      </div>
    </aside>
  )
}

function CompanyMode({ content, onScrollToRow, onFocusCompany, timelineRange }) {
  const { company, aggregates, deals, counterpartyFilter, onSetCounterpartyFilter } = content

  const counterpartiesSorted = useMemo(() => {
    const counts = new Map()
    for (const d of deals) {
      const other = d.source === company.name ? d.target : d.source
      if (!other || other === company.name) continue
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

  const counterpartyCount = aggregates.counterparties.size

  return (
    <>
      <div>
        <div className={styles.profileIdentity}>
          <span className={styles.profileName}>{company.name}</span>
          {company.ticker && <span className={styles.profileTicker}>{company.ticker}</span>}
        </div>
        <div className={styles.profileMeta}>
          {aggregates.totalDeals} deals · {counterpartyCount} counterparties{yearRange ? ` · ${yearRange}` : ''}
        </div>
        {aggregates.topDealTypes.length > 0 && (
          <div className={styles.profileMeta}>
            {aggregates.topDealTypes
              .map(t => DEAL_TYPES[t]?.label?.toLowerCase() ?? t.replace(/_/g, ' '))
              .join(', ')}
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

      {counterpartiesSorted.length > 0 && (
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
      )}

      {deals.length > 0 && (
        <div>
          <div className={styles.profileSubhead}>
            {counterpartyFilter
              ? <>Deals with {counterpartyFilter} · {filteredDeals.length}</>
              : <>Deals · {filteredDeals.length}</>}
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
              const outOfRange = timelineRange && d.date && (
                (timelineRange.from && d.date < timelineRange.from) ||
                (timelineRange.to && d.date > timelineRange.to)
              )
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
      )}
    </>
  )
}

function DealMode({ content, onOpenCompany, onScrollToRow, timelineRange }) {
  const { edge, deals } = content
  const disclosed = deals.filter(d => d.value_billions != null)
  const totalValue = disclosed.reduce((s, d) => s + (d.value_billions || 0), 0)
  const aggregateLine = deals.length > 1
    ? `${deals.length} deals${disclosed.length ? ` · $${totalValue.toFixed(1)}B aggregate` : ''}`
    : null

  const dealTypes = [...new Set(
    deals.map(d => DEAL_TYPES[d.deal_type]?.label).filter(Boolean)
  )]

  return (
    <>
      <div>
        <div className={styles.profileIdentity}>
          <span className={styles.profileName}>{edge.source} and {edge.target}</span>
        </div>
        {dealTypes.length > 0 && (
          <div className={styles.profileMeta}>{dealTypes.join(', ')}</div>
        )}
        {aggregateLine && <div className={styles.profileMeta}>{aggregateLine}</div>}
      </div>

      <div>
        <div className={styles.profileSubhead}>Deals · {deals.length}</div>
        <ul className={styles.profileDealList}>
          {deals.map(d => {
            const outOfRange = timelineRange && d.date && d.date > timelineRange
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
        <div className={styles.profileJumpRow}>
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
