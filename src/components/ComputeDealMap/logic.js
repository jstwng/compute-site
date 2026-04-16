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

export function perCompanyAggregates(deals) {
  const byCompany = new Map()
  for (const d of deals) {
    for (const role of ['source', 'target']) {
      const name = d[role]
      if (!name) continue
      if (!byCompany.has(name)) {
        byCompany.set(name, {
          totalDeals: 0,
          counterparties: new Set(),
          earliest: null,
          latest: null,
          dealTypeCounts: new Map(),
        })
      }
      const agg = byCompany.get(name)
      agg.totalDeals += 1
      const other = role === 'source' ? d.target : d.source
      if (other && other !== name) agg.counterparties.add(other)
      if (d.date) {
        if (!agg.earliest || d.date < agg.earliest) agg.earliest = d.date
        if (!agg.latest || d.date > agg.latest) agg.latest = d.date
      }
      const t = d.deal_type
      if (t) agg.dealTypeCounts.set(t, (agg.dealTypeCounts.get(t) || 0) + 1)
    }
  }
  for (const agg of byCompany.values()) {
    agg.topDealTypes = [...agg.dealTypeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t)
  }
  return byCompany
}

export function activeAsOf(deals, threshold) {
  return deals.filter(d => d.date && d.date <= threshold)
}

export function inDateRange(deals, from, to) {
  return deals.filter(d => {
    if (!d.date) return false
    if (from && d.date < from) return false
    if (to && d.date > to) return false
    return true
  })
}

export function reachableFrom(deals, origin) {
  if (!origin) return new Set()
  const adj = buildDirectedAdjacency(deals)
  const seen = new Set([origin])
  const queue = [origin]
  while (queue.length) {
    const node = queue.shift()
    const out = adj.get(node)
    if (!out) continue
    for (const target of out) {
      if (!seen.has(target)) {
        seen.add(target)
        queue.push(target)
      }
    }
  }
  seen.delete(origin)
  return seen
}

export function buildDirectedAdjacency(deals) {
  const adj = new Map()
  for (const d of deals) {
    if (!d.source || !d.target || d.source === d.target) continue
    // When category info is present on both ends, keep only edges that flow
    // upstream -> downstream in the value chain (source_col <= target_col).
    // Within-tier edges (equal cols) are allowed so same-category partnerships
    // still count. Deals without category info are kept unconditionally so
    // callers that work on abstract graphs still behave intuitively.
    const sCol = CATEGORY_COL[d.source_category]
    const tCol = CATEGORY_COL[d.target_category]
    if (sCol != null && tCol != null && sCol > tCol) continue
    if (!adj.has(d.source)) adj.set(d.source, new Set())
    adj.get(d.source).add(d.target)
  }
  return adj
}

// Map from "source__target" -> array of unique deal_type slugs. Used to
// annotate each hop in the Trace path breakdown.
export function edgeDealTypes(deals) {
  const byEdge = new Map()
  for (const d of deals) {
    if (!d.source || !d.target || !d.deal_type) continue
    const key = `${d.source}__${d.target}`
    if (!byEdge.has(key)) byEdge.set(key, new Set())
    byEdge.get(key).add(d.deal_type)
  }
  const out = new Map()
  for (const [k, set] of byEdge) out.set(k, [...set])
  return out
}

// Value-chain arrangement of cluster centroids as fractions of the viewport
// (col, row) in [0, 1]. Left = upstream supplier; right = downstream consumer.
const CATEGORY_LAYOUT = [
  { slug: 'equipment',     col: 0.08, row: 0.5 },
  { slug: 'memory',        col: 0.08, row: 0.8 },
  { slug: 'packaging',     col: 0.08, row: 0.2 },
  { slug: 'networking',    col: 0.22, row: 0.35 },
  { slug: 'power',         col: 0.22, row: 0.65 },
  { slug: 'chip_designer', col: 0.42, row: 0.5 },
  { slug: 'data_center',   col: 0.62, row: 0.25 },
  { slug: 'neocloud',      col: 0.62, row: 0.5 },
  { slug: 'server_oem',    col: 0.62, row: 0.75 },
  { slug: 'hyperscaler',   col: 0.82, row: 0.5 },
  { slug: 'ai_lab',        col: 0.82, row: 0.8 },
  { slug: 'investor',      col: 0.92, row: 0.15 },
]

// Category col lookup — used to enforce value-chain flow in trace adjacency.
// An edge A -> B is only kept in the trace graph when A's category sits
// upstream-or-equal to B's in the layout. Prevents nonsensical paths like
// "AMD to Oracle to NVIDIA to xAI" that would reverse the value chain via
// an Oracle -> NVIDIA deal (Oracle is a downstream hyperscaler, NVIDIA is
// an upstream chip designer — individually directional, but illegal when
// chained with the rest of the path).
const CATEGORY_COL = Object.fromEntries(
  CATEGORY_LAYOUT.map(({ slug, col }) => [slug, col])
)

export function clusterCentroids(width, height) {
  const out = new Map()
  for (const { slug, col, row } of CATEGORY_LAYOUT) {
    out.set(slug, { x: col * width, y: row * height })
  }
  return out
}

export function allShortestPaths(deals, origin, destination) {
  if (origin === destination) return []
  const adj = buildDirectedAdjacency(deals)
  const distance = new Map([[origin, 0]])
  const parents = new Map([[origin, []]])
  let frontier = [origin]
  let foundDepth = -1
  while (frontier.length) {
    const nextFrontier = []
    for (const node of frontier) {
      const out = adj.get(node)
      if (!out) continue
      const nodeDepth = distance.get(node)
      if (foundDepth !== -1 && nodeDepth >= foundDepth) continue
      for (const target of out) {
        const newDepth = nodeDepth + 1
        if (!distance.has(target)) {
          distance.set(target, newDepth)
          parents.set(target, [node])
          nextFrontier.push(target)
          if (target === destination) foundDepth = newDepth
        } else if (distance.get(target) === newDepth) {
          parents.get(target).push(node)
        }
      }
    }
    frontier = nextFrontier
    if (foundDepth !== -1 && frontier.every(n => distance.get(n) >= foundDepth)) break
  }
  if (!parents.has(destination)) return []
  const paths = []
  function walk(node, acc) {
    if (node === origin) {
      paths.push([origin, ...acc])
      return
    }
    for (const p of parents.get(node)) walk(p, [node, ...acc])
  }
  walk(destination, [])
  return paths
}
