import fs from 'fs'
import path from 'path'
import { AttendanceLog } from './types'

const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(process.cwd(), 'data')
const LOGS_FILE = path.join(DATA_DIR, 'attendance_logs.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readLogs(): AttendanceLog[] {
  ensureDataDir()
  if (!fs.existsSync(LOGS_FILE)) {
    return []
  }
  try {
    const raw = fs.readFileSync(LOGS_FILE, 'utf-8')
    return JSON.parse(raw) as AttendanceLog[]
  } catch {
    return []
  }
}

function writeLogs(logs: AttendanceLog[]) {
  ensureDataDir()
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8')
}

export function insertLogs(
  records: Omit<AttendanceLog, 'id' | 'created_at'>[]
): AttendanceLog[] {
  const existing = readLogs()
  const now = new Date().toISOString()

  const newLogs: AttendanceLog[] = records.map((r) => ({
    id: crypto.randomUUID(),
    created_at: now,
    ...r,
  }))

  const updated = [...newLogs, ...existing]
  writeLogs(updated)
  return newLogs
}

export function getLogs(limit = 100): AttendanceLog[] {
  const logs = readLogs()
  // Already stored newest-first; just slice
  return logs.slice(0, limit)
}
