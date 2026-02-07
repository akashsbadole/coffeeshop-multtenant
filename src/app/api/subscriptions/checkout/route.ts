import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/subscriptions/checkout
 * Create a checkout session for subscription payment
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

    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      )
    }

    if (!plan.isActive) {
      return NextResponse.json(
        { error: 'This plan is not currently available' },
        { status: 400 }
      )
    }

    // Calculate price based on billing cycle
    const price = billingCycle === 'YEARLY' && plan.yearlyPrice 
      ? plan.yearlyPrice 
      : plan.price

    // Get or create system settings
    let settings = await db.systemSettings.findFirst()
    if (!settings) {
      settings = await db.systemSettings.create({
        data: {},
      })
    }

    // Check if subscription is enabled
    if (!settings.subscription_enabled && plan.type !== 'FREE') {
      return NextResponse.json(
        { error: 'Subscriptions are currently disabled' },
        { status: 403 }
      )
    }

    // Get organization
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check for existing subscription
    const existingSubscription = await db.tenantSubscription.findFirst({
      where: {
        organizationId,
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
    })

    // If free plan, no payment needed
    if (plan.type === 'FREE') {
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1)

      if (existingSubscription) {
        // Update existing free subscription
        await db.tenantSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            planId: plan.id,
            status: 'ACTIVE',
            billingCycle: 'YEARLY',
            startDate: new Date(),
            endDate,
            autoRenew: true,
          },
        })
      } else {
        // Create new free subscription
        await db.tenantSubscription.create({
          data: {
            organizationId,
            planId: plan.id,
            status: 'ACTIVE',
            billingCycle: 'YEARLY',
            startDate: new Date(),
            endDate,
            autoRenew: true,
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Free plan activated successfully',
        checkoutUrl: null,
        plan: {
          id: plan.id,
          name: plan.name,
          price: 0,
        },
      })
    }

    // For paid plans, create a checkout session
    // In a real implementation, this would integrate with a payment provider
    // like Razorpay or Stripe

    const checkoutId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create a pending subscription
    const endDate = new Date()
    if (billingCycle === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else if (billingCycle === 'QUARTERLY') {
      endDate.setMonth(endDate.getMonth() + 3)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    const subscription = await db.tenantSubscription.upsert({
      where: {
        organizationId_status: {
          organizationId,
          status: existingSubscription?.status || 'EXPIRED',
        },
      },
      create: {
        organizationId,
        planId: plan.id,
        status: 'PENDING',
        billingCycle,
        startDate: new Date(),
        endDate,
        autoRenew: true,
        paymentStatus: 'pending',
      },
      update: {
        planId: plan.id,
        status: 'PENDING',
        billingCycle,
        startDate: new Date(),
        endDate,
        autoRenew: true,
        paymentStatus: 'pending',
      },
    })

    // Create a pending payment record
    const payment = await db.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        organizationId,
        amount: price,
        currency: plan.currency,
        paymentMethod: settings.payment_gateway || 'razorpay',
        paymentStatus: 'pending',
      },
    })

    // In production, create actual checkout session with payment provider
    // For now, return mock checkout URL
    const checkoutUrl = `/checkout/${checkoutId}?subscription=${subscription.id}&amount=${price}&currency=${plan.currency}`

    return NextResponse.json({
      success: true,
      checkoutId,
      checkoutUrl,
      subscriptionId: subscription.id,
      paymentId: payment.id,
      plan: {
        id: plan.id,
        name: plan.name,
        price,
        currency: plan.currency,
        billingCycle,
      },
      organization: {
        id: organization.id,
        name: organization.name,
      },
      expiresAt: endDate.toISOString(),
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
