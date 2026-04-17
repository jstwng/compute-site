import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Dropdown from '../src/components/ComputeDealMap/Dropdown.jsx'

function mockMatchMedia(matches) {
  vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]

describe('Dropdown nativeOnMobile', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('renders the custom panel by default on mobile', () => {
    mockMatchMedia(true)
    const { container } = render(
      <Dropdown label="X" options={options} value="a" onChange={() => {}} />
    )
    expect(container.querySelector('select')).toBeNull()
  })

  it('renders a <select> when nativeOnMobile is true and viewport is mobile', () => {
    mockMatchMedia(true)
    const onChange = vi.fn()
    const { container } = render(
      <Dropdown
        label="X"
        options={options}
        value="a"
        onChange={onChange}
        nativeOnMobile
      />
    )
    const select = container.querySelector('select')
    expect(select).not.toBeNull()
    expect(select.value).toBe('a')
    fireEvent.change(select, { target: { value: 'b' } })
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('renders the custom panel when nativeOnMobile is true but viewport is desktop', () => {
    mockMatchMedia(false)
    const { container } = render(
      <Dropdown
        label="X"
        options={options}
        value="a"
        onChange={() => {}}
        nativeOnMobile
      />
    )
    expect(container.querySelector('select')).toBeNull()
  })
})
