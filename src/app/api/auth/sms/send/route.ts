import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { otpStore } from '@/lib/otp-store'
import { generateOTP, sendOTP } from '@/lib/sms'

/**
 * Send OTP via SMS
 * POST /api/auth/sms/send
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Check if user exists with this phone number
    const user = await db.user.findFirst({
      where: {
        phone: phone.replace(/\D/g, '') // Remove non-numeric characters
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact admin.' },
        { status: 403 }
      )
    }

    // Generate OTP
    const otp = generateOTP()

    // Store OTP
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5')
    otpStore.set(phone, otp, expiryMinutes)

    // Send SMS
    const smsResult = await sendOTP(phone, otp)

    if (!smsResult.success) {
      console.error('Failed to send OTP:', smsResult.error)
      // For development/testing, include OTP in response if Twilio is not configured
      const isDev = !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN
      return NextResponse.json(
        {
          error: 'Failed to send OTP',
          development: isDev ? otp : undefined // Only for development
        },
        { status: isDev ? 200 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()
    })
  } catch (error) {
    console.error('Error sending OTP:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
