import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { AttendanceLog } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const device = searchParams.get('device')
  const status = searchParams.get('status')
  const userId = searchParams.get('user_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '200'), 500)

  try {
    const from = searchParams.get('from')
  const to = searchParams.get('to')

  const rows = await sql`
      SELECT id, user_id, timestamp, status, verify, device_sn, created_at
      FROM attendance_logs
      WHERE (${device}::text IS NULL OR device_sn = ${device})
        AND (${status}::text IS NULL OR status = ${status})
        AND (${userId}::text IS NULL OR user_id = ${userId})
        AND (${from}::text IS NULL OR timestamp >= ${from}::timestamptz)
        AND (${to}::text IS NULL OR timestamp <= ${to}::timestamptz)
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return NextResponse.json(rows as AttendanceLog[])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
