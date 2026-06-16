import { NextRequest, NextResponse } from 'next/server'
import { enqueueCommand } from '@/lib/commands'
import { getUsers } from '@/lib/users'
import { getLogs } from '@/lib/storage'

export async function POST(request: NextRequest) {
  const sn = request.nextUrl.searchParams.get('SN')

  if (!sn) {
    return NextResponse.json({ error: 'SN is required' }, { status: 400 })
  }

  enqueueCommand(sn, 'DATA QUERY USERINFO')
  return NextResponse.json({ ok: true, message: `Sync command queued for device ${sn}` })
}

export async function GET() {
  const [users, attendance] = await Promise.all([getUsers(), getLogs(500)])
  return NextResponse.json({ users, attendance })
}
