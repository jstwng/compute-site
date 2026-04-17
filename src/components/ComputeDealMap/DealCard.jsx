import styles from './styles.module.css'
import { DEAL_TYPES } from './data.js'

// Mobile card-list row for the Transactions table. Renders 3 lines:
//   1. source → target (primary, weight 600)
//   2. type · value · date (meta, muted)      + source ↗ on the right
//   3. description (muted, 1-line ellipsis)
//
// Tap the card body → onClickDeal({source, target}) opens the deal panel.
// Tap a company name → onClickCompany(name) opens the company panel.
export default function DealCard({ deal: d, onClickDeal, onClickCompany, highlighted }) {
  const typeLabel = DEAL_TYPES[d.deal_type]?.label || d.deal_type
  const metaParts = [typeLabel, d.value_display, d.date_display].filter(Boolean)

  const handleCompany = (name) => (e) => {
    e.stopPropagation()
    onClickCompany?.(name)
  }

  return (
    <div
      className={[
        styles.dealCardMobile,
        highlighted ? styles.dealCardMobileHighlighted : '',
      ].filter(Boolean).join(' ')}
      role="button"
      tabIndex={0}
      aria-label={`${d.source} to ${d.target}: ${typeLabel}`}
      onClick={() => onClickDeal?.({ source: d.source, target: d.target })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClickDeal?.({ source: d.source, target: d.target })
        }
      }}
    >
      <div className={styles.dealCardMobileLine1}>
        <span
          className={styles.dealCardMobileCompany}
          role="link"
          tabIndex={0}
          onClick={handleCompany(d.source)}
        >{d.source}</span>
        <span className={styles.dealCardMobileArrow}> to </span>
        <span
          className={styles.dealCardMobileCompany}
          role="link"
          tabIndex={0}
          onClick={handleCompany(d.target)}
        >{d.target}</span>
      </div>
      <div className={styles.dealCardMobileLine2}>
        <span>{metaParts.join(' · ')}</span>
        {d.source_url && (
          <a
            className={styles.dealCardMobileSource}
            href={d.source_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Open source"
          >↗</a>
        )}
      </div>
      {d.description && (
        <div className={styles.dealCardMobileLine3}>{d.description}</div>
      )}
    </div>
  )
}
