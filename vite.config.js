import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend dev server. In production on Vercel, /api/* routes to serverless
// functions automatically. For local development, use `vercel dev` which
// handles both the Vite dev server and the serverless functions.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
})

