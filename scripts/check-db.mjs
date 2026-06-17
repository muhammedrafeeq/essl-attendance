import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'

try {
  const lines = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
} catch { /* no .env.local */ }

const sql = neon(process.env.DATABASE_URL)
const rows = await sql`SELECT user_id, timestamp, status, device_sn, created_at FROM attendance_logs ORDER BY created_at DESC LIMIT 2`

if (rows.length === 0) {
  console.log('No records in DB.')
} else {
  console.log(`${rows.length} records found:\n`)
  for (const r of rows) {
    console.log(`User: ${r.user_id} | ${r.timestamp} | ${r.status} | ${r.device_sn}`)
  }
}
