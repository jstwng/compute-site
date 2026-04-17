import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Toolbar from '../src/components/ComputeDealMap/Toolbar.jsx'

const baseProps = {
  search: '',
  onSearch: () => {},
  traceOrigin: null,
  traceDestination: null,
  reachableFromOrigin: null,
  tracePaths: null,
  tracePathIndex: -1,
  traceNoPath: false,
  traceNoPathBoth: false,
  onChangeTraceOrigin: () => {},
  onChangeTraceDestination: () => {},
  onSwapTrace: () => {},
  onClearTrace: () => {},
  onSelectTracePath: () => {},
  timelineFrom: '2003-12',
  timelineTo: '2026-04',
  timelineCount: 186,
  onChangeTimeline: () => {},
  onClearTimeline: () => {},
  clusterCategories: new Set(),
  clusterCount: 0,
  onToggleCluster: () => {},
  onClearCluster: () => {},
  pathEdgeTypes: null,
}

describe('Toolbar', () => {
  it('renders search input and three primary dropdowns', () => {
    render(<Toolbar {...baseProps} />)
    expect(screen.getByPlaceholderText('Search companies, deals, categories')).toBeInTheDocument()
    expect(screen.getByText('Trace:')).toBeInTheDocument()
    expect(screen.getByText('Timeline:')).toBeInTheDocument()
    expect(screen.getByText('Cluster:')).toBeInTheDocument()
  })

  it('fires onSearch as the user types', () => {
    const onSearch = vi.fn()
    render(<Toolbar {...baseProps} onSearch={onSearch} />)
    fireEvent.change(screen.getByPlaceholderText('Search companies, deals, categories'), {
      target: { value: 'NVDA' },
    })
    expect(onSearch).toHaveBeenCalledWith('NVDA')
  })

  it('shows Off as the default Trace value when neither endpoint is set', () => {
    render(<Toolbar {...baseProps} />)
    // Find the Trace button and verify its display value
    const traceButton = screen.getByText('Trace:').closest('button')
    expect(traceButton).toBeInTheDocument()
    expect(traceButton.textContent).toContain('Off')
  })

  it('shows the year range as the Timeline value', () => {
    render(<Toolbar {...baseProps} timelineFrom="2018-01" timelineTo="2026-12" />)
    const timelineButton = screen.getByText('Timeline:').closest('button')
    expect(timelineButton.textContent).toContain('2018 to 2026')
  })
})

function mockMatchMedia(matches) {
  vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

describe('Toolbar mobile mode', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('renders three chip buttons in a grid when mobile', () => {
    mockMatchMedia(true)
    render(<Toolbar {...baseProps} />)
    expect(screen.getByText('Trace:')).toBeInTheDocument()
    expect(screen.getByText('Timeline:')).toBeInTheDocument()
    expect(screen.getByText('Cluster:')).toBeInTheDocument()
  })

  it('tapping the Trace chip opens a MobileFilterSheet titled Trace', () => {
    mockMatchMedia(true)
    render(<Toolbar {...baseProps} />)
    fireEvent.click(screen.getByText('Trace:').closest('button'))
    const sheetTitle = screen.getAllByText('Trace').find(n => n.tagName === 'H3')
    expect(sheetTitle).toBeTruthy()
  })
})
