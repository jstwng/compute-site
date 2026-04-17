import { describe, it, expect } from 'vitest'
import {
  perCompanyAggregates,
  activeAsOf,
  inDateRange,
  buildDirectedAdjacency,
  allShortestPaths,
  reachableFrom,
  clusterCentroids,
} from '../src/components/ComputeDealMap/logic.js'

const deals = [
  { id: 'a', source: 'A', target: 'B', date: '2020-01', deal_type: 'gpu_purchase' },
  { id: 'b', source: 'B', target: 'C', date: '2022-06', deal_type: 'custom_asic' },
  { id: 'c', source: 'A', target: 'C', date: '2024-01', deal_type: 'gpu_purchase' },
  { id: 'd', source: 'D', target: 'A', date: '2019-03', deal_type: 'equipment_supply' },
]

describe('perCompanyAggregates', () => {
  it('counts inbound + outbound deals per company', () => {
    const agg = perCompanyAggregates(deals)
    expect(agg.get('A').totalDeals).toBe(3)
    expect(agg.get('A').counterparties.size).toBe(3)
    expect(agg.get('A').earliest).toBe('2019-03')
    expect(agg.get('A').latest).toBe('2024-01')
  })

  it('ranks top deal types by frequency', () => {
    const agg = perCompanyAggregates(deals)
    const top = agg.get('A').topDealTypes
    expect(top[0]).toBe('gpu_purchase')
  })
})

describe('activeAsOf', () => {
  it('includes deals with date <= threshold', () => {
    const active = activeAsOf(deals, '2022-06')
    expect(active.map(d => d.id).sort()).toEqual(['a', 'b', 'd'])
  })

  it('returns empty when before all deals', () => {
    expect(activeAsOf(deals, '2010-01')).toEqual([])
  })

  it('returns all when at or past latest', () => {
    expect(activeAsOf(deals, '2030-01').length).toBe(4)
  })
})

describe('inDateRange', () => {
  it('includes deals between from and to (inclusive)', () => {
    const r = inDateRange(deals, '2020-01', '2022-06')
    expect(r.map(d => d.id).sort()).toEqual(['a', 'b'])
  })

  it('treats undefined from as no lower bound', () => {
    const r = inDateRange(deals, undefined, '2020-12')
    expect(r.map(d => d.id).sort()).toEqual(['a', 'd'])
  })

  it('treats undefined to as no upper bound', () => {
    const r = inDateRange(deals, '2022-01', undefined)
    expect(r.map(d => d.id).sort()).toEqual(['b', 'c'])
  })

  it('returns empty when range is empty (from > to)', () => {
    expect(inDateRange(deals, '2025-01', '2024-01')).toEqual([])
  })
})

describe('buildDirectedAdjacency', () => {
  it('maps each source to its set of targets', () => {
    const adj = buildDirectedAdjacency(deals)
    expect([...adj.get('A')].sort()).toEqual(['B', 'C'])
    expect([...adj.get('D')]).toEqual(['A'])
    expect(adj.get('C')).toBeUndefined()
  })
})

describe('allShortestPaths (allDirectedPaths) — loose mode', () => {
  // Loose mode is used here because these fixtures lack source/target
  // categories. Production traces run in strict mode (see strict tests below).
  const opts = { strictValueChain: false }

  it('enumerates all directed simple paths', () => {
    const paths = allShortestPaths(deals, 'D', 'C', opts)
    // D -> A -> C and D -> A -> B -> C, sorted shortest-first.
    expect(paths.map(p => p.join('>'))).toEqual(['D>A>C', 'D>A>B>C'])
  })

  it('enumerates every directed simple path, not just the shortest', () => {
    const d2 = [
      ...deals,
      { id: 'e', source: 'A', target: 'E', date: '2021-01', deal_type: 'gpu_purchase' },
      { id: 'f', source: 'E', target: 'C', date: '2022-01', deal_type: 'gpu_purchase' },
    ]
    const paths = allShortestPaths(d2, 'A', 'C', opts)
    expect(paths.map(p => p.join('>'))).toEqual(['A>C', 'A>B>C', 'A>E>C'])
  })

  it('returns all parallel shortest paths when multiple exist', () => {
    const d3 = [
      { id: 'ax', source: 'A', target: 'X', date: '2020-01', deal_type: 'gpu_purchase' },
      { id: 'xd', source: 'X', target: 'D', date: '2020-02', deal_type: 'gpu_purchase' },
      { id: 'ay', source: 'A', target: 'Y', date: '2020-03', deal_type: 'gpu_purchase' },
      { id: 'yd', source: 'Y', target: 'D', date: '2020-04', deal_type: 'gpu_purchase' },
    ]
    const paths = allShortestPaths(d3, 'A', 'D', opts)
    expect(paths.length).toBe(2)
    const strs = paths.map(p => p.join('>')).sort()
    expect(strs).toEqual(['A>X>D', 'A>Y>D'])
  })

  it('returns [] when no directed path exists', () => {
    expect(allShortestPaths(deals, 'C', 'A', opts)).toEqual([])
  })

  it('returns [] when origin === destination', () => {
    expect(allShortestPaths(deals, 'A', 'A', opts)).toEqual([])
  })

  it('respects maxDepth cap', () => {
    const chain = [
      { id: '1', source: 'A', target: 'B', date: '2020-01', deal_type: 'gpu_purchase' },
      { id: '2', source: 'B', target: 'C', date: '2020-01', deal_type: 'gpu_purchase' },
      { id: '3', source: 'C', target: 'D', date: '2020-01', deal_type: 'gpu_purchase' },
      { id: '4', source: 'D', target: 'E', date: '2020-01', deal_type: 'gpu_purchase' },
    ]
    expect(allShortestPaths(chain, 'A', 'E', { ...opts, maxDepth: 4 })).toEqual([])
    expect(allShortestPaths(chain, 'A', 'E', { ...opts, maxDepth: 5 })).toEqual([['A', 'B', 'C', 'D', 'E']])
  })

  it('respects maxPaths cap', () => {
    const fan = [
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `ax${i}`, source: 'A', target: `X${i}`, date: '2020-01', deal_type: 'gpu_purchase',
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `xz${i}`, source: `X${i}`, target: 'Z', date: '2020-01', deal_type: 'gpu_purchase',
      })),
    ]
    expect(allShortestPaths(fan, 'A', 'Z', opts).length).toBe(10)
    expect(allShortestPaths(fan, 'A', 'Z', { ...opts, maxPaths: 3 }).length).toBe(3)
  })
})

describe('allShortestPaths (allDirectedPaths) — strict value-chain mode', () => {
  // Strict mode requires both endpoints to be ranked AND the hop to
  // strictly advance downstream. Mirrors the production trace algorithm.
  const supplyChain = [
    { id: '1', source: 'ASML', target: 'TSMC', source_category: 'equipment', target_category: 'foundry', date: '2024-01', deal_type: 'equipment_supply' },
    { id: '2', source: 'TSMC', target: 'NVIDIA', source_category: 'foundry', target_category: 'chip_designer', date: '2024-01', deal_type: 'foundry_capacity' },
    { id: '3', source: 'NVIDIA', target: 'Oracle', source_category: 'chip_designer', target_category: 'hyperscaler', date: '2024-01', deal_type: 'gpu_purchase' },
    { id: '4', source: 'Oracle', target: 'OpenAI', source_category: 'hyperscaler', target_category: 'ai_lab', date: '2024-01', deal_type: 'cloud_capacity' },
    // Same-tier sibling hop (chip_designer -> chip_designer) — must be culled.
    { id: '5', source: 'NVIDIA', target: 'AMD', source_category: 'chip_designer', target_category: 'chip_designer', date: '2024-01', deal_type: 'partnership' },
    // Backflow (hyperscaler -> chip_designer) — must be culled.
    { id: '6', source: 'Oracle', target: 'NVIDIA', source_category: 'hyperscaler', target_category: 'chip_designer', date: '2024-01', deal_type: 'partnership' },
    // Investor edge — must be culled (investor isn't ranked).
    { id: '7', source: 'Sequoia', target: 'OpenAI', source_category: 'investor', target_category: 'ai_lab', date: '2024-01', deal_type: 'funding_round' },
  ]

  it('finds the canonical ASML -> OpenAI supply chain path', () => {
    const paths = allShortestPaths(supplyChain, 'ASML', 'OpenAI')
    expect(paths.map(p => p.join('>'))).toEqual(['ASML>TSMC>NVIDIA>Oracle>OpenAI'])
  })

  it('rejects same-tier hops', () => {
    // NVIDIA -> AMD is chip_designer -> chip_designer; AMD has no further
    // outgoing edges in the fixture, so any AMD-routed path is impossible.
    const paths = allShortestPaths(supplyChain, 'NVIDIA', 'AMD')
    expect(paths).toEqual([])
  })

  it('rejects upstream backflow', () => {
    // Oracle -> NVIDIA exists in the fixture but as a backflow edge.
    const paths = allShortestPaths(supplyChain, 'Oracle', 'NVIDIA')
    expect(paths).toEqual([])
  })

  it('excludes investor-rooted paths', () => {
    // Sequoia -> OpenAI is the only Sequoia edge, but investor has no rank.
    const paths = allShortestPaths(supplyChain, 'Sequoia', 'OpenAI')
    expect(paths).toEqual([])
  })

  it('enforces max tier jump of 2 (no equipment->ai_lab shortcut hops)', () => {
    const shortcuts = [
      // Direct equipment -> ai_lab (jump 5) — must be culled even though
      // strictly downstream.
      { id: 'e2l', source: 'ASML', target: 'OpenAI', source_category: 'equipment', target_category: 'ai_lab', date: '2024-01', deal_type: 'gpu_purchase' },
      // memory -> ai_lab (jump 4) — must be culled (kills the noisy
      // "ASML -> SK Hynix -> OpenAI" 2-hop shortcut even when memory is
      // a real downstream node).
      { id: 'lam', source: 'Lam Research', target: 'SK Hynix', source_category: 'equipment', target_category: 'memory', date: '2024-01', deal_type: 'equipment_supply' },
      { id: 'sko', source: 'SK Hynix', target: 'OpenAI', source_category: 'memory', target_category: 'ai_lab', date: '2024-01', deal_type: 'custom_asic' },
      // chip_designer -> ai_lab (jump 3) — must be culled.
      { id: 'no', source: 'NVIDIA', target: 'OpenAI', source_category: 'chip_designer', target_category: 'ai_lab', date: '2024-01', deal_type: 'gpu_purchase' },
    ]
    expect(allShortestPaths(shortcuts, 'ASML', 'OpenAI')).toEqual([])
    expect(allShortestPaths(shortcuts, 'Lam Research', 'OpenAI')).toEqual([])
    expect(allShortestPaths(shortcuts, 'NVIDIA', 'OpenAI')).toEqual([])
  })
})

describe('reachableFrom', () => {
  it('returns the set of nodes reachable via directed edges (excluding origin)', () => {
    const r = reachableFrom(deals, 'D')
    expect([...r].sort()).toEqual(['A', 'B', 'C'])
  })

  it('returns an empty set for a node with no outbound edges', () => {
    expect(reachableFrom(deals, 'C').size).toBe(0)
  })

  it('returns an empty set when origin is null', () => {
    expect(reachableFrom(deals, null).size).toBe(0)
  })
})

describe('clusterCentroids', () => {
  it('maps every category to an x,y inside the viewport', () => {
    const cs = clusterCentroids(1000, 500)
    expect(cs.has('chip_designer')).toBe(true)
    expect(cs.has('equipment')).toBe(true)
    expect(cs.has('hyperscaler')).toBe(true)
    for (const { x, y } of cs.values()) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(1000)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(500)
    }
  })

  it('scales with width and height', () => {
    const small = clusterCentroids(200, 100)
    const large = clusterCentroids(2000, 1000)
    // Chip designer sits at col=0.42: ~84 vs ~840.
    expect(large.get('chip_designer').x).toBeCloseTo(small.get('chip_designer').x * 10, 0)
  })
})
