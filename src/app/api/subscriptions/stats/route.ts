import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/subscriptions/stats
 * Get subscription statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const [active, trial, expired, cancelled, pending] = await Promise.all([
      db.tenantSubscription.count({ where: { status: 'ACTIVE' } }),
      db.tenantSubscription.count({ where: { status: 'TRIAL' } }),
      db.tenantSubscription.count({ where: { status: 'EXPIRED' } }),
      db.tenantSubscription.count({ where: { status: 'CANCELLED' } }),
      db.tenantSubscription.count({ where: { status: 'PENDING' } }),
    ])

    // Get recent subscriptions
    const recentSubscriptions = await db.tenantSubscription.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      stats: {
        active,
        trial,
        expired,
        cancelled,
        pending,
      },
      recentSubscriptions,
    })
  } catch (error) {
    console.error('Error fetching subscription stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription statistics' },
      { status: 500 }
    )
  }
}
