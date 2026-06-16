import { NextRequest, NextResponse } from 'next/server'
import { enqueueCommand } from '@/lib/commands'
import { getUsers } from '@/lib/users'
import { getLogs } from '@/lib/storage'

// POST /api/sync?SN=xxx  — queue a user sync command for the device
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sn = searchParams.get('SN')

  if (!sn) {
    return NextResponse.json({ error: 'SN is required' }, { status: 400 })
  }

  enqueueCommand(sn, 'DATA QUERY USERINFO')
  return NextResponse.json({ ok: true, message: `Sync command queued for device ${sn}` })
}

// GET /api/sync — return all users and recent attendance
export async function GET() {
  const users = getUsers()
  const attendance = getLogs(500)
  return NextResponse.json({ users, attendance })
}
