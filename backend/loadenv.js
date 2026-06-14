// loadenv.js — load the project-root .env into process.env for the Node backend.
//
// Vite loads .env automatically for the frontend, but plain Node does not. The
// seed module (../src/store/seed.js) reads VITE_* values at evaluation time, so
// this must run BEFORE that module is imported. Import it as the very first
// import in any backend entry point and ESM will evaluate it first.
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

try {
  // Node 20.12+/21.7+: loads KEY=value pairs into process.env.
  process.loadEnvFile(path.join(__dirname, '..', '.env'))
} catch {
  // No .env present (or unreadable) — the seed falls back to safe defaults.
}
