import raw from './companies.generated.json'

export const CATEGORIES = {
  chip_designer: { label: 'Chip Designers', fill: '#E8D9B8', border: '#A8893F' },
  hyperscaler:   { label: 'Hyperscalers',   fill: '#E0DEDA', border: '#8A8A8A' },
  neocloud:      { label: 'Neoclouds & AI Labs', fill: '#D8D8C8', border: '#7A7A5A' },
  ai_lab:        { label: 'Neoclouds & AI Labs', fill: '#D8D8C8', border: '#7A7A5A' },
  data_center:   { label: 'Data Centers',   fill: '#D5D0C8', border: '#8A8A8A' },
  investor:      { label: 'Investors',      fill: '#E0DEDA', border: '#8A8A8A' },
}

export const COMPANIES = raw.map(c => ({
  name: c.name,
  ticker: c.ticker ?? null,
  category: c.category,
  subline: c.subline ?? '',
  slug: c.slug,
  ...(c.acquired ? { acquired: true } : {}),
}))

export const COLUMNS = [
  { id: 'chip_designer', label: 'Chip Designers', companies: COMPANIES.filter(c => c.category === 'chip_designer') },
  { id: 'hyperscaler',   label: 'Hyperscalers',   companies: COMPANIES.filter(c => c.category === 'hyperscaler') },
  { id: 'neocloud_ai',   label: 'Neoclouds & AI Labs', companies: COMPANIES.filter(c => c.category === 'neocloud' || c.category === 'ai_lab') },
]

export function findCompany(name) {
  return COMPANIES.find(c => c.name === name) || null
}
