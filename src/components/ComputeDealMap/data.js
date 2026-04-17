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

// Timeline floor. Anything dated before this is filtered out of the dataset
// and the Timeline From/To dropdowns start here regardless of the true
// earliest deal in the upstream data repo.
const TIMELINE_FLOOR = '2020-01'

const companyBySlug = new Map(COMPANIES.map(c => [c.slug, c]))

// Dedupe at load time — the upstream data repo occasionally ships two
// records for the same economic deal (e.g. a primary-source entry and a
// news-coverage entry with identical value/date). Keep the first
// occurrence per (source, target, date, value) key so the UI doesn't
// show the same deal twice.
const _seen = new Set()
const _deduped = rawDeals.filter(d => {
  const key = `${d.source_slug}__${d.target_slug}__${d.deal_type}__${d.date ?? ''}__${d.value_billions ?? ''}`
  if (_seen.has(key)) return false
  _seen.add(key)
  return true
})

export const DEALS = _deduped
  .filter(d => !d.date || d.date >= TIMELINE_FLOOR)
  .map(d => {
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

export const EARLIEST_DATE = TIMELINE_FLOOR

export const LATEST_DATE = DEALS.reduce(
  (max, d) => {
    const k = parseDateKey(d)
    if (!k) return max
    return k > max ? k : max
  },
  ''
)
