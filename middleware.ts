import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  console.log(`[REQ] ${request.method} ${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.next()
}

export const config = {
  matcher: '/iclock/:path*',
}
