import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter } from '@/lib/rate-limit'
import { createRateLimitMiddleware, getClientIdentifier } from '@/lib/rate-limit-middleware'

// Rate limiter for all API endpoints: 60 requests per minute
const apiLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 60
})

// Rate limiter for login attempts: 5 attempts per 15 minutes
const loginLimiter = createRateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 5,
  skipSuccessfulRequests: true // Only count failed attempts
})

// Rate limiter for sensitive operations: 10 requests per minute
const strictLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 10
})

// Helper function to check rate limit
function checkRateLimit(
  limiter: ReturnType<typeof createRateLimiter>,
  identifier: string,
  success?: boolean
): NextResponse | null {
  const result = limiter.check(identifier, success)
  
  if (!result.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.getTime().toString(),
          'X-RateLimit-Window': result.windowMs.toString(),
          'Retry-After': Math.ceil((result.resetTime.getTime() - Date.now()) / 1000).toString()
        }
      }
    )
  }
  
  return null
}

// Example API route with rate limiting
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  
  // Check rate limit
  const rateLimitResponse = checkRateLimit(apiLimiter, identifier)
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  
  // Your API logic here
  return NextResponse.json({
    message: 'Hello from rate-limited API!',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const body = await request.json().catch(() => ({}))
  
  // Check rate limit
  const rateLimitResponse = checkRateLimit(apiLimiter, identifier)
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  
  // Your API logic here
  return NextResponse.json({
    message: 'Request processed successfully',
    received: body
  })
}
