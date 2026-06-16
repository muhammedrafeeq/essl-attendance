// import { NextRequest, NextResponse } from 'next/server'
// import { insertLogs } from '@/lib/storage'
// import { upsertUsers } from '@/lib/users'

// export async function GET(request: NextRequest) {
//   const { searchParams } = new URL(request.url)
//   const sn = searchParams.get('SN') || 'unknown'

//   console.log(`[ESSL] CDATA GET - SN: ${sn}, URL: ${request.url}`)

//   const responseText = [
//     'GET OPTION FROM:' + sn,
//     'ATTLOGStamp=None',
//     'OPERLOGStamp=9999',
//     'ATTPHOTOStamp=None',
//     'ErrorDelay=30',
//     'Delay=10',
//     'TransTimes=00:00;14:05',
//     'TransInterval=1',
//     'TransFlag=TransData AttLog OpLog AttPhoto EnrollUser ChgUser EnrollFP ChgFP UserPic',
//     'TimeZone=5.5',
//     'Realtime=1',
//     'Encrypt=None',
//   ].join('\n')

//   return new NextResponse(responseText, {
//     status: 200,
//     headers: { 'Content-Type': 'text/plain' },
//   })
// }

// export async function POST(request: NextRequest) {
//   const { searchParams } = new URL(request.url)
//   const sn = searchParams.get('SN') || 'unknown'
//   const table = searchParams.get('table') || ''

//   console.log(`[ESSL] CDATA POST - SN: ${sn}, table: ${table}, URL: ${request.url}`)

//   if (table === 'USERINFO') {
//     let body = ''
//     try { body = await request.text() } catch { /* empty */ }

//     console.log(`[ESSL] USERINFO body: ${body}`)

//     const lines = body.trim().split('\n').filter((l) => l.trim())
//     const users = lines.map((line) => {
//       const [pin, name, , card, role] = line.trim().split('\t')
//       return { pin: pin || '', name: name || '', card: card || '', role: role || '0', device_sn: sn }
//     }).filter((u) => u.pin)

//     if (users.length > 0) {
//       upsertUsers(users)
//       console.log(`[ESSL] Synced ${users.length} users from ${sn}`)
//     }

//     return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
//   }

//   if (table !== 'ATTLOG') {
//     console.log(`[ESSL] Ignoring table: ${table}`)
//     return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
//   }

//   let body = ''
//   try { body = await request.text() } catch { /* empty */ }

//   console.log(`[ESSL] ATTLOG body: ${body}`)

//   if (!body || body.trim() === '') {
//     return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
//   }

//   const lines = body.trim().split('\n').filter((line) => line.trim())
//   const records: { user_id: string; timestamp: string; status: string; verify: string; device_sn: string }[] = []

//   for (const line of lines) {
//     const parts = line.trim().split('\t')
//     if (parts.length < 4) continue
//     const [userId, timestamp, status, verify] = parts
//     records.push({ user_id: userId, timestamp, status: status || '0', verify: verify || '0', device_sn: sn })
//   }

//   if (records.length > 0) {
//     try {
//       insertLogs(records)
//       console.log(`[ESSL] Saved ${records.length} attendance records`)
//     } catch (err) {
//       console.error('[ESSL] Storage error:', err)
//     }
//   }

//   return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
// }
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("========== CDATA GET ==========");
  console.log("URL:", req.url);

  return new Response("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  console.log("========== CDATA POST ==========");
  console.log("URL:", req.url);
  console.log("BODY:", body);

  return new Response("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}