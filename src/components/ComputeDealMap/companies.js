import raw from './companies.generated.json'
import { DESCRIPTIONS } from './company-descriptions.js'

export const CATEGORIES = {
  chip_designer: { label: 'Chip designers' },
  hyperscaler:   { label: 'Hyperscalers' },
  neocloud:      { label: 'Neoclouds' },
  ai_lab:        { label: 'AI labs' },
  data_center:   { label: 'Data centers' },
  investor:      { label: 'Investors' },
  memory:        { label: 'Memory' },
  equipment:     { label: 'Equipment' },
  networking:    { label: 'Networking' },
  packaging:     { label: 'Packaging' },
  power:         { label: 'Power' },
  server_oem:    { label: 'Server OEMs' },
}

export function categoryLabel(slug) {
  if (!slug) return ''
  return CATEGORIES[slug]?.label ??
    slug.split('_').filter(w => w.length > 0).map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

export const COMPANIES = raw.map(c => {
  const entry = DESCRIPTIONS[c.slug] ?? {}
  return {
    name: c.name,
    ticker: c.ticker ?? null,
    category: c.category,
    subline: c.subline ?? '',
    description: entry.description ?? '',
    descriptionSource: entry.source ?? null,
    slug: c.slug,
    ...(c.acquired ? { acquired: true } : {}),
  }
})

export const COLUMNS = [
  { id: 'chip_designer', label: 'Chip Designers', companies: COMPANIES.filter(c => c.category === 'chip_designer') },
  { id: 'hyperscaler',   label: 'Hyperscalers',   companies: COMPANIES.filter(c => c.category === 'hyperscaler') },
  { id: 'neocloud_ai',   label: 'Neoclouds & AI Labs', companies: COMPANIES.filter(c => c.category === 'neocloud' || c.category === 'ai_lab') },
]

export function findCompany(name) {
  return COMPANIES.find(c => c.name === name) || null
}
