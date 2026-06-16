import { NextResponse } from 'next/server'
import { getLogs } from '@/lib/storage'

export async function GET() {
  try {
    const data = getLogs(100)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
