import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useMediaQuery from '../src/components/ComputeDealMap/useMediaQuery.js'

describe('useMediaQuery', () => {
  let listeners = []
  let matches = false
  const fakeMql = {
    get matches() { return matches },
    addEventListener: (_evt, cb) => listeners.push(cb),
    removeEventListener: (_evt, cb) => { listeners = listeners.filter(l => l !== cb) },
  }

  beforeEach(() => {
    listeners = []
    matches = false
    vi.spyOn(window, 'matchMedia').mockImplementation(() => fakeMql)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false when query does not match on mount', () => {
    matches = false
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(false)
  })

  it('returns true when query matches on mount', () => {
    matches = true
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(true)
  })

  it('updates when the media query changes', () => {
    matches = false
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'))
    expect(result.current).toBe(false)
    act(() => {
      matches = true
      listeners.forEach(l => l({ matches: true }))
    })
    expect(result.current).toBe(true)
  })
})
