import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SourceCard from '../src/components/ComputeDealMap/SourceCard.jsx'

const row = {
  source: 'Reuters',
  article: 'Broadcom signs long-term deal with Google',
  date: '2026-04',
  url: 'https://example.com/article',
}

describe('SourceCard (mobile)', () => {
  it('renders publisher, date, article, and arrow', () => {
    render(<SourceCard row={row} />)
    expect(screen.getByText('Reuters')).toBeInTheDocument()
    expect(screen.getByText(/2026-04/)).toBeInTheDocument()
    expect(screen.getByText(/Broadcom signs long-term/)).toBeInTheDocument()
  })

  it('wraps the card in an <a> when url is present', () => {
    const { container } = render(<SourceCard row={row} />)
    const anchor = container.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor.getAttribute('href')).toBe('https://example.com/article')
    expect(anchor.getAttribute('target')).toBe('_blank')
  })

  it('falls back to <div> when url is null', () => {
    const { container } = render(<SourceCard row={{ ...row, url: null }} />)
    expect(container.querySelector('a')).toBeNull()
  })
})
