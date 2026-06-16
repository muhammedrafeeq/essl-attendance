import sql from './db'
import { AttendanceLog } from './types'

export async function insertLogs(
  records: Omit<AttendanceLog, 'id' | 'created_at'>[]
): Promise<void> {
  if (records.length === 0) return
  for (const r of records) {
    await sql`
      INSERT INTO attendance_logs (user_id, timestamp, status, verify, device_sn)
      VALUES (${r.user_id}, ${r.timestamp}, ${r.status}, ${r.verify}, ${r.device_sn})
    `
  }
}

export async function getLogs(limit = 100): Promise<AttendanceLog[]> {
  const rows = await sql`
    SELECT id, user_id, timestamp, status, verify, device_sn, created_at
    FROM attendance_logs
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return rows as AttendanceLog[]
}
