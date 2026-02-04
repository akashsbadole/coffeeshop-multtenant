# Simple Rate Limiter

A lightweight, in-memory rate limiting solution for Next.js API routes without external dependencies like Upstash.

## Features

- Sliding window rate limiting
- Per-identifier tracking (IP, user ID, etc.)
- Memory-efficient with automatic cleanup
- Configurable time windows and limits
- Skip successful or failed requests option
- Easy to integrate with Next.js API routes

## Installation

No installation needed! Just copy the files to your project:

```
src/
  lib/
    rate-limit.ts          # Core rate limiter
    rate-limit-middleware.ts  # Next.js middleware
  app/api/
    examples/
      rate-limit-example/route.ts  # Usage examples
```

## Quick Start

### Basic Usage (API Route)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter, apiRateLimiters } from '@/lib/rate-limit'

// Use pre-configured limiter
const rateLimiter = apiRateLimiters.default // 60 requests/minute

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request)
  const result = rateLimiter.check(identifier)

  if (!result.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
      }),
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

  return NextResponse.json({ message: 'Hello!' })
}

// Helper to get client identifier
function getClientIdentifier(request: NextRequest): string {
  return request.ip || 'unknown'
}
```

### Using Middleware

```typescript
import { createRateLimitMiddleware } from '@/lib/rate-limit-middleware'

const rateLimit = createRateLimitMiddleware({
  windowMs: 60000, // 1 minute
  maxRequests: 100
})

export async function GET(request: NextRequest) {
  const response = await rateLimit(request)
  return response // Will handle rate limiting automatically
}
```

## Configuration Options

### createRateLimiter(config)

```typescript
interface RateLimitConfig {
  windowMs: number              // Time window in milliseconds
  maxRequests: number           // Max requests in window
  skipSuccessfulRequests?: boolean  // Don't count successful requests
  skipFailedRequests?: boolean     // Don't count failed requests
}
```

### Pre-configured Limiters

```typescript
import { apiRateLimiters } from '@/lib/rate-limit'

// 100 requests per minute
apiRateLimiters.strict

// 60 requests per minute  
apiRateLimiters.default

// 30 requests per minute
apiRateLimiters.moderate

// 10 requests per minute
apiRateLimiters.strictLimiter

// 1000 requests per hour
apiRateLimiters.generous

// Only count failed login attempts (5 per 15 minutes)
apiRateLimiters.loginAttempts

// Only count successful requests (1000 per hour)
apiRateLimiters.apiQuota
```

## API Response Headers

All rate-limited responses include these headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed |
| `X-RateLimit-Remaining` | Remaining requests in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `Retry-After` | Seconds until next request is allowed |

## Examples

### 1. Login Rate Limiting

```typescript
import { createRateLimiter } from '@/lib/rate-limit'

const loginLimiter = createRateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 5,
  skipSuccessfulRequests: true // Only count failed attempts
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password } = body

  const result = loginLimiter.check(email)

  if (!result.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many login attempts',
        retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
      }),
      { status: 429 }
    )
  }

  const isAuthenticated = await authenticateUser(email, password)

  if (isAuthenticated.success) {
    // Successful login - reset rate limit
    loginLimiter.reset(email)
    return NextResponse.json({ success: true })
  } else {
    // Failed login - counted against rate limit
    const remaining = loginLimiter.getRemaining(email)
    return NextResponse.json(
      { error: 'Invalid credentials', remainingAttempts: remaining - 1 },
      { status: 401 }
    )
  }
}
```

### 2. Per-User Rate Limiting

```typescript
import { createRateLimiter } from '@/lib/rate-limit'

const userLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 100
})

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'anonymous'
  
  const result = userLimiter.check(userId)
  
  if (!result.success) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429 }
    )
  }

  // Process request...
  return NextResponse.json({ success: true })
}
```

### 3. Multiple Limits on Same Route

```typescript
import { createRateLimiter } from '@/lib/rate-limit'

// Per-IP limit: 60 requests/minute
const ipLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 60
})

// Global limit: 1000 requests/minute
const globalLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 1000
})

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown'

  // Check both limits
  const ipResult = ipLimiter.check(ip)
  const globalResult = globalLimiter.check('global')

  if (!ipResult.success || !globalResult.success) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429 }
    )
  }

  // Process request...
  return NextResponse.json({ success: true })
}
```

### 4. Custom Error Handling

```typescript
import { createRateLimiter } from '@/lib/rate-limit'

const apiLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 60
})

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown'
  const result = apiLimiter.check(ip)

  if (!result.success) {
    const retryAfter = Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
    const retryAfterMinutes = Math.ceil(retryAfter / 60)
    const retryAfterHours = Math.ceil(retryAfter / 3600)

    return new NextResponse(
      JSON.stringify({
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Please try again in ${retryAfterMinutes} minutes.`,
        retryAfter: retryAfter,
        retryAfterUnit: retryAfter < 60 ? 'seconds' : retryAfter < 3600 ? 'minutes' : 'hours',
        limit: result.limit,
        window: result.windowMs
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.getTime().toString(),
          'Retry-After': retryAfter.toString()
        }
      }
    )
  }

  // Process request...
  return NextResponse.json({ success: true })
}
```

## API Reference

### RateLimitResult

```typescript
interface RateLimitResult {
  success: boolean         // Whether request is allowed
  remaining: number         // Requests remaining in window
  resetTime: Date         // When the window resets
  limit: number           // Maximum requests allowed
  windowMs: number        // Window size in milliseconds
}
```

### Methods

```typescript
const limiter = createRateLimiter(config)

// Check if request is allowed
limiter.check(identifier: string, success?: boolean): RateLimitResult

// Reset rate limit for identifier
limiter.reset(identifier: string): void

// Reset all rate limits
limiter.resetAll(): void

// Get remaining requests for identifier
limiter.getRemaining(identifier: string): number
```

## Advantages Over @upstash/ratelimit

- No external dependencies
- Zero latency (in-memory)
- No network calls
- Works offline
- Simple and easy to understand
- Full TypeScript support

## Limitations

- Rate limits reset when server restarts (in-memory only)
- Not distributed (doesn't work across multiple servers)
- May not be suitable for high-traffic production systems

## Best Practices

1. **Use appropriate limits**: Don't be too restrictive
2. **Log rate limit hits**: Monitor abuse patterns
3. **Provide helpful errors**: Tell users when they can retry
4. **Consider user tiering**: Different limits for different user types
5. **Use meaningful identifiers**: User ID is better than IP for logged-in users
6. **Combine with other security**: Use alongside authentication, CAPTCHA, etc.

## Example for POS System

```typescript
// src/app/api/pos/orders/route.ts
import { createRateLimiter } from '@/lib/rate-limit'

// 100 orders per minute per staff member
const orderLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 100
})

export async function POST(request: NextRequest) {
  const staffId = request.headers.get('x-staff-id') || 'unknown'
  const result = orderLimiter.check(staffId)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many orders. Please slow down.' },
      { status: 429 }
    )
  }

  // Process order...
}
```
