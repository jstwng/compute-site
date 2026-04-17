import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DealCard from '../src/components/ComputeDealMap/DealCard.jsx'

const deal = {
  id: 'nv-crwv-1',
  source: 'NVIDIA',
  target: 'CoreWeave',
  deal_type: 'gpu_purchase',
  value_display: '$6.3B',
  date_display: 'Sep 2025',
  description: 'H100 cluster capacity for Microsoft Azure workloads via CoreWeave.',
  source_url: 'https://example.com/src',
}

describe('DealCard (mobile)', () => {
  it('renders the three information lines', () => {
    render(<DealCard deal={deal} onClickDeal={() => {}} onClickCompany={() => {}} />)
    expect(screen.getByText('NVIDIA')).toBeInTheDocument()
    expect(screen.getByText('CoreWeave')).toBeInTheDocument()
    expect(screen.getByText(/GPU Purchase/)).toBeInTheDocument()
    expect(screen.getByText(/\$6\.3B/)).toBeInTheDocument()
    expect(screen.getByText(/Sep 2025/)).toBeInTheDocument()
    expect(screen.getByText(/H100 cluster capacity/)).toBeInTheDocument()
  })

  it('tapping the card fires onClickDeal with source+target', () => {
    const onClickDeal = vi.fn()
    render(<DealCard deal={deal} onClickDeal={onClickDeal} onClickCompany={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /NVIDIA.*CoreWeave/ }))
    expect(onClickDeal).toHaveBeenCalledWith({ source: 'NVIDIA', target: 'CoreWeave' })
  })

  it('tapping a company name fires onClickCompany and does not fire onClickDeal', () => {
    const onClickDeal = vi.fn()
    const onClickCompany = vi.fn()
    render(<DealCard deal={deal} onClickDeal={onClickDeal} onClickCompany={onClickCompany} />)
    fireEvent.click(screen.getByText('NVIDIA'))
    expect(onClickCompany).toHaveBeenCalledWith('NVIDIA')
    expect(onClickDeal).not.toHaveBeenCalled()
  })

  it('pressing Enter on a company name fires onClickCompany', () => {
    const onClickDeal = vi.fn()
    const onClickCompany = vi.fn()
    render(<DealCard deal={deal} onClickDeal={onClickDeal} onClickCompany={onClickCompany} />)
    const companySpan = screen.getByText('NVIDIA')
    fireEvent.keyDown(companySpan, { key: 'Enter' })
    expect(onClickCompany).toHaveBeenCalledWith('NVIDIA')
    expect(onClickDeal).not.toHaveBeenCalled()
  })
})
