import { NextResponse } from 'next/server'

export async function POST() {
  // For localStorage-based auth, this endpoint confirms logout
  // The actual auth state is cleared by the client-side Zustand store
  return NextResponse.json({ success: true, message: 'Logged out successfully' })
}
