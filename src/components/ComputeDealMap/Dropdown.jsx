import { useEffect, useRef, useState } from 'react'
import useMediaQuery from './useMediaQuery.js'

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
  nativeOnMobile = false,
  // When true (default), the panel renders in-flow on mobile so it pushes
  // MobileFilterSheet content as it grows. Set false when the Dropdown lives
  // in page flow (e.g. FilterBar) so opening a panel overlays content below
  // instead of displacing the DealTable.
  inlineOnMobile = true,
  // When true, the trigger wrapper + button stretch to fill the parent's
  // width. Used by FilterBar so Deal type / Category each occupy a 50%
  // column on mobile and the value text gets ellipsis when squeezed.
  fill = false,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef(null)
  const isMobile = useMediaQuery('(max-width: 767px)')

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

  // Two-state mount. Panel uses the same cubic-bezier curve and 380ms
  // duration as the ProfilePanel slide so a dropdown opening inside the
  // mobile bottom sheet feels coordinated with the sheet's own growth.
  //
  // Open uses double rAF so the closed state (grid-template-rows: 0fr,
  // opacity: 0) is actually painted by the browser before we flip to the
  // open state. A single rAF races React's batched commit and the
  // transition never gets an initial frame, so the panel snaps open with
  // no animation while close looks fine. Two rAFs guarantee a paint of
  // the closed state in between, which makes open + close symmetrical.
  const [panelMounted, setPanelMounted] = useState(false)
  const [panelVisible, setPanelVisible] = useState(false)
  useEffect(() => {
    if (isOpen) {
      setPanelMounted(true)
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setPanelVisible(true))
      })
      return () => {
        cancelAnimationFrame(raf1)
        if (raf2) cancelAnimationFrame(raf2)
      }
    }
    setPanelVisible(false)
    const t = setTimeout(() => setPanelMounted(false), 400)
    return () => clearTimeout(t)
  }, [isOpen])

  const activeLabel = options?.find(o => o.value === value)?.label
  const display = displayValue ?? activeLabel ?? placeholder ?? ''

  const filtered = options
    ? (searchable && query
      ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
      : options)
    : []

  const useNative = nativeOnMobile && isMobile && Array.isArray(options) && options.length > 0 && !children

  if (useNative) {
    return (
      <label className="">
        <span className="" style={{ fontWeight: 700, fontSize: '14px', marginRight: '8px' }}>
          {label}:
        </span>
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          style={{
            height: '30px',
            minWidth: '120px',
            fontSize: '14px',
            color: 'var(--text)',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 0,
            padding: '0 8px',
            fontFamily: 'inherit',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            backgroundImage: 'none',
          }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: fill ? '100%' : undefined }}>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: isMobile ? '32px' : '27px',
          padding: '0 12px 0 8px',
          border: '1px solid var(--border)',
          borderRadius: 0,
          background: 'transparent',
          color: 'var(--text)',
          fontSize: isMobile ? '14px' : '12px',
          fontFamily: 'inherit',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          width: fill ? '100%' : undefined,
          minWidth: 0,
          justifyContent: fill ? 'flex-start' : undefined,
          overflow: 'hidden',
        }}
      >
        <span style={{ fontWeight: 700, flexShrink: 0 }}>{label}:</span>
        <span
          style={{
            fontWeight: 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {display}
        </span>
      </button>
      {panelMounted && (
        <div
          style={{
            // On mobile, render the options list inline (in flow) so it
            // pushes page/sheet content and scrolls naturally with the
            // parent container. Absolute positioning here would clip
            // inside the bottom-sheet or cut off below the viewport.
            // FilterBar opts out via inlineOnMobile=false so its panels
            // overlay the DealTable instead of pushing it down.
            position: isMobile && inlineOnMobile ? 'relative' : 'absolute',
            top: isMobile && inlineOnMobile ? 'auto' : '100%',
            left: isMobile && inlineOnMobile ? 'auto' : 0,
            marginTop: isMobile && inlineOnMobile ? '4px' : 0,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            zIndex: 1000,
            // Children-mode panels (Trace, Timeline, Cluster): let content
            // size the panel naturally — Timeline (two year selectors)
            // hugs ~180px while Trace can stretch up to the 420px cap for
            // long path lists. Drop the explicit min-width so each panel
            // matches its actual content footprint instead of padding to
            // a uniform width.
            minWidth: isMobile && inlineOnMobile
              ? '100%'
              : (panelMinWidth ?? (children ? undefined : '100%')),
            width: isMobile && inlineOnMobile ? '100%' : undefined,
            maxWidth: isMobile && inlineOnMobile
              ? 'none'
              : (children ? 'min(420px, calc(100vw - 32px))' : '320px'),
            boxSizing: 'border-box',
            // grid-template-rows: 0fr -> 1fr animates the INTRINSIC content
            // height symmetrically (no dead time on close), unlike max-height
            // with a fixed cap. Inner wrapper has overflow: hidden + min-height: 0
            // so content clips cleanly during the transition. Curve + duration
            // mirror the ProfilePanel slide so dropdowns inside the mobile
            // bottom sheet feel coordinated with the sheet's own resize.
            display: 'grid',
            gridTemplateRows: panelVisible ? '1fr' : '0fr',
            opacity: panelVisible ? 1 : 0,
            transition: 'grid-template-rows 380ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 280ms cubic-bezier(0.22, 0.61, 0.36, 1)',
            pointerEvents: panelVisible ? 'auto' : 'none',
          }}
        >
          <div style={{
            minHeight: 0,
            // Hidden during the close transition so content clips cleanly,
            // visible once the panel is fully open so nested elements (the
            // year search list inside Timeline, etc.) can show in full.
            overflow: panelVisible ? 'visible' : 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
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
                      fontSize: isMobile ? '14px' : '12px',
                      height: isMobile ? '34px' : '28px',
                      padding: '0 8px',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      outline: 'none',
                    }}
                  />
                )}
                <div style={{
                  // On mobile the panel lives inside the MobileFilterSheet's
                  // scrollable body — let the options list render at full
                  // content height and rely on the sheet body's scroll so
                  // every option is reachable without a nested scrollbar.
                  maxHeight: isMobile ? 'none' : panelMaxHeight,
                  overflowY: isMobile ? 'visible' : 'auto',
                  padding: '4px 0',
                }}>
                  {filtered.length === 0 ? (
                    <div style={{
                      padding: '8px 10px',
                      fontSize: isMobile ? '14px' : '12px',
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
                        padding: isMobile ? '8px 12px' : '4px 10px',
                        fontSize: isMobile ? '14px' : '12px',
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
        </div>
      )}
    </div>
  )
}
