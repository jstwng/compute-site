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
      if (d.source_category !== category && d.target_category !== category) return false
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

// Strict value-chain rank for trace pathfinding. Lower rank = more upstream.
// Edges A -> B are only kept in the trace adjacency when rank(A) < rank(B),
// so every hop strictly advances down the supply chain — no same-tier
// zigzags, no upstream backflow. Investor is intentionally absent: capital
// flow isn't a value-chain hop, and including investors creates noisy
// "investor X -> chip designer Y -> ... -> ai_lab" routes that obscure
// the actual supply story (ASML -> TSMC -> NVIDIA -> Oracle -> OpenAI).
//
// Tiers are coarser than the CATEGORY_LAYOUT cols used for cluster layout:
// the layout cares about visual grouping, the trace cares about whether
// a hop makes value-chain sense.
const TRACE_RANK = {
  // Tier 0: fab tools (Lam, AMAT, ASML, KLA)
  equipment: 0,
  // Tier 1: silicon manufacturing — foundry, memory, and packaging are
  // parallel branches that all produce chips/modules sold up to designers.
  // Equipment makers supply all three, designers buy from all three.
  foundry: 1,
  memory: 1,
  packaging: 1,
  // Tier 2: chip design (sells finished SKUs to operators)
  chip_designer: 2,
  // Tier 3: server / infra suppliers to operators
  server_oem: 3,
  power: 3,
  networking: 3,
  // Tier 4: compute operators
  data_center: 4,
  neocloud: 4,
  hyperscaler: 4,
  // Tier 5: end consumers of compute
  ai_lab: 5,
}

// Override map for companies that are mis-tagged in the upstream
// `companies.yml` but whose real value-chain role is unambiguous. The
// trace algorithm treats their effective category as the override
// regardless of what the deal payload says, so canonical paths like
// ASML -> TSMC -> NVIDIA -> Oracle -> OpenAI survive even when TSMC's
// raw tag is `chip_designer`.
//
// Push these fixes upstream when you can; this map is the stop-gap.
const CATEGORY_OVERRIDES = {
  TSMC: 'foundry',
  'Samsung Foundry': 'foundry',
  // SMIC / GlobalFoundries / UMC / Tower already correctly tagged.
}

function effectiveCategory(name, rawCategory) {
  return CATEGORY_OVERRIDES[name] ?? rawCategory
}

// Maximum value-chain tiers a single hop is allowed to skip. With
// MAX_TIER_JUMP = 2, each step in a trace path advances at most two
// tiers — so equipment can hop into foundry/memory/packaging (jump 1)
// or all the way to chip_designer (jump 2), but cannot shortcut directly
// to operators or labs. This kills noisy 2-hop paths like
// ASML -> SK Hynix -> OpenAI (memory jumping straight to ai_lab) while
// preserving the canonical 4-hop ASML -> TSMC -> NVIDIA -> Oracle -> OpenAI
// supply-chain walk.
const MAX_TIER_JUMP = 2

// Strict adjacency for trace: requires both endpoints to be ranked, hop
// strictly downstream (sRank < tRank), AND the hop spans at most
// MAX_TIER_JUMP tiers. Result is paths that "trace" the value chain
// properly instead of skipping straight from raw materials to end users.
export function buildTraceAdjacency(deals) {
  const adj = new Map()
  for (const d of deals) {
    if (!d.source || !d.target || d.source === d.target) continue
    const sCat = effectiveCategory(d.source, d.source_category)
    const tCat = effectiveCategory(d.target, d.target_category)
    const sRank = TRACE_RANK[sCat]
    const tRank = TRACE_RANK[tCat]
    if (sRank == null || tRank == null) continue
    if (sRank >= tRank) continue
    if (tRank - sRank > MAX_TIER_JUMP) continue
    if (!adj.has(d.source)) adj.set(d.source, new Set())
    adj.get(d.source).add(d.target)
  }
  return adj
}

// Per-node effective category lookup. Used by the UI to label each path
// stop with its tier (so the user can see "ASML [equipment] -> TSMC [foundry]
// -> ..."). Exported because both App.jsx and Toolbar.jsx need it.
export function nodeEffectiveCategory(deals, name) {
  if (!name) return null
  if (CATEGORY_OVERRIDES[name]) return CATEGORY_OVERRIDES[name]
  for (const d of deals) {
    if (d.source === name && d.source_category) return d.source_category
    if (d.target === name && d.target_category) return d.target_category
  }
  return null
}

// All directed simple paths from origin to destination. Uses the strict
// trace adjacency by default so every path advances strictly downstream
// in the value chain. Pass `strictValueChain: false` to fall back to
// the loose adjacency (used by tests with abstract fixtures).
//
// Caps keep the result usable for hub queries (NVIDIA, TSMC) where the
// raw path count would otherwise explode:
//   - maxDepth = 8 nodes (up to 7 hops). Anything deeper is unlikely to
//     read as a coherent supply chain story.
//   - maxPaths = 200. The Trace UI buckets paths by hop count; 200 is
//     the upper bound before even the bucketing breaks down.
//
// Output is sorted shortest-first, then lexicographically for stable
// ordering across renders.
export function allDirectedPaths(deals, origin, destination, opts = {}) {
  if (origin === destination) return []
  const strict = opts.strictValueChain !== false
  const adj = strict ? buildTraceAdjacency(deals) : buildDirectedAdjacency(deals)
  if (!adj.has(origin)) return []

  const maxDepth = opts.maxDepth ?? 8
  const maxPaths = opts.maxPaths ?? 200

  const paths = []
  const visited = new Set([origin])
  const path = [origin]

  function dfs(node) {
    if (paths.length >= maxPaths) return
    if (path.length > maxDepth) return
    if (node === destination) {
      paths.push([...path])
      return
    }
    const neighbors = adj.get(node)
    if (!neighbors) return
    for (const next of neighbors) {
      if (visited.has(next)) continue
      visited.add(next)
      path.push(next)
      dfs(next)
      path.pop()
      visited.delete(next)
    }
  }

  dfs(origin)
  paths.sort((a, b) => a.length - b.length || a.join('>').localeCompare(b.join('>')))
  return paths
}

// Backwards-compatible alias. The Trace UI calls this name; semantics
// changed from "shortest-only" to "all directed paths" (capped) per
// product feedback that ASML -> OpenAI was hiding the TSMC route.
export const allShortestPaths = allDirectedPaths
