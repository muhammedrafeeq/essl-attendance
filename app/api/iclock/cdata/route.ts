import { NextRequest, NextResponse } from 'next/server'
import { insertLogs } from '@/lib/storage'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sn = searchParams.get('SN') || 'unknown'

  console.log(`[ESSL] Device check-in from SN: ${sn}`)

  const responseText = [
    'GET OPTION FROM:' + sn,
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

  return new NextResponse(responseText, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sn = searchParams.get('SN') || 'unknown'
  const table = searchParams.get('table') || ''

  console.log(`[ESSL] POST /cdata from SN: ${sn}, table: ${table}`)

  if (table !== 'ATTLOG') {
    console.log(`[ESSL] Ignoring non-ATTLOG table: ${table}`)
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  let body = ''
  try {
    body = await request.text()
  } catch {
    console.log('[ESSL] Empty or unreadable body')
  }

  console.log(`[ESSL] Raw body: ${body}`)

  if (!body || body.trim() === '') {
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const lines = body.trim().split('\n').filter((line) => line.trim())
  const records: { user_id: string; timestamp: string; status: string; verify: string; device_sn: string }[] = []

  for (const line of lines) {
    const parts = line.trim().split('\t')
    if (parts.length < 4) {
      console.log(`[ESSL] Skipping malformed line: ${line}`)
      continue
    }

    const [userId, timestamp, status, verify] = parts
    records.push({
      user_id: userId,
      timestamp: timestamp,
      status: status || '0',
      verify: verify || '0',
      device_sn: sn,
    })
  }

  if (records.length > 0) {
    console.log(`[ESSL] Inserting ${records.length} attendance records`)
    try {
      insertLogs(records)
      console.log(`[ESSL] Successfully saved ${records.length} records`)
    } catch (err) {
      console.error('[ESSL] Storage error:', err)
    }
  }

  return new NextResponse('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}
