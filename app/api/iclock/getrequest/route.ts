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