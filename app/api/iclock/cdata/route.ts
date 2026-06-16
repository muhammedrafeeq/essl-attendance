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