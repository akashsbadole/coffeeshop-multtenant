import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter } from '@/lib/rate-limit'

// Create a limiter for each endpoint with appropriate limits
const orderLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 100
})

const authLimiter = createRateLimiter({
  // 15 minute window
  windowMs: 900000,
  maxRequests: 5,
  skipSuccessfulRequests: true // Only count failed attempts
})

const strictLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 10
})

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const result = orderLimiter.check(identifier)

  if (!result.success) {
    return new NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.getTime().toString(),
          'Retry-After': Math.ceil((result.resetTime.getTime() - Date.now()) / 1000).toString()
        }
      }
    )
  }

  // Your actual GET logic here
  const data = {
    orders: [],
    summary: {
      total: 0,
      todayRevenue: 0,
      todayOrders: 0
    }
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const result = orderLimiter.check(identifier)

  if (!result.success) {
    return new NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.getTime().toString(),
          'Retry-After': Math.ceil((result.resetTime.getTime() - Date.now()) / 1000).toString()
        }
      }
    )
  }

  const body = await request.json()
  
  const order = {
    id: crypto.randomUUID(),
    ...body,
    createdAt: new Date().toISOString()
  }

  return NextResponse.json({
    success: true,
    order
  })
}

export async function PUT(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const result = orderLimiter.check(identifier)

  if (!result.success) {
    return new NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.getTime().toString(),
          'Retry-After': Math.ceil((result.resetTime.getTime() - Date.now()) / 1000).toString()
        }
      }
    )
  }

  const { id } = await request.json()
  // Your update logic here

  return NextResponse.json({ success: true })
}

// Helper function to get client identifier
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim())
    return ips[0]
  }

  if (realIp) {
    return realIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return request.ip || 'unknown'
}
