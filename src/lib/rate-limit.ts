// Simple in-memory rate limiter
// Usage: const rateLimit = createRateLimiter({ windowMs: 60000, maxRequests: 100 })

export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number    // Maximum requests allowed in the window
  skipSuccessfulRequests?: boolean  // Only count failed requests
  skipFailedRequests?: boolean    // Only count successful requests
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: Date
  limit: number
  windowMs: number
}

export interface RequestRecord {
  count: number
  resetTime: Date
  windowMs: number
}

// In-memory storage for rate limiting
const rateLimitStore = new Map<string, RequestRecord>()

// Cleanup old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime.getTime()) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, skipSuccessfulRequests = false, skipFailedRequests = false } = config

  return {
    check: (identifier: string, success?: boolean): RateLimitResult => {
      const now = Date.now()
      const record = rateLimitStore.get(identifier)
      
      // Skip tracking based on success/failure if configured
      if (success !== undefined) {
        if (skipSuccessfulRequests && success) {
          return {
            success: true,
            remaining: maxRequests,
            resetTime: new Date(now + windowMs),
            limit: maxRequests,
            windowMs
          }
        }
        if (skipFailedRequests && !success) {
          return {
            success: true,
            remaining: maxRequests,
            resetTime: new Date(now + windowMs),
            limit: maxRequests,
            windowMs
          }
        }
      }
      
      // Check if record exists and if it's still within the window
      if (record && now < record.resetTime.getTime()) {
        // Within the window, check if limit exceeded
        if (record.count >= maxRequests) {
          return {
            success: false,
            remaining: 0,
            resetTime: record.resetTime,
            limit: maxRequests,
            windowMs
          }
        }
        
        // Increment counter
        record.count++
        return {
          success: true,
          remaining: maxRequests - record.count,
          resetTime: record.resetTime,
          limit: maxRequests,
          windowMs
        }
      }
      
      // New window or window expired
      const newRecord: RequestRecord = {
        count: 1,
        resetTime: new Date(now + windowMs),
        windowMs
      }
      rateLimitStore.set(identifier, newRecord)
      
      return {
        success: true,
        remaining: maxRequests - 1,
        resetTime: newRecord.resetTime,
        limit: maxRequests,
        windowMs
      }
    },
    
    reset: (identifier: string): void => {
      rateLimitStore.delete(identifier)
    },
    
    resetAll: (): void => {
      rateLimitStore.clear()
    },
    
    getRemaining: (identifier: string): number => {
      const record = rateLimitStore.get(identifier)
      if (!record || Date.now() >= record.resetTime.getTime()) {
        return maxRequests
      }
      return Math.max(0, maxRequests - record.count)
    }
  }
}

// Pre-configured rate limiters for common use cases
export const apiRateLimiters = {
  // 100 requests per minute
  strict: createRateLimiter({ windowMs: 60000, maxRequests: 100 }),
  
  // 60 requests per minute
  default: createRateLimiter({ windowMs: 60000, maxRequests: 60 }),
  
  // 30 requests per minute
  moderate: createRateLimiter({ windowMs: 60000, maxRequests: 30 }),
  
  // 10 requests per minute
  strictLimiter: createRateLimiter({ windowMs: 60000, maxRequests: 10 }),
  
  // 1000 requests per hour
  generous: createRateLimiter({ windowMs: 3600000, maxRequests: 1000 }),
  
  // Only rate limit failed requests (for login attempts, etc.)
  loginAttempts: createRateLimiter({ 
    windowMs: 900000, // 15 minutes
    maxRequests: 5, 
    skipSuccessfulRequests: true 
  }),
  
  // Only rate limit successful requests (for API quotas, etc.)
  apiQuota: createRateLimiter({ 
    windowMs: 3600000, // 1 hour
    maxRequests: 1000, 
    skipFailedRequests: true 
  })
}
