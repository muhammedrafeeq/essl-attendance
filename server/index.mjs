import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const lines = readFileSync(envPath, 'utf-8').split('\n')
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

import express from 'express'
import cors from 'cors'
import ngrok from '@ngrok/ngrok'
import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const QUEUE_FILE = path.join(DATA_DIR, 'commands.json')

// ── DB ────────────────────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL
const sql = DATABASE_URL ? neon(DATABASE_URL) : null

// ── Command queue (file-based, shared with Next.js dev) ───────────────────────
function readQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return []
  try { return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8')) } catch { return [] }
}
function writeQueue(q) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2))
}
function dequeueCommand(sn) {
  const q = readQueue()
  const idx = q.findIndex(c => c.sn === sn)
  if (idx === -1) return null
  const [cmd] = q.splice(idx, 1)
  writeQueue(q)
  return cmd
}
function enqueueCommand(sn, cmd) {
  const q = readQueue()
  const command = { id: Date.now(), sn, cmd, issued_at: new Date().toISOString() }
  q.push(command)
  writeQueue(q)
  return command
}

// ── DB helpers ────────────────────────────────────────────────────────────────
async function insertLogs(records) {
  if (!sql) return console.log('[DB] No DATABASE_URL, skipping insert')
  for (const r of records) {
    await sql`INSERT INTO attendance_logs (user_id, timestamp, status, verify, device_sn)
              VALUES (${r.user_id}, ${r.timestamp}, ${r.status}, ${r.verify}, ${r.device_sn})`
  }
}
async function upsertUsers(users) {
  if (!sql) return console.log('[DB] No DATABASE_URL, skipping upsert')
  for (const u of users) {
    await sql`INSERT INTO device_users (pin, name, card, role, device_sn)
              VALUES (${u.pin}, ${u.name}, ${u.card}, ${u.role}, ${u.device_sn})
              ON CONFLICT (pin, device_sn) DO UPDATE
              SET name = EXCLUDED.name, card = EXCLUDED.card, role = EXCLUDED.role, synced_at = now()`
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSN(req) {
  return req.query.SN || req.query.sn || req.query.serialno || 'unknown'
}

// ── Express ───────────────────────────────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.text({ type: '*/*' }))

// GET /iclock/cdata — device initial check-in
app.get(['/iclock/cdata', '/iclock/cdata.aspx'], (req, res) => {
  const sn = getSN(req)
  console.log(`[CDATA GET] SN: ${sn}`)

  const body = [
    `GET OPTION FROM:${sn}`,
    'ATTLOGStamp=None',
    'OPERLOGStamp=9999',
    'ATTPHOTOStamp=None',
    'ErrorDelay=30',
    'Delay=10',
    'TransTimes=00:00;14:05',
    'TransInterval=1',
    'TransFlag=TransData AttLog OpLog AttPhoto EnrollUser ChgUser EnrollFP ChgFP UserPic',
    'TimeZone=5.5',
    'Realtime=1',
    'Encrypt=None',
  ].join('\n')

  res.type('text/plain').send(body)
})

// POST /iclock/cdata — device pushes attendance or user data
app.post(['/iclock/cdata', '/iclock/cdata.aspx'], async (req, res) => {
  const sn = getSN(req)
  const table = req.query.table || ''
  const body = req.body || ''

  console.log(`[CDATA POST] SN: ${sn}, table: ${table}`)
  console.log(`[CDATA POST] Body: ${body}`)

  if (table === 'USERINFO') {
    const users = body.trim().split('\n').filter(Boolean).map(line => {
      const [pin, name, , card, role] = line.trim().split('\t')
      return { pin: pin||'', name: name||'', card: card||'', role: role||'0', device_sn: sn }
    }).filter(u => u.pin)
    if (users.length > 0) {
      await upsertUsers(users)
      console.log(`[CDATA POST] Synced ${users.length} users`)
    }
    return res.type('text/plain').send('OK')
  }

  if (table === 'ATTLOG') {
    const records = []
    for (const line of body.trim().split('\n').filter(Boolean)) {
      const parts = line.trim().split('\t')
      if (parts.length < 4) continue
      const [user_id, timestamp, status, verify] = parts
      records.push({ user_id, timestamp, status: status||'0', verify: verify||'0', device_sn: sn })
    }
    if (records.length > 0) {
      await insertLogs(records)
      console.log(`[CDATA POST] Saved ${records.length} attendance records`)
    }
  }

  res.type('text/plain').send('OK')
})

// GET /iclock/getrequest — device polls for commands
app.get(['/iclock/getrequest', '/iclock/getrequest.aspx'], (req, res) => {
  const sn = getSN(req)
  console.log(`[GETREQUEST] SN: ${sn}`)

  const command = dequeueCommand(sn)
  if (command) {
    console.log(`[GETREQUEST] Sending command: ${command.cmd}`)
    return res.type('text/plain').send(`C:${command.id}:${command.cmd}`)
  }

  res.type('text/plain').send('OK')
})

// POST /iclock/devicecmd — device acknowledges a command
app.post(['/iclock/devicecmd', '/iclock/devicecmd.aspx'], (req, res) => {
  const sn = getSN(req)
  console.log(`[DEVICECMD] SN: ${sn}, body: ${req.body}`)
  res.type('text/plain').send('OK')
})

// POST /api/sync — queue a user sync command
app.post('/api/sync', (req, res) => {
  const sn = req.query.SN
  if (!sn) return res.status(400).json({ error: 'SN is required' })
  enqueueCommand(sn, 'DATA QUERY USERINFO')
  res.json({ ok: true, message: `Sync command queued for device ${sn}` })
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001

app.listen(PORT, async () => {
  console.log(`\n✓ Express server running on http://localhost:${PORT}`)

  if (process.env.NGROK_AUTHTOKEN) {
    const listener = await ngrok.connect({
      addr: PORT,
      authtoken: process.env.NGROK_AUTHTOKEN,
    })
    console.log(`✓ ngrok tunnel: ${listener.url()}`)
    console.log(`\nSet this on your ESSL device:`)
    console.log(`  Server Address: ${listener.url().replace('https://', '')}`)
    console.log(`  Port: 443 / HTTPS: ON\n`)
  } else {
    console.log('\n⚠ Set NGROK_AUTHTOKEN env var to enable ngrok tunnel')
    console.log('  Get your token at: https://dashboard.ngrok.com/get-started/your-authtoken\n')
  }
})
