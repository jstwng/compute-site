import { useEffect } from 'react'
import styles from './styles.module.css'

// Full-screen bottom-sheet wrapper for mobile filter content.
// Pass `isOpen`, `title`, `onClose`, and children (the filter controls).
// Closes on Escape or Done button tap.
export default function MobileFilterSheet({ isOpen, title, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className={styles.mobileFilterBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className={styles.mobileFilterSheet}>
        <div className={styles.mobileFilterHeader}>
          <h3 className={styles.mobileFilterTitle}>{title}</h3>
          <button
            type="button"
            className={styles.mobileFilterDone}
            onClick={onClose}
          >Done</button>
        </div>
        <div className={styles.mobileFilterBody}>
          {children}
        </div>
      </div>
    </div>
  )
}
