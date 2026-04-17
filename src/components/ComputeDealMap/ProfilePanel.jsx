import { Fragment, useEffect, useMemo, useState } from 'react'
import styles from './styles.module.css'
import { DEAL_TYPES } from './data.js'
import Dropdown from './Dropdown.jsx'
import useMediaQuery from './useMediaQuery.js'

export default function ProfilePanel({
  content,
  onClose,
  onOpenCompany,
  onScrollToRow,
  timelineRange,
}) {
  // Keep last non-null content mounted through the slide-out animation so
  // there's something to paint while the close transition runs. Cleared
  // after the transition finishes.
  const [shownContent, setShownContent] = useState(null)
  const isMobile = useMediaQuery('(max-width: 767px)')

  useEffect(() => {
    if (content) {
      setShownContent(content)
      return
    }
    if (!shownContent) return
    const t = setTimeout(() => setShownContent(null), 320)
    return () => clearTimeout(t)
  }, [content, shownContent])

  useEffect(() => {
    if (!content) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [content, onClose])

  // On mobile the panel is a modal bottom sheet — lock page scroll while
  // it's open so the user only scrolls the panel's own contents.
  useEffect(() => {
    if (!content || !isMobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [content, isMobile])

  if (!shownContent) return null

  // Open animation is a CSS @keyframes that plays every time the
  // profilePanelOpen class is applied — no React rAF dance required.
  // Close animation is the transition on the base .profilePanel transform.
  const isOpen = !!content
  const panelClass = isOpen
    ? `${styles.profilePanel} ${styles.profilePanelOpen}`
    : styles.profilePanel

  return (
    <>
      {isMobile && (
        <div
          className={`${styles.profilePanelBackdrop}${isOpen ? ` ${styles.profilePanelBackdropOpen}` : ''}`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={panelClass}
        role="complementary"
        aria-hidden={!isOpen}
      >
        <div className={styles.profilePanelHeader}>
          <div className={styles.profilePanelDragBar} aria-hidden="true" />
          <button type="button" className={styles.profilePanelClose} onClick={onClose}>
            Close
          </button>
        </div>
        <div className={styles.profilePanelBody}>
          {shownContent.mode === 'company'
            ? <CompanyMode
                content={shownContent}
                onScrollToRow={onScrollToRow}
                timelineRange={timelineRange}
                isMobile={isMobile}
              />
            : <DealMode
                content={shownContent}
                onOpenCompany={onOpenCompany}
                onScrollToRow={onScrollToRow}
                timelineRange={timelineRange}
                isMobile={isMobile}
              />
          }
        </div>
      </aside>
    </>
  )
}

function PanelDealExpand({ isOpen, children }) {
  if (!isOpen) return null
  return (
    <tr className={styles.mobileTableExpandRow}>
      <td colSpan={3} className={styles.mobileTableExpandCell}>
        {children}
      </td>
    </tr>
  )
}

function CompanyMode({ content, onScrollToRow, timelineRange, isMobile }) {
  const { company, deals, counterpartyFilter, onSetCounterpartyFilter } = content
  const [expandedId, setExpandedId] = useState(null)
  const toggleExpanded = id => setExpandedId(prev => (prev === id ? null : id))

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

  return (
    <>
      <div>
        <div className={styles.profileIdentity}>
          <span className={styles.profileName}>{company.name}</span>
          {company.ticker && <span className={styles.profileTicker}>{company.ticker}</span>}
        </div>
        {company.description && (
          <>
            <p className={styles.profileDescription}>
              {company.description}
              {company.descriptionSource && (
                <>
                  {' '}
                  <a
                    className={styles.profileDescriptionSource}
                    href={company.descriptionSource}
                    target="_blank"
                    rel="noreferrer"
                  >
                    ↗
                  </a>
                </>
              )}
            </p>
            <hr className={styles.profilePanelDivider} />
          </>
        )}
      </div>

      {counterpartiesSorted.length > 0 && (() => {
        const counterpartyOptions = [
          { value: '__all__', label: `All (${deals.length})` },
          ...counterpartiesSorted.map(([name, count]) => ({
            value: name,
            label: `${name} (${count})`,
          })),
        ]
        const activeValue = counterpartyFilter ?? '__all__'
        return (
          <div className={styles.profileCounterpartyFilter}>
            <Dropdown
              label="Counterparty"
              options={counterpartyOptions}
              value={activeValue}
              onChange={v => onSetCounterpartyFilter(v === '__all__' ? null : v)}
              searchable
              panelMaxHeight={260}
            />
          </div>
        )
      })()}

      {deals.length > 0 && (
        <div>
          <div className={styles.profileSubhead}>
            Deals · {filteredDeals.length}
          </div>
          {isMobile ? (
            <table className={styles.mobileTable}>
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>Counterparty</th>
                  <th data-align="right" style={{ whiteSpace: 'nowrap' }}>Value</th>
                  <th data-align="right" style={{ whiteSpace: 'nowrap' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map(d => {
                  const otherParty = d.source === company.name ? d.target : d.source
                  const outOfRange = timelineRange && d.date && (
                    (timelineRange.from && d.date < timelineRange.from) ||
                    (timelineRange.to && d.date > timelineRange.to)
                  )
                  const expanded = expandedId === d.id
                  return (
                    <Fragment key={d.id}>
                      <tr
                        className={styles.clickableRow}
                        style={outOfRange ? { opacity: 0.3 } : undefined}
                        onClick={() => toggleExpanded(d.id)}
                      >
                        <td>{otherParty}</td>
                        <td className={styles.valueCell}>{d.value_display || ''}</td>
                        <td className={styles.valueCell}>{d.date_display || d.date}</td>
                      </tr>
                      <PanelDealExpand isOpen={expanded}>
                        <div className={styles.mobileTableExpandMeta}>
                          <span>{DEAL_TYPES[d.deal_type]?.label}</span>
                          {d.source_url && (
                            <a
                              className={styles.sourceLink}
                              href={d.source_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                            >↗</a>
                          )}
                        </div>
                        {d.description && <div className={styles.mobileTableExpandDesc}>{d.description}</div>}
                      </PanelDealExpand>
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          ) : (
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
                          ↗
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </>
  )
}

function DealMode({ content, onOpenCompany, onScrollToRow, timelineRange, isMobile }) {
  const { edge, deals } = content
  const [expandedId, setExpandedId] = useState(null)
  const toggleExpanded = id => setExpandedId(prev => (prev === id ? null : id))
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
        {isMobile ? (
          <table className={styles.mobileTable}>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Type</th>
                <th data-align="right" style={{ whiteSpace: 'nowrap' }}>Value</th>
                <th data-align="right" style={{ whiteSpace: 'nowrap' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {deals.map(d => {
                const outOfRange = timelineRange && d.date && d.date > timelineRange
                const expanded = expandedId === d.id
                return (
                  <Fragment key={d.id}>
                    <tr
                      className={styles.clickableRow}
                      style={outOfRange ? { opacity: 0.3 } : undefined}
                      onClick={() => toggleExpanded(d.id)}
                    >
                      <td>{DEAL_TYPES[d.deal_type]?.label}</td>
                      <td className={styles.valueCell}>{d.value_display || ''}</td>
                      <td className={styles.valueCell}>{d.date_display || d.date}</td>
                    </tr>
                    <PanelDealExpand isOpen={expanded}>
                      <div className={styles.mobileTableExpandMeta}>
                        {d.source_url && (
                          <a
                            className={styles.sourceLink}
                            href={d.source_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                          >↗</a>
                        )}
                      </div>
                      {d.description && <div className={styles.mobileTableExpandDesc}>{d.description}</div>}
                    </PanelDealExpand>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        ) : (
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
                        Source
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
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
