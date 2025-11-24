import styles from './styles.module.css'
import { DEAL_TYPES } from './data.js'

export default function CompanyCard({ company, deals, x, y, containerWidth, containerHeight, placement = 'below', onScrollToRow, onMouseEnter, onMouseLeave }) {
  if (!company) return null

  const cardWidth = 280
  // x/y are graph-wrapper coordinates. Clamp left so the card stays inside
  // the wrapper horizontally; let it extend vertically (overflow: visible).
  const w = containerWidth ?? Infinity
  const h = containerHeight ?? 0
  const left = Math.max(4, Math.min(x, w - cardWidth - 4))
  const style = placement === 'above'
    ? { left, bottom: Math.max(4, h - y) }
    : { left, top: Math.max(4, y) }

  return (
    <div
      className={styles.companyCard}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.companyCardHeader}>
        <span className={styles.companyCardName}>{company.name}</span>
        {company.ticker && <span className={styles.companyCardTicker}>{company.ticker}</span>}
      </div>
      {company.subline && <p className={styles.companyCardStat}>{company.subline}</p>}
      <ul className={styles.companyCardList}>
        {deals.map(d => (
          <li
            key={d.id}
            className={styles.companyCardDeal}
            onClick={() => onScrollToRow(d.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onScrollToRow(d.id) }}
          >
            <span className={styles.companyCardCounterparty}>{d.counterparty}</span>
            <span className={styles.companyCardDealMeta}>
              {' · '}{DEAL_TYPES[d.deal_type]?.label}
              {d.value_display ? ` · ${d.value_display}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
