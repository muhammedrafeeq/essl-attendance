import { NextRequest } from "next/server";

let lastCmdTime = 0
let cmdId = 1

export async function GET(req: NextRequest) {
  const sn = req.nextUrl.searchParams.get("SN") ?? "unknown";
  console.log(`[GETREQUEST] SN: ${sn}`);

  const now = Date.now()
  if (now - lastCmdTime > 10000) {
    lastCmdTime = now
    const cmd = `C:${cmdId++}:DATA QUERY ATTLOG`
    console.log(`[GETREQUEST] Sending: ${cmd}`)
    return new Response(cmd, { status: 200, headers: { "Content-Type": "text/plain" } })
  }

  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
