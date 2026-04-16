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

describe('allShortestPaths', () => {
  it('returns single shortest path when only one exists', () => {
    const paths = allShortestPaths(deals, 'D', 'C')
    expect(paths).toEqual([['D', 'A', 'C']])
  })

  it('returns one direct path when a length-1 edge exists beside longer paths', () => {
    const d2 = [
      ...deals,
      { id: 'e', source: 'A', target: 'E', date: '2021-01', deal_type: 'gpu_purchase' },
      { id: 'f', source: 'E', target: 'C', date: '2022-01', deal_type: 'gpu_purchase' },
    ]
    const paths = allShortestPaths(d2, 'A', 'C')
    expect(paths.length).toBe(1)
    expect(paths[0]).toEqual(['A', 'C'])
  })

  it('returns all shortest paths of equal length when multiple exist', () => {
    const d3 = [
      { id: 'ax', source: 'A', target: 'X', date: '2020-01', deal_type: 'gpu_purchase' },
      { id: 'xd', source: 'X', target: 'D', date: '2020-02', deal_type: 'gpu_purchase' },
      { id: 'ay', source: 'A', target: 'Y', date: '2020-03', deal_type: 'gpu_purchase' },
      { id: 'yd', source: 'Y', target: 'D', date: '2020-04', deal_type: 'gpu_purchase' },
    ]
    const paths = allShortestPaths(d3, 'A', 'D')
    expect(paths.length).toBe(2)
    const strs = paths.map(p => p.join('>')).sort()
    expect(strs).toEqual(['A>X>D', 'A>Y>D'])
  })

  it('returns [] when no directed path exists', () => {
    const paths = allShortestPaths(deals, 'C', 'A')
    expect(paths).toEqual([])
  })

  it('returns [] when origin === destination', () => {
    expect(allShortestPaths(deals, 'A', 'A')).toEqual([])
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
