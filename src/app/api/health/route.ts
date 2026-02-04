import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const startTime = Date.now()

  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '2.0.0',
  }

  try {
    await db.$queryRaw`SELECT 1`
    health.database = 'connected'
  } catch (error) {
    health.database = 'disconnected'
    health.status = 'unhealthy'
  }

  try {
    const memoryUsage = process.memoryUsage()
    health.memory = {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    }

    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
      health.memory.warning = 'High memory usage'
      health.status = 'degraded'
    }
  } catch (error) {
    health.memory = 'unavailable'
  }

  try {
    health.cpu = {
      usage: process.cpuUsage(),
      load: process.loadavg?.() || 'N/A',
    }
  } catch (error) {
    health.cpu = 'unavailable'
  }

  const responseTime = Date.now() - startTime
  health.responseTime = `${responseTime}ms`

  if (health.status === 'unhealthy') {
    return NextResponse.json(health, { status: 503 })
  }

  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Response-Time': responseTime.toString(),
    },
  })
}
