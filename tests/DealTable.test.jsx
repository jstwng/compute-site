import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DealTable from '../src/components/ComputeDealMap/DealTable.jsx'

const deals = [
  {
    id: 'd1', source: 'NVIDIA', target: 'CoreWeave',
    deal_type: 'gpu_purchase', value_display: '$6.3B',
    date_display: 'Sep 2025', description: 'H100 cluster.',
    source_url: 'https://x.test/',
  },
]

function mockMatchMedia(matches) {
  const mql = {
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }
  vi.spyOn(window, 'matchMedia').mockImplementation(() => mql)
}

describe('DealTable responsive mode', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('renders the column table on desktop', () => {
    mockMatchMedia(false)
    render(
      <DealTable deals={deals} onHoverEdge={() => {}} onClickCompany={() => {}} onClickDeal={() => {}} />
    )
    // Desktop renders <th> column headers; "Source" appears twice
    // (the source-company column and the source_url link column).
    expect(screen.getAllByText('Source').length).toBeGreaterThan(0)
    expect(screen.getByText('Target')).toBeInTheDocument()
  })

  it('renders the card list on mobile (no "Source" / "Target" column headers)', () => {
    mockMatchMedia(true)
    render(
      <DealTable deals={deals} onHoverEdge={() => {}} onClickCompany={() => {}} onClickDeal={() => {}} />
    )
    expect(screen.queryByText('Source')).toBeNull()
    expect(screen.queryByText('Target')).toBeNull()
    expect(screen.getByText('NVIDIA')).toBeInTheDocument()
    expect(screen.getByText('CoreWeave')).toBeInTheDocument()
  })
})
