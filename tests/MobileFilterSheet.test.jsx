import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MobileFilterSheet from '../src/components/ComputeDealMap/MobileFilterSheet.jsx'

describe('MobileFilterSheet', () => {
  it('does not render children when closed', () => {
    render(
      <MobileFilterSheet isOpen={false} title="Trace" onClose={() => {}}>
        <div>child-content</div>
      </MobileFilterSheet>
    )
    expect(screen.queryByText('child-content')).toBeNull()
  })

  it('renders the title, children, and a Done button when open', () => {
    render(
      <MobileFilterSheet isOpen title="Trace" onClose={() => {}}>
        <div>child-content</div>
      </MobileFilterSheet>
    )
    expect(screen.getByText('Trace')).toBeInTheDocument()
    expect(screen.getByText('child-content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })

  it('calls onClose when Done is pressed', () => {
    const onClose = vi.fn()
    render(
      <MobileFilterSheet isOpen title="Trace" onClose={onClose}>
        <div>child-content</div>
      </MobileFilterSheet>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onClose).toHaveBeenCalled()
  })
})
