export function aggregateEdges(deals) {
  const byPair = new Map()
  for (const d of deals) {
    // Funding rounds (source === target) are table-only; skip from graph edges.
    if (d.deal_type === 'funding_round' || d.source === d.target) continue
    const key = `${d.source}__${d.target}`
    if (!byPair.has(key)) {
      byPair.set(key, {
        source: d.source,
        target: d.target,
        source_category: d.source_category,
        target_category: d.target_category,
        deals: [],
        totalValue: 0,
      })
    }
    const edge = byPair.get(key)
    edge.deals.push(d)
    if (d.value_billions != null) edge.totalValue += d.value_billions
  }
  return [...byPair.values()]
}

export function applyFilters(deals, { dealType, category, search }) {
  const q = (search || '').trim().toLowerCase()
  return deals.filter(d => {
    if (dealType !== 'all' && d.deal_type !== dealType) return false
    if (category !== 'all') {
      const cats = category === 'neocloud_ai' ? ['neocloud', 'ai_lab'] : [category]
      if (!cats.includes(d.source_category) && !cats.includes(d.target_category)) return false
    }
    if (q) {
      const hay = `${d.source} ${d.target} ${d.deal_type} ${d.description || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

function formatBillions(b) {
  if (b >= 1000) return `$${(b / 1000).toFixed(1)}T`
  if (b >= 100) return `$${Math.round(b)}B`
  return `$${b.toFixed(1)}B`
}

function formatMonth(yyyymm) {
  if (!yyyymm) return ''
  const [y, m] = yyyymm.split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[m - 1]} ${y}`
}

function mostFrequent(values) {
  const counts = new Map()
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1)
  let best = null, bestN = 0
  for (const [v, n] of counts) {
    if (n > bestN) { best = v; bestN = n }
  }
  return { value: best, count: bestN }
}

export function computeStats(deals) {
  const total = deals.length
  const disclosed = deals.reduce((sum, d) => sum + (d.value_billions || 0), 0)
  const largest = deals.reduce((max, d) => {
    if (d.value_billions == null) return max
    if (!max || d.value_billions > max.value_billions) return d
    return max
  }, null)
  const seller = mostFrequent(deals.map(d => d.source))
  const buyer = mostFrequent(deals.map(d => d.target))
  const dates = deals.map(d => d.date).filter(Boolean).sort()
  const earliest = dates[0]
  const latest = dates[dates.length - 1]

  return {
    total,
    disclosedDisplay: formatBillions(disclosed) + '+',
    largest,
    largestDisplay: largest ? formatBillions(largest.value_billions) : null,
    seller,
    buyer,
    dateRange: earliest && latest ? `${formatMonth(earliest)} – ${formatMonth(latest)}` : '',
  }
}

export function sortDeals(deals, { column, direction }) {
  const dir = direction === 'asc' ? 1 : -1
  return [...deals].sort((a, b) => {
    const av = a[column]
    const bv = b[column]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
}
