import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/subscriptions/cancel
 * Cancel an active subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, reason } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Find the active subscription
    const subscription = await db.tenantSubscription.findFirst({
      where: {
        organizationId,
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Check if it's a free plan
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: subscription.planId },
    })

    if (plan?.type === 'FREE') {
      return NextResponse.json(
        { error: 'Cannot cancel a free plan' },
        { status: 400 }
      )
    }

    // Update subscription to cancelled
    const cancelledSubscription = await db.tenantSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        autoRenew: false,
        notes: reason || 'Cancelled by user',
      },
    })

    // Create a payment record for the cancellation
    await db.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        organizationId,
        amount: 0,
        currency: plan?.currency || 'INR',
        paymentMethod: 'system',
        paymentStatus: 'completed',
        notes: `Subscription cancelled. Reason: ${reason || 'Not provided'}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        endDate: cancelledSubscription.endDate,
      },
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
