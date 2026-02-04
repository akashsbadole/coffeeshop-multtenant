import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter } from '@/lib/rate-limit'

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: Date
}

const defaultLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 100
})

const strictLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 10
})

const authLimiter = createRateLimiter({
  windowMs: 900000,
  maxRequests: 5,
  skipSuccessfulRequests: true
})

export async function checkRateLimit(
  identifier: string,
  limitType: 'default' | 'strict' | 'auth' = 'default'
): Promise<RateLimitResult> {
  let limiter = defaultLimiter

  switch (limitType) {
    case 'strict':
      limiter = strictLimiter
      break
    case 'auth':
      limiter = authLimiter
      break
  }

  const result = limiter.check(identifier)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    resetTime: result.resetTime
  }
}

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limitType: 'default' | 'strict' | 'auth' = 'default'
) {
  return async (req: NextRequest) => {
    const identifier = getIdentifier(req)
    const result = await checkRateLimit(identifier, limitType)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.getTime().toString()
          }
        }
      )
    }

    const response = await handler(req)

    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.resetTime.getTime().toString())

    return response
  }
}

export function createRateLimitMiddleware(
  limitType: 'default' | 'strict' | 'auth' = 'default'
) {
  return async function rateLimitMiddleware(req: NextRequest) {
    const identifier = getIdentifier(req)
    const result = await checkRateLimit(identifier, limitType)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000),
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

    return NextResponse.next()
  }
}

function getIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')

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

  // Fallback to unknown since req.ip doesn't exist on NextRequest
  return 'unknown'
}
