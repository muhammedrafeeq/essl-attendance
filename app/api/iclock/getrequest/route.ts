// import { NextRequest, NextResponse } from 'next/server'
// import { dequeueCommand } from '@/lib/commands'

// export async function GET(request: NextRequest) {
//   const { searchParams } = new URL(request.url)
//   const sn = searchParams.get('SN') || 'unknown'

//   console.log(`[ESSL] GETREQUEST - SN: ${sn}, URL: ${request.url}`)

//   const command = dequeueCommand(sn)

//   if (command) {
//     console.log(`[ESSL] Sending command to ${sn}: ${command.cmd}`)
//     return new NextResponse(`C:${command.id}:${command.cmd}`, {
//       status: 200,
//       headers: { 'Content-Type': 'text/plain' },
//     })
//   }

//   return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
// }
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("========== GETREQUEST ==========");
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  req.nextUrl.searchParams.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });

  return new Response("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  console.log("========== GETREQUEST POST ==========");
  console.log("URL:", req.url);
  console.log("BODY:", body);

  return new Response("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}