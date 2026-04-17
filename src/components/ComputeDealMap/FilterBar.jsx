import { useState, useEffect, useRef } from 'react'
import useMediaQuery from './useMediaQuery.js'

const DEAL_TYPE_OPTIONS = [
  { value: 'all',                label: 'All Deals' },
  { value: 'gpu_purchase',       label: 'GPU Purchase' },
  { value: 'custom_asic',        label: 'Custom ASIC' },
  { value: 'equity_investment',  label: 'Equity Investment' },
  { value: 'cloud_capacity',     label: 'Cloud Capacity' },
  { value: 'm_and_a',            label: 'M&A' },
  { value: 'funding_round',      label: 'Funding Round' },
]

const CATEGORY_OPTIONS = [
  { value: 'all',           label: 'All Categories' },
  { value: 'chip_designer', label: 'Chip Designers' },
  { value: 'hyperscaler',   label: 'Hyperscalers' },
  { value: 'neocloud_ai',   label: 'Neoclouds & AI Labs' },
]

function DropdownFilter({ label, options, value, onChange, isOpen, onToggle }) {
  const activeLabel = options.find(o => o.value === value)?.label || ''
  const isMobile = useMediaQuery('(max-width: 767px)')

  // Two-state mount. Panel uses the same max-height + opacity transition
  // as the mobile table row expand/collapse (see .mobileTableExpandInner
  // in styles.module.css): 240ms on max-height, 200ms on opacity.
  const [panelMounted, setPanelMounted] = useState(false)
  const [panelVisible, setPanelVisible] = useState(false)
  useEffect(() => {
    if (isOpen) {
      setPanelMounted(true)
      const raf = requestAnimationFrame(() => setPanelVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setPanelVisible(false)
    const t = setTimeout(() => setPanelMounted(false), 340)
    return () => clearTimeout(t)
  }, [isOpen])

  return (
    <div className="filterBarField" style={{ position: 'relative' }}>
      <button
        type="button"
        className="filterBarButton"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '27px',
          padding: '0 40px 0 8px',
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
        <span style={{ fontWeight: 400 }}>{activeLabel}</span>
      </button>
      {panelMounted && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 0,
          border: '1px solid var(--border)',
          background: 'var(--bg, #000)',
          zIndex: 1000,
          minWidth: '100%',
          boxSizing: 'border-box',
          // grid-template-rows 0fr <-> 1fr animates the actual content
          // height symmetrically (no close-time dead zone).
          display: 'grid',
          gridTemplateRows: panelVisible ? '1fr' : '0fr',
          opacity: panelVisible ? 1 : 0,
          transition: 'grid-template-rows 320ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 260ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          pointerEvents: panelVisible ? 'auto' : 'none',
        }}>
          <div style={{
            minHeight: 0,
            overflow: 'hidden',
            padding: '4px 0',
          }}>
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
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
        </div>
      )}
    </div>
  )
}

export default function FilterBar({ filters, onChange }) {
  const set = (partial) => onChange({ ...filters, ...partial })
  const [openDropdown, setOpenDropdown] = useState(null)
  const barRef = useRef(null)

  useEffect(() => {
    if (!openDropdown) return
    const handleOutsideClick = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [openDropdown])

  return (
    <div
      ref={barRef}
      className="filterBar"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '8px',
        padding: 0,
        width: '100%',
      }}
    >
      <DropdownFilter
        label="Deal type"
        options={DEAL_TYPE_OPTIONS}
        value={filters.dealType}
        onChange={v => { set({ dealType: v }); setOpenDropdown(null) }}
        isOpen={openDropdown === 'dealType'}
        onToggle={() => setOpenDropdown(openDropdown === 'dealType' ? null : 'dealType')}
      />
      <DropdownFilter
        label="Category"
        options={CATEGORY_OPTIONS}
        value={filters.category}
        onChange={v => { set({ category: v }); setOpenDropdown(null) }}
        isOpen={openDropdown === 'category'}
        onToggle={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
      />
    </div>
  )
}
