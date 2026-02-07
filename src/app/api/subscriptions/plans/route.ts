import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/subscriptions/plans
 * Get all available subscription plans
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('active') !== 'false'

    const plans = await db.subscriptionPlan.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { price: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        price: true,
        yearlyPrice: true,
        currency: true,
        features: true,
        maxUsers: true,
        maxStores: true,
        maxOrdersPerMonth: true,
        maxMenuItems: true,
        maxInventoryItems: true,
        supportLevel: true,
        isActive: true,
      },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}
