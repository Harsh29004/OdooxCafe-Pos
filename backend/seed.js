// seed.js — populate the database from the SAME seed the frontend ships with,
// so there is one source of truth. Runs automatically on first boot (empty DB),
// or force a reset with:  node seed.js --reset
import { isEmpty } from './db.js'
import { saveState } from './state.js'
import { buildInitialState } from '../src/store/seed.js'

export function seedIfEmpty({ force = false } = {}) {
  if (!force && !isEmpty()) return false
  const { session, ...domain } = buildInitialState() // session is per-client, not stored
  saveState(domain)
  return true
}

// Allow running directly:  npm run seed  (package.json passes --reset)
const isMain = process.argv[1] && process.argv[1].endsWith('seed.js')
if (isMain) {
  const force = process.argv.includes('--reset')
  const did = seedIfEmpty({ force })
  console.log(did ? '✓ Database seeded.' : '• Database already has data (use --reset to overwrite).')
}
