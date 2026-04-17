import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProfilePanel from '../src/components/ComputeDealMap/ProfilePanel.jsx'

describe('ProfilePanel', () => {
  it('renders nothing when content is null', () => {
    const { container } = render(
      <ProfilePanel content={null} onClose={() => {}} onOpenCompany={() => {}} onScrollToRow={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders a Close affordance when content is provided', () => {
    const content = {
      mode: 'company',
      company: { name: 'NVIDIA', ticker: null },
      aggregates: {
        totalDeals: 0,
        counterparties: new Set(),
        earliest: null,
        latest: null,
        topDealTypes: [],
      },
      deals: [],
      counterpartyFilter: null,
      onSetCounterpartyFilter: () => {},
    }
    render(
      <ProfilePanel
        content={content}
        onClose={() => {}}
        onOpenCompany={() => {}}
        onScrollToRow={() => {}}
      />
    )
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('renders company mode identity and description', () => {
    const content = {
      mode: 'company',
      company: {
        name: 'NVIDIA',
        ticker: 'NVDA',
        description: 'Designs the dominant GPUs for AI training and inference.',
      },
      aggregates: {
        totalDeals: 11,
        counterparties: new Set(['A', 'B', 'C']),
        earliest: '2019-01',
        latest: '2026-01',
        topDealTypes: ['gpu_purchase', 'custom_asic'],
      },
      deals: [],
      counterpartyFilter: null,
      onSetCounterpartyFilter: () => {},
    }
    render(
      <ProfilePanel
        content={content}
        onClose={() => {}}
        onOpenCompany={() => {}}
        onScrollToRow={() => {}}
      />
    )
    expect(screen.getByText('NVIDIA')).toBeInTheDocument()
    expect(screen.getByText('NVDA')).toBeInTheDocument()
    expect(screen.getByText(/Designs the dominant GPUs/)).toBeInTheDocument()
  })

  it('renders deal mode with both company names and jump links', () => {
    const onOpenCompany = vi.fn()
    const content = {
      mode: 'deal',
      edge: { source: 'NVIDIA', target: 'CoreWeave' },
      deals: [
        {
          id: 'nv-crwv-1',
          source: 'NVIDIA',
          target: 'CoreWeave',
          date: '2024-06',
          date_display: 'Jun 2024',
          deal_type: 'gpu_purchase',
          value_billions: 1.3,
          value_display: '$1.3B',
          description: 'H100 allocation',
          source_url: 'https://example.com/src',
        },
      ],
    }
    render(
      <ProfilePanel
        content={content}
        onClose={() => {}}
        onOpenCompany={onOpenCompany}
        onScrollToRow={() => {}}
      />
    )
    expect(screen.getByText('NVIDIA and CoreWeave')).toBeInTheDocument()
    // "Jump to company" subhead + two company-name links
    expect(screen.getByText('Jump to company')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'NVIDIA' }))
    expect(onOpenCompany).toHaveBeenCalledWith('NVIDIA')
  })

  it('renders counterparty filter dropdown with option counts', () => {
    const content = {
      mode: 'company',
      company: { name: 'NVIDIA', ticker: null },
      aggregates: {
        totalDeals: 3,
        counterparties: new Set(['TSMC', 'SKH']),
        earliest: '2022-01',
        latest: '2024-01',
        topDealTypes: ['gpu_purchase'],
      },
      deals: [
        { id: 'd1', source: 'NVIDIA', target: 'TSMC', date: '2024-01', deal_type: 'gpu_purchase', description: 'x' },
        { id: 'd2', source: 'TSMC', target: 'NVIDIA', date: '2023-06', deal_type: 'gpu_purchase', description: 'y' },
        { id: 'd3', source: 'NVIDIA', target: 'SKH', date: '2022-01', deal_type: 'gpu_purchase', description: 'z' },
      ],
      counterpartyFilter: null,
      onSetCounterpartyFilter: () => {},
    }
    render(
      <ProfilePanel
        content={content}
        onClose={() => {}}
        onOpenCompany={() => {}}
        onScrollToRow={() => {}}
      />
    )
    expect(screen.getByText('Counterparty:')).toBeInTheDocument()
    // Default selection shows All with total deal count.
    const trigger = screen.getByText('Counterparty:').closest('button')
    expect(trigger.textContent).toContain('All (3)')
  })

  it('calls onClose when Close is clicked', () => {
    const content = {
      mode: 'company',
      company: { name: 'NVIDIA', ticker: null },
      aggregates: {
        totalDeals: 0,
        counterparties: new Set(),
        earliest: null,
        latest: null,
        topDealTypes: [],
      },
      deals: [],
      counterpartyFilter: null,
      onSetCounterpartyFilter: () => {},
    }
    const onClose = vi.fn()
    render(
      <ProfilePanel
        content={content}
        onClose={onClose}
        onOpenCompany={() => {}}
        onScrollToRow={() => {}}
      />
    )
    fireEvent.click(screen.getByText('Close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape is pressed', () => {
    const content = {
      mode: 'company',
      company: { name: 'NVIDIA', ticker: null },
      aggregates: {
        totalDeals: 0,
        counterparties: new Set(),
        earliest: null,
        latest: null,
        topDealTypes: [],
      },
      deals: [],
      counterpartyFilter: null,
      onSetCounterpartyFilter: () => {},
    }
    const onClose = vi.fn()
    render(
      <ProfilePanel
        content={content}
        onClose={onClose}
        onOpenCompany={() => {}}
        onScrollToRow={() => {}}
      />
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
