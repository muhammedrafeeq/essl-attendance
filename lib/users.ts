import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

export interface DeviceUser {
  pin: string
  name: string
  card: string
  role: string
  device_sn: string
  synced_at: string
}

function readUsers(): DeviceUser[] {
  if (!fs.existsSync(USERS_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) as DeviceUser[]
  } catch {
    return []
  }
}

export function upsertUsers(incoming: Omit<DeviceUser, 'synced_at'>[]): void {
  const existing = readUsers()
  const now = new Date().toISOString()

  for (const u of incoming) {
    const idx = existing.findIndex((e) => e.pin === u.pin && e.device_sn === u.device_sn)
    const record: DeviceUser = { ...u, synced_at: now }
    if (idx !== -1) {
      existing[idx] = record
    } else {
      existing.push(record)
    }
  }

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(USERS_FILE, JSON.stringify(existing, null, 2), 'utf-8')
}

export function getUsers(): DeviceUser[] {
  return readUsers()
}
