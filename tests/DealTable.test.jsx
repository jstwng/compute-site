import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('renders the 7-column table on desktop', () => {
    mockMatchMedia(false)
    render(
      <DealTable deals={deals} onHoverEdge={() => {}} onClickCompany={() => {}} onClickDeal={() => {}} />
    )
    expect(screen.getAllByText('Source').length).toBeGreaterThan(0)
    expect(screen.getByText('Target')).toBeInTheDocument()
    expect(screen.getByText('Deal Type')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('renders a compact 4-column table on mobile (no Deal Type / Description columns)', () => {
    mockMatchMedia(true)
    render(
      <DealTable deals={deals} onHoverEdge={() => {}} onClickCompany={() => {}} onClickDeal={() => {}} />
    )
    expect(screen.getByText('Source')).toBeInTheDocument()
    expect(screen.getByText('Target')).toBeInTheDocument()
    expect(screen.getByText('Value')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.queryByText('Deal Type')).toBeNull()
    expect(screen.queryByText('Description')).toBeNull()
    expect(screen.getByText('NVIDIA')).toBeInTheDocument()
  })

  it('tapping a mobile row expands an inline detail row with the description', () => {
    mockMatchMedia(true)
    render(<DealTable deals={deals} onHoverEdge={() => {}} />)
    expect(screen.queryByText('H100 cluster.')).toBeNull()
    fireEvent.click(screen.getByText('NVIDIA').closest('tr'))
    expect(screen.getByText('H100 cluster.')).toBeInTheDocument()
  })

  it('tapping a mobile row does not call onClickDeal (panel stays closed)', () => {
    mockMatchMedia(true)
    const onClickDeal = vi.fn()
    const onClickCompany = vi.fn()
    render(<DealTable deals={deals} onHoverEdge={() => {}} onClickDeal={onClickDeal} onClickCompany={onClickCompany} />)
    fireEvent.click(screen.getByText('NVIDIA').closest('tr'))
    expect(onClickDeal).not.toHaveBeenCalled()
    expect(onClickCompany).not.toHaveBeenCalled()
  })
})
