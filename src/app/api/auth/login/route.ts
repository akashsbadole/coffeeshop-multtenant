import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createRateLimiter } from '@/lib/rate-limit'

const loginLimiter = createRateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 5,
  skipSuccessfulRequests: true
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('[LOGIN] Login attempt for email:', email)

    if (!email || !password) {
      console.log('[LOGIN] Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const rateLimitResult = loginLimiter.check(email)

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)
      const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60)

      console.log('[LOGIN] Rate limit exceeded for:', email)

      return NextResponse.json(
        {
          error: 'Too many login attempts',
          message: `Too many failed login attempts. Please try again in ${retryAfterMinutes} minutes.`,
          retryAfter: retryAfterSeconds
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.getTime().toString(),
            'Retry-After': retryAfterSeconds.toString()
          }
        }
      )
    }

    console.log('[LOGIN] Querying database for user:', email)
    
    // Use findFirst since User has a compound unique constraint on [organizationId, email]
    const user = await db.user.findFirst({
      where: { email },
      include: {
        organization: true
      }
    })

    console.log('[LOGIN] Database query result:', user ? 'User found' : 'User not found')

    if (!user) {
      console.log('[LOGIN] User not found for email:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log('[LOGIN] User found, checking password')
    console.log('[LOGIN] Stored password length:', user.password?.length || 0)
    console.log('[LOGIN] Input password length:', password?.length || 0)

    if (user.password !== password) {
      console.log('[LOGIN] Password mismatch for user:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log('[LOGIN] Password verified, preparing response')

    // Safely extract user data, handling undefined organization
    const { password: _, organization, ...safeUser } = user
    const organizationWithoutSensitive = organization ? {
      id: organization.id,
      name: organization.name,
      email: organization.email,
      phone: organization.phone,
      gstin: organization.gstin,
      address: organization.address,
      city: organization.city,
      state: organization.state,
      pincode: organization.pincode,
      country: organization.country,
      timezone: organization.timezone,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt
    } : null

    loginLimiter.reset(email)

    console.log('[LOGIN] Login successful for user:', email)

    return NextResponse.json({
      user: safeUser,
      organization: organizationWithoutSensitive,
      message: 'Login successful'
    })
  } catch (error: any) {
    console.error('[LOGIN] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    })
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    )
  }
}
