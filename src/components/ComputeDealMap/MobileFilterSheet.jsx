import { useEffect, useState } from 'react'
import styles from './styles.module.css'

// Full-screen bottom-sheet wrapper for mobile filter content.
// Pass `isOpen`, `title`, `onClose`, and children (the filter controls).
// Closes on Escape or Done button tap.
//
// Mirrors the ProfilePanel close pattern: keeps the sheet mounted through
// the slide-down transition by tracking `mounted` separately from `isOpen`,
// then unmounts after the transition completes. Open uses a keyframe; close
// rides the base transform transition when the open class is removed.
export default function MobileFilterSheet({ isOpen, title, onClose, children }) {
  const [mounted, setMounted] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      return
    }
    if (!mounted) return
    const t = setTimeout(() => setMounted(false), 400)
    return () => clearTimeout(t)
  }, [isOpen, mounted])

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

  if (!mounted) return null

  const backdropClass = isOpen
    ? `${styles.mobileFilterBackdrop} ${styles.mobileFilterBackdropOpen}`
    : styles.mobileFilterBackdrop
  const sheetClass = isOpen
    ? `${styles.mobileFilterSheet} ${styles.mobileFilterSheetOpen}`
    : styles.mobileFilterSheet

  return (
    <div
      className={backdropClass}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className={sheetClass}>
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
