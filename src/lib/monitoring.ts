// Monitoring and Logging Service
// Provides error tracking, performance monitoring, and analytics integration

import * as Sentry from '@sentry/nextjs'

export interface LogLevel {
  DEBUG: 'debug'
  INFO: 'info'
  WARN: 'warn'
  ERROR: 'error'
  FATAL: 'fatal'
}

export interface LogContext {
  userId?: string
  requestId?: string
  ip?: string
  userAgent?: string
  path?: string
  method?: string
  duration?: number
  metadata?: Record<string, any>
}

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, string | number | boolean>
  userId?: string
  timestamp?: Date
}

class MonitoringService {
  private isInitialized = false
  private sentryDsn: string | null = null
  private analyticsId: string | null = null

  initialize() {
    if (typeof window === 'undefined') {
      if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== 'your-sentry-dsn') {
        this.sentryDsn = process.env.SENTRY_DSN
        this.initializeSentry()
      }

      if (process.env.ANALYTICS_ID && process.env.ANALYTICS_ID !== 'your-analytics-id') {
        this.analyticsId = process.env.ANALYTICS_ID
        this.initializeAnalytics()
      }

      this.isInitialized = true
    }
  }

  private initializeSentry() {
    Sentry.init({
      dsn: this.sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay(),
      ],
      beforeSend(event) {
        if (event.user) {
          delete event.user.ip_address
        }
        return event
      },
    })
  }

  private initializeAnalytics() {
    if (typeof window !== 'undefined') {
      this.trackEvent('page_view', {
        page: window.location.pathname,
        referrer: document.referrer,
      })
    }
  }

  log(level: LogLevel[keyof LogLevel], message: string, context?: LogContext) {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context || {},
    }

    if (typeof window === 'undefined') {
      console.log(JSON.stringify(logEntry))

      if (level === 'error' || level === 'fatal') {
        this.captureError(new Error(message), context)
      }
    } else {
      switch (level) {
        case 'debug':
        console.debug(message, context)
          break
        case 'info':
          console.info(message, context)
          break
        case 'warn':
          console.warn(message, context)
          break
        case 'error':
          console.error(message, context)
          break
        case 'fatal':
          console.error(message, context)
          break
      }
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('DEBUG', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('INFO', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('WARN', message, context)
  }

  error(message: string, context?: LogContext) {
    this.log('ERROR', message, context)
  }

  fatal(message: string, context?: LogContext) {
    this.log('FATAL', message, context)
  }

  captureError(error: Error, context?: LogContext) {
    if (!this.isInitialized) return

    Sentry.captureException(error, {
      extra: context?.metadata,
      tags: {
        userId: context?.userId,
        path: context?.path,
        method: context?.method,
      },
      user: context?.userId ? { id: context.userId } : undefined,
    })

    this.trackEvent('error', {
      error_type: error.name,
      error_message: error.message,
      ...context?.metadata,
    })
  }

  captureMessage(message: string, context?: LogContext) {
    if (!this.isInitialized) return

    Sentry.captureMessage(message, {
      extra: context?.metadata,
      tags: {
        userId: context?.userId,
        path: context?.path,
      },
      level: 'error',
    })
  }

  trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
    if (!this.isInitialized || !this.analyticsId) return

    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, properties)
    }
  }

  trackPageView(path: string, title?: string) {
    this.trackEvent('page_view', {
      page: path,
      title: title || document?.title,
    })
  }

  trackUserAction(action: string, properties?: Record<string, string | number | boolean>) {
    this.trackEvent('user_action', {
      action,
      ...properties,
    })
  }

  trackPerformance(metric: string, value: number, context?: LogContext) {
    this.trackEvent('performance', {
      metric,
      value,
      duration_ms: context?.duration,
    })
  }

  setUserId(userId: string) {
    if (this.isInitialized) {
      Sentry.setUser({ id: userId })
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', this.analyticsId, { user_id: userId })
    }
  }

  clearUser() {
    if (this.isInitialized) {
      Sentry.setUser(null)
    }
  }

  addBreadcrumb(category: string, message: string, level?: 'info' | 'warn' | 'error') {
    if (!this.isInitialized) return

    Sentry.addBreadcrumb({
      category,
      message,
      level: level || 'info',
    })
  }

  startTransaction(name: string) {
    if (!this.isInitialized) return null

    return Sentry.startTransaction({ name })
  }
}

export const monitoring = new MonitoringService()

export function initializeMonitoring() {
  monitoring.initialize()
}

export function logger() {
  return monitoring
}
