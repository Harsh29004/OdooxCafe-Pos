import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend dev server. /api and /ws are proxied to the Node backend on :8000,
// so the browser talks to a single origin and there are no CORS surprises.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws': { target: 'http://localhost:8000', ws: true },
    },
  },
})
