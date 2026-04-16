import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dealDataPlugin from './scripts/vite-plugin-deal-data.mjs'

export default defineConfig({
  plugins: [react(), dealDataPlugin()],
  server: { port: 8002, open: false },
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
  },
})
