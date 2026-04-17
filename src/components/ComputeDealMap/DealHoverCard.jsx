import styles from './styles.module.css'
import { DEAL_TYPES } from './data.js'

export default function DealHoverCard({ edge, x, y, containerWidth, containerHeight }) {
  if (!edge) return null
  const disclosed = edge.deals.filter(d => d.value_billions != null)
  const totalDisplay = disclosed.length === 0
    ? 'Undisclosed'
    : `$${edge.totalValue.toFixed(1)}B across ${edge.deals.length} deal${edge.deals.length > 1 ? 's' : ''}`
  const cardWidth = 320
  const w = containerWidth ?? Infinity
  // Flip horizontally if it would overflow right, otherwise place to the
  // right of the anchor. Vertical position tracks the anchor; allow card
  // to extend below the wrapper since overflow is visible.
  const left = x + 12 + cardWidth > w ? Math.max(4, x - cardWidth - 12) : x + 12
  const top = Math.max(4, y - 8)
  return (
    <div className={styles.dealCard} style={{ left, top }}>
      <h4 className={styles.dealCardTitle}>{edge.source} · {edge.target}</h4>
      <p className={styles.dealCardAggregate}>Aggregate: {totalDisplay}</p>
      <ul className={styles.dealCardList}>
        {edge.deals.map(d => (
          <li key={d.id}>
            <strong>{DEAL_TYPES[d.deal_type].label} &mdash; {d.value_display}</strong>
            {' '}({d.date_display})<br />
            {d.description}{' '}
            {d.source_url && (
              <a className={styles.dealCardLink} href={d.source_url} target="_blank" rel="noreferrer">↗</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
