import { NextResponse } from 'next/server'

export async function GET() {
  // For localStorage-based auth, this endpoint returns success
  // The actual auth state is managed by the Zustand store with persist middleware
  return NextResponse.json({ success: true })
}
