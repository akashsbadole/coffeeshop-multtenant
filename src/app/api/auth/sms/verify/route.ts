import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { otpStore } from '@/lib/otp-store'

/**
 * Verify OTP and authenticate user
 * POST /api/auth/sms/verify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, otp } = body

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      )
    }

    // Verify OTP
    const isValid = otpStore.verify(phone, otp)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findFirst({
      where: {
        phone: phone.replace(/\D/g, '')
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user info (in production, you might want to generate a JWT token)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      },
      message: 'Login successful'
    })
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
