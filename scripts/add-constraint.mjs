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

// remove duplicates keeping the earliest row
await sql`
  DELETE FROM attendance_logs
  WHERE id NOT IN (
    SELECT MIN(id::text)::uuid
    FROM attendance_logs
    GROUP BY user_id, timestamp, device_sn
  )
`
console.log('Duplicates removed.')

await sql`ALTER TABLE attendance_logs ADD CONSTRAINT unique_punch UNIQUE (user_id, timestamp, device_sn)`
console.log('Unique constraint added.')
