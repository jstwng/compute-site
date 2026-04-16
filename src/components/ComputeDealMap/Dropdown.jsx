import { useEffect, useRef, useState } from 'react'

// Single-select dropdown matching the visual style of the existing
// FilterBar dropdowns (Deal type / Category).
//
// Two render modes:
//  - default (when `options` is given): renders an options list inside the
//    panel, click an option to call `onChange(value)`
//  - children mode (when `children` is given): renders custom JSX inside the
//    panel (used for Trace and Timeline which contain nested sub-dropdowns)
//
// `searchable` adds a search filter input above the options list.
export default function Dropdown({
  label,
  options,
  value,
  onChange,
  searchable = false,
  placeholder = '',
  displayValue,
  panelMaxHeight = 280,
  panelMinWidth,
  children,
  // Controlled open state. When provided, parent coordinates which dropdown
  // is open (used by Toolbar to ensure at most one of Trace/Timeline/Cluster
  // is open at a time while letting their underlying filter states stay
  // independent). When omitted, Dropdown manages its own open state.
  isOpen: controlledOpen,
  onOpenChange,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef(null)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen
  const setIsOpen = next => {
    const resolved = typeof next === 'function' ? next(isOpen) : next
    if (!isControlled) setUncontrolledOpen(resolved)
    onOpenChange?.(resolved)
  }

  useEffect(() => {
    if (!isOpen) { setQuery(''); return }
    const handleOutsideClick = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const activeLabel = options?.find(o => o.value === value)?.label
  const display = displayValue ?? activeLabel ?? placeholder ?? ''

  const filtered = options
    ? (searchable && query
      ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
      : options)
    : []

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '27px',
          padding: '0 12px 0 8px',
          border: '1px solid var(--border)',
          borderRadius: 0,
          background: 'transparent',
          color: 'var(--text)',
          fontSize: '12px',
          fontFamily: 'inherit',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontWeight: 700 }}>{label}:</span>
        <span style={{ fontWeight: 400 }}>{display}</span>
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 0,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            zIndex: 1000,
            minWidth: panelMinWidth ?? (children ? 'max-content' : '100%'),
            width: children ? 'max-content' : undefined,
            maxWidth: children ? 'none' : '320px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children ? children : (
            <>
              {searchable && (
                <input
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{
                    font: 'inherit',
                    fontSize: '12px',
                    height: '28px',
                    padding: '0 8px',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                />
              )}
              <div style={{ maxHeight: panelMaxHeight, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <div style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                  }}>
                    No matches
                  </div>
                ) : filtered.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                      setQuery('')
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      fontWeight: opt.value === value ? 700 : 400,
                      color: 'var(--text)',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
