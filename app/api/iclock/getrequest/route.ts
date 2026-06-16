import { NextRequest, NextResponse } from 'next/server'
import { dequeueCommand } from '@/lib/commands'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sn = searchParams.get('SN') || searchParams.get('sn') || searchParams.get('serialno') || 'unknown'

  console.log(`[ESSL] GETREQUEST - SN: ${sn}`)

  const command = dequeueCommand(sn)

  if (command) {
    console.log(`[ESSL] Sending command to ${sn}: ${command.cmd}`)
    return new NextResponse(`C:${command.id}:${command.cmd}`, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
}
