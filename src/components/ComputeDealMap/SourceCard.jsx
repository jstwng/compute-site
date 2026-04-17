import styles from './styles.module.css'

// Mobile card-list row for the Data Sources section. 2 lines:
//   1. publisher · date   + source ↗ on the right
//   2. article title (truncated)
export default function SourceCard({ row }) {
  const hasUrl = Boolean(row.url)

  const body = (
    <>
      <div className={styles.sourceCardMobileLine1}>
        <span className={styles.sourceCardMobileMeta}>
          {row.source && <span>{row.source}</span>}
          {row.source && row.date && <span className={styles.sourceCardMobileMetaDot}> · </span>}
          {row.date && <span>{row.date}</span>}
        </span>
        {hasUrl && <span className={styles.sourceCardMobileArrow} aria-hidden="true">↗</span>}
      </div>
      {row.article && (
        <div className={styles.sourceCardMobileLine2}>{row.article}</div>
      )}
    </>
  )

  const className = styles.sourceCardMobile

  if (hasUrl) {
    return (
      <a
        className={className}
        href={row.url}
        target="_blank"
        rel="noreferrer"
      >
        {body}
      </a>
    )
  }
  return <div className={className}>{body}</div>
}
