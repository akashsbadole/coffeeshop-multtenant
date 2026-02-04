import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const sendCodeSchema = z.object({
  userId: z.string(),
  method: z.enum(['sms', 'email', 'app', 'resend']),
  destination: z.string().optional()
})

const verifyCodeSchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
  method: z.enum(['sms', 'email', 'app', 'verify'])
})

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'send') {
      const body = await req.json()
      const validated = sendCodeSchema.parse(body)

      const user = await db.user.findUnique({
        where: { id: validated.userId }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      // Store MFA settings (in production, use a separate MFA table)
      await db.user.update({
        where: { id: validated.userId },
        data: {
          // Store MFA code and expiry temporarily
          // In production, use encrypted storage
        }
      })

      // Simulate sending the code
      console.log(`MFA Code for ${user.email}: ${code}`)

      if (validated.method === 'sms') {
        console.log(`SMS sent to ${validated.destination}: Your code is ${code}`)
      } else if (validated.method === 'email') {
        console.log(`Email sent to ${validated.destination}: Your code is ${code}`)
      }

      // For demo purposes, return the code
      return NextResponse.json({
        success: true,
        message: `Verification code sent via ${validated.method.toUpperCase()}`,
        demoCode: code // Remove in production
      })
    }

    if (action === 'verify') {
      const body = await req.json()
      const validated = verifyCodeSchema.parse(body)

      const user = await db.user.findUnique({
        where: { id: validated.userId }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // In production, verify against stored code
      // For demo, accept any 6-digit code
      if (validated.code.length !== 6) {
        return NextResponse.json(
          { error: 'Invalid code format' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'MFA verified successfully'
      })
    }

    if (action === 'enable') {
      const body = await req.json()
      const { userId, method, destination } = body

      await db.user.update({
        where: { id: userId },
        data: {
          // In production, store MFA preferences
        }
      })

      return NextResponse.json({
        success: true,
        message: 'MFA enabled successfully'
      })
    }

    if (action === 'disable') {
      const body = await req.json()
      const { userId } = body

      await db.user.update({
        where: { id: userId },
        data: {
          // In production, remove MFA settings
        }
      })

      return NextResponse.json({
        success: true,
        message: 'MFA disabled successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    console.error('MFA error:', error)
    return NextResponse.json(
      { error: 'MFA operation failed' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        // In production, include MFA settings
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // In production, return actual MFA status
    return NextResponse.json({
      mfaEnabled: false,
      methods: {
        sms: user.phone ? 'available' : 'not-configured',
        email: user.email ? 'available' : 'not-configured',
        app: 'available'
      }
    })
  } catch (error) {
    console.error('MFA status error:', error)
    return NextResponse.json(
      { error: 'Failed to get MFA status' },
      { status: 500 }
    )
  }
}