import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SourcesSection from '../src/components/ComputeDealMap/SourcesSection.jsx'

function mockMatchMedia(matches) {
  vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

describe('SourcesSection responsive mode', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('renders the column table on desktop', () => {
    mockMatchMedia(false)
    render(<SourcesSection />)
    expect(screen.getByText('Data Sources')).toBeInTheDocument()
    expect(screen.getByText('Article / Report')).toBeInTheDocument()
  })

  it('renders the card list on mobile (no Article / Report header)', () => {
    mockMatchMedia(true)
    render(<SourcesSection />)
    expect(screen.getByText('Data Sources')).toBeInTheDocument()
    expect(screen.queryByText('Article / Report')).toBeNull()
  })
})
