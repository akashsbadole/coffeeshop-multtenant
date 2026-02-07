import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/subscriptions/tenant/[id]
 * Get tenant's subscription details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const subscription = await db.tenantSubscription.findFirst({
      where: {
        organizationId: id,
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            yearlyPrice: true,
            features: true,
            maxUsers: true,
            maxStores: true,
            maxOrdersPerMonth: true,
            maxMenuItems: true,
            maxInventoryItems: true,
            supportLevel: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            amount: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found for this tenant' },
        { status: 404 }
      )
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Error fetching tenant subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenant subscription' },
      { status: 500 }
    )
  }
}
