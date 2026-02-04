import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter } from './rate-limit'

export interface RateLimitMiddlewareConfig {
  keyGenerator?: (request: NextRequest) => string
  onRateLimit?: (request: NextRequest, response: NextResponse) => NextResponse
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export function createRateLimitMiddleware({
  windowMs = 60000,
  maxRequests = 60,
  keyGenerator,
  onRateLimit,
  skipSuccessfulRequests = false,
  skipFailedRequests = false
}: RateLimitMiddlewareConfig & { windowMs?: number; maxRequests?: number } = {}) {
  const rateLimiter = createRateLimiter({
    windowMs,
    maxRequests,
    skipSuccessfulRequests,
    skipFailedRequests
  })

  return async (request: NextRequest, response?: NextResponse): Promise<NextResponse> => {
    // Generate identifier for rate limiting
    const identifier = keyGenerator
      ? keyGenerator(request)
      : getClientIdentifier(request)

    // Check rate limit
    const result = rateLimiter.check(identifier)

    // Add rate limit headers to response
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.getTime().toString(),
      'X-RateLimit-Window': result.windowMs.toString()
    }
    
    // Copy existing headers
    if (response?.headers) {
      for (const [key, value] of response.headers.entries()) {
        headers[key] = value
      }
    }
    
    const responseWithHeaders = new NextResponse(
      response?.body,
      {
        status: response?.status || 200,
        headers
      }
    )

    if (!result.success) {
      // Rate limit exceeded
      if (onRateLimit) {
        return onRateLimit(request, responseWithHeaders)
      }
      
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            ...responseWithHeaders.headers,
            'Retry-After': Math.ceil((result.resetTime.getTime() - Date.now()) / 1000).toString(),
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return responseWithHeaders
  }
}

// Helper to generate client identifier
export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxy setups)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, use the first one
    const ips = forwarded.split(',').map(ip => ip.trim())
    return ips[0]
  }
  
  if (realIp) {
    return realIp
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  // Fallback - use a combination of headers as identifier
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `unknown-${userAgent.substring(0, 50)}`
}

// Pre-configured middleware for common use cases
export const rateLimitMiddlewares = {
  // Strict: 100 requests per minute
  strict: createRateLimitMiddleware({
    windowMs: 60000,
    maxRequests: 100
  }),
  
  // Default: 60 requests per minute
  default: createRateLimitMiddleware({
    windowMs: 60000,
    maxRequests: 60
  }),
  
  // Moderate: 30 requests per minute
  moderate: createRateLimitMiddleware({
    windowMs: 60000,
    maxRequests: 30
  }),
  
  // Strict for sensitive endpoints: 10 requests per minute
  strictLimiter: createRateLimitMiddleware({
    windowMs: 60000,
    maxRequests: 10
  }),
  
  // For login attempts - only rate limit failed requests
  loginAttempts: createRateLimitMiddleware({
    windowMs: 900000, // 15 minutes
    maxRequests: 5,
    skipSuccessfulRequests: true,
    onRateLimit: (request) => {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many login attempts',
          message: 'Too many failed login attempts. Please try again in 15 minutes.',
          retryAfter: 900
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900'
          }
        }
      )
    }
  }),
  
  // Per-user rate limiting
  perUser: (keyFn: (request: NextRequest) => string) =>
    createRateLimitMiddleware({
      windowMs: 60000,
      maxRequests: 100,
      keyGenerator: keyFn
    })
}
