import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// load .env.local
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

const statusMap = { '0': 'Check In', '1': 'Check Out', '2': 'Break Out', '3': 'Break In', '4': 'OT In', '5': 'OT Out' }

let lastCreatedAt = null

async function poll() {
  try {
    const query = lastCreatedAt
      ? await sql`SELECT * FROM attendance_logs WHERE created_at > ${lastCreatedAt} ORDER BY created_at ASC LIMIT 2`
      : await sql`SELECT * FROM attendance_logs ORDER BY created_at DESC LIMIT 2`

    for (const row of query) {
      console.log(`[${new Date(row.created_at).toLocaleTimeString()}] User: ${row.user_id} | ${statusMap[row.status] || row.status} | Device: ${row.device_sn}`)
      lastCreatedAt = row.created_at
    }
  } catch (err) {
    console.error('DB error:', err.message)
  }
}

console.log('Watching for punches...\n')
poll()
setInterval(poll, 3000)
