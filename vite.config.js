import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dealDataPlugin from './scripts/vite-plugin-deal-data.mjs'

export default defineConfig({
  plugins: [react(), dealDataPlugin()],
  server: { port: 8002, open: false },
})
