import { useState } from 'react'
import Dropdown from './Dropdown.jsx'

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
  { value: 'foundry',       label: 'Foundry' },
  { value: 'memory',        label: 'Memory' },
  { value: 'equipment',     label: 'Equipment' },
  { value: 'packaging',     label: 'Packaging' },
  { value: 'networking',    label: 'Networking' },
  { value: 'server_oem',    label: 'Server OEMs' },
  { value: 'power',         label: 'Power' },
  { value: 'data_center',   label: 'Data Centers' },
  { value: 'neocloud',      label: 'Neoclouds' },
  { value: 'ai_lab',        label: 'AI Labs' },
  { value: 'hyperscaler',   label: 'Hyperscalers' },
  { value: 'investor',      label: 'Investors' },
]

export default function FilterBar({ filters, onChange }) {
  const set = (partial) => onChange({ ...filters, ...partial })
  const [openKey, setOpenKey] = useState(null)
  const toggle = key => ({
    isOpen: openKey === key,
    onOpenChange: v => setOpenKey(v ? key : null),
  })

  return (
    <div
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
      <div className="filterBarField">
        <Dropdown
          label="Deal type"
          options={DEAL_TYPE_OPTIONS}
          value={filters.dealType}
          onChange={v => set({ dealType: v })}
          inlineOnMobile={false}
          fill
          {...toggle('dealType')}
        />
      </div>
      <div className="filterBarField">
        <Dropdown
          label="Category"
          options={CATEGORY_OPTIONS}
          value={filters.category}
          onChange={v => set({ category: v })}
          inlineOnMobile={false}
          fill
          {...toggle('category')}
        />
      </div>
    </div>
  )
}
