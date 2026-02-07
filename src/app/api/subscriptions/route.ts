import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/subscriptions
 * Get current organization's subscription info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const subscription = await db.tenantSubscription.findFirst({
      where: {
        organizationId,
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subscriptions
 * Create a new subscription (for existing organizations)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, planId, billingCycle = 'MONTHLY' } = body

    if (!organizationId || !planId) {
      return NextResponse.json(
        { error: 'Organization ID and Plan ID are required' },
        { status: 400 }
      )
    }

    // Get the plan
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Invalid or inactive subscription plan' },
        { status: 400 }
      )
    }

    // Check for existing subscription
    const existingSubscription = await db.tenantSubscription.findFirst({
      where: {
        organizationId,
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
    })

    // Calculate dates
    const startDate = new Date()
    const endDate = new Date()

    if (plan.type === 'FREE') {
      endDate.setFullYear(endDate.getFullYear() + 1)
    } else if (billingCycle === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else if (billingCycle === 'QUARTERLY') {
      endDate.setMonth(endDate.getMonth() + 3)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    // Create or update subscription
    const subscription = await db.tenantSubscription.upsert({
      where: existingSubscription
        ? { id: existingSubscription.id }
        : { id: 'placeholder' },
      create: {
        organizationId,
        planId: plan.id,
        status: plan.type === 'FREE' ? 'ACTIVE' : 'PENDING',
        billingCycle,
        startDate,
        endDate,
        autoRenew: true,
        paymentStatus: plan.type === 'FREE' ? 'completed' : 'pending',
      },
      update: {
        planId: plan.id,
        status: plan.type === 'FREE' ? 'ACTIVE' : 'PENDING',
        billingCycle,
        startDate,
        endDate,
        autoRenew: true,
        paymentStatus: plan.type === 'FREE' ? 'completed' : 'pending',
      },
    })

    // Update organization limits
    await db.organization.update({
      where: { id: organizationId },
      data: {
        maxUsers: plan.maxUsers,
        maxStores: plan.maxStores,
      },
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        plan: {
          id: plan.id,
          name: plan.name,
          type: plan.type,
        },
      },
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
