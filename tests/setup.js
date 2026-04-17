import '@testing-library/jest-dom/vitest'

// jsdom does not implement matchMedia; define a no-op default so tests
// can spy on or override it. Individual tests may replace with mocks.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}
