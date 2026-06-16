import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("========== iClock GETREQUEST ==========");

  const sn = req.nextUrl.searchParams.get("SN") ?? "";
  console.log("Device SN:", sn);

  const now = new Date();
  const date = formatDate(now);

  const response = [
    `GET OPTION FROM: ${sn}`,
    `Date=${date}`,
    `STAMP=9999`,
    `ERRORDELAY=30`,
    `DELAY=30`,
    `TRANSINTERVAL=1`,
    `REALTIME=1`,
    `ATTLOGSTAMP=9999`,
    `OPERLOGSTAMP=9999`,
    `ATTPHOTOSTAMP=9999`,
  ].join("\r\n");

  console.log("Response:", response);

  return new Response(response, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}