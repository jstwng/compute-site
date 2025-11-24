import { useMemo } from 'react'
import styles from './styles.module.css'
import { DEALS } from './data.js'

function topEntities(deals, field, topN = 3) {
  const counts = new Map()
  for (const d of deals) {
    const e = d[field]
    counts.set(e, (counts.get(e) || 0) + 1)
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, topN)
  const othersCount = sorted.slice(topN).reduce((s, [, c]) => s + c, 0)
  const result = top.map(([name, count]) => ({ name, count }))
  if (othersCount > 0) result.push({ name: 'Others', count: othersCount, isOthers: true })
  return result
}

function colorFor(rank, isOthers) {
  if (isOthers) return 'var(--bar-others)'
  if (rank === 0) return 'var(--bar-rank1)'
  return 'var(--bar-rank-mid)'
}

function Column({ label, rows, onHoverNode }) {
  const max = Math.max(...rows.map(r => r.count))
  return (
    <div className={styles.concentrationColumn}>
      <div className={styles.concentrationLabel}>{label}</div>
      {rows.map((r, i) => {
        const pct = Math.min(100, (r.count / max) * 100)
        const interactive = !r.isOthers
        return (
          <div
            key={r.name}
            className={styles.barRow}
            style={interactive ? { cursor: 'pointer' } : undefined}
            onMouseEnter={() => interactive && onHoverNode?.(r.name)}
            onMouseLeave={() => interactive && onHoverNode?.(null)}
          >
            <span className={styles.barName}>{r.name}</span>
            <span className={styles.barTrack}>
              <span
                className={styles.barFill}
                style={{ width: `${pct}%`, background: colorFor(i, r.isOthers) }}
              />
            </span>
            <span className={styles.barCount}>{r.count}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function ConcentrationBars({ onHoverNode }) {
  const sellers = useMemo(() => topEntities(DEALS, 'source', 3), [])
  const buyers = useMemo(() => topEntities(DEALS, 'target', 3), [])
  return (
    <div className={styles.concentrationWrap}>
      <Column label="Sellers (by deal count)" rows={sellers} onHoverNode={onHoverNode} />
      <Column label="Buyers (by deal count)" rows={buyers} onHoverNode={onHoverNode} />
    </div>
  )
}
