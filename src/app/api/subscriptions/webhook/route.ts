import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/subscriptions/webhook
 * Handle payment gateway webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data } = body

    // Verify webhook signature in production
    // const signature = request.headers.get('x-razorpay-signature') || request.headers.get('stripe-signature')
    // if (!verifyWebhook(signature, body, process.env.WEBHOOK_SECRET)) {
    //   return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    // }

    switch (event) {
      case 'payment.success':
        await handlePaymentSuccess(data)
        break
      case 'payment.failed':
        await handlePaymentFailed(data)
        break
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(data)
        break
      case 'subscription.renewed':
        await handleSubscriptionRenewed(data)
        break
      default:
        console.log(`Unhandled webhook event: ${event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(data: { subscriptionId?: string; paymentId?: string; transactionId?: string }) {
  const { subscriptionId, paymentId, transactionId } = data

  if (!subscriptionId) {
    throw new Error('Subscription ID is required')
  }

  // Update subscription status
  await db.tenantSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'ACTIVE',
      paymentStatus: 'completed',
    },
  })

  // Update payment record
  if (paymentId) {
    await db.subscriptionPayment.update({
      where: { id: paymentId },
      data: {
        paymentStatus: 'completed',
        transactionId,
      },
    })
  }

  console.log(`Payment successful for subscription: ${subscriptionId}`)
}

async function handlePaymentFailed(data: { subscriptionId?: string; paymentId?: string; reason?: string }) {
  const { subscriptionId, paymentId, reason } = data

  // Update payment record
  if (paymentId) {
    await db.subscriptionPayment.update({
      where: { id: paymentId },
      data: {
        paymentStatus: 'failed',
        notes: reason,
      },
    })
  }

  // Update subscription status
  if (subscriptionId) {
    await db.tenantSubscription.update({
      where: { id: subscriptionId },
      data: {
        paymentStatus: 'failed',
      },
    })
  }

  console.log(`Payment failed for subscription: ${subscriptionId}, reason: ${reason}`)
}

async function handleSubscriptionCancelled(data: { subscriptionId: string }) {
  const { subscriptionId } = data

  await db.tenantSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'CANCELLED',
      autoRenew: false,
    },
  })

  console.log(`Subscription cancelled: ${subscriptionId}`)
}

async function handleSubscriptionRenewed(data: { subscriptionId: string; nextBillingDate?: string }) {
  const { subscriptionId, nextBillingDate } = data

  const updateData: { status: string; nextBillingDate?: Date; paymentStatus?: string } = {
    status: 'ACTIVE',
    paymentStatus: 'completed',
  }

  if (nextBillingDate) {
    updateData.nextBillingDate = new Date(nextBillingDate)
  }

  await db.tenantSubscription.update({
    where: { id: subscriptionId },
    data: updateData,
  })

  console.log(`Subscription renewed: ${subscriptionId}`)
}
