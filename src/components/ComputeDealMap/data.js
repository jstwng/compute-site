import rawDeals from './data.generated.json'
import { COMPANIES } from './companies.js'

export const DEAL_TYPES = {
  gpu_purchase:      { label: 'GPU Purchase',       color: '#2A2A2A', dash: null },
  custom_asic:       { label: 'Custom ASIC',        color: '#2A2A2A', dash: null },
  equity_investment: { label: 'Equity Investment',  color: '#2A2A2A', dash: '2,3' },
  cloud_capacity:    { label: 'Cloud Capacity',     color: '#2A2A2A', dash: null },
  m_and_a:           { label: 'M&A / Licensing',    color: '#2A2A2A', dash: null },
  funding_round:     { label: 'Funding Round',      color: '#2A2A2A', dash: null },
  power_ppa:         { label: 'Power PPA',           color: '#2A2A2A', dash: '4,2' },
  equipment_supply:  { label: 'Equipment Supply',    color: '#2A2A2A', dash: null },
}

const companyBySlug = new Map(COMPANIES.map(c => [c.slug, c]))

export const DEALS = rawDeals.map(d => {
  const src = companyBySlug.get(d.source_slug)
  const tgt = companyBySlug.get(d.target_slug)
  return {
    id: d.id,
    source: d.source_name,
    source_ticker: src?.ticker ?? null,
    source_category: d.source_category,
    target: d.target_name,
    target_ticker: tgt?.ticker ?? null,
    target_category: d.target_category,
    deal_type: d.deal_type,
    value_billions: d.value_billions ?? null,
    value_display: d.value_display ?? null,
    date: d.date,
    date_display: d.date_display,
    description: d.description,
    source_url: d.source_url,
  }
})

function parseDateKey(d) {
  return d.date || ''
}

export const EARLIEST_DATE = DEALS.reduce(
  (min, d) => {
    const k = parseDateKey(d)
    if (!k) return min
    return (!min || k < min) ? k : min
  },
  ''
)

export const LATEST_DATE = DEALS.reduce(
  (max, d) => {
    const k = parseDateKey(d)
    if (!k) return max
    return k > max ? k : max
  },
  ''
)
