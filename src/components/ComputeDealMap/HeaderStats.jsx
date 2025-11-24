import styles from './styles.module.css'
import { DEALS } from './data.js'
import { computeStats } from './logic.js'

const stats = computeStats(DEALS)

const ITEMS = [
  { value: `${stats.total}`, label: 'deals' },
  { value: `${stats.disclosedDisplay}`, label: 'disclosed' },
  { value: `Largest: ${stats.largestDisplay}`, label: stats.largest ? `(${stats.largest.source} → ${stats.largest.target})` : '' },
  { value: `Top seller: ${stats.seller.value}`, label: `(${stats.seller.count})` },
  { value: `Top buyer: ${stats.buyer.value}`, label: `(${stats.buyer.count})` },
  { value: '~16.5M H100-eq', label: 'compute stock', link: 'https://epoch.ai/data/ai-chip-sales', linkLabel: 'Epoch AI' },
  { value: stats.dateRange, label: '' },
]

export default function HeaderStats() {
  return (
    <dl className={styles.statsStrip}>
      {ITEMS.map((it, i) => (
        <span key={i} className={styles.statsItem}>
          {i > 0 && <span className={styles.statsDivider}>·</span>}
          <span className={styles.statsValue}>{it.value}</span>
          {it.label && <span className={styles.statsLabel}>{' '}{it.label}</span>}
          {it.link && (
            <span className={styles.statsLabel}>
              {' '}(<a href={it.link} target="_blank" rel="noreferrer" className={styles.statsLink}>{it.linkLabel}</a>)
            </span>
          )}
        </span>
      ))}
    </dl>
  )
}
