import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const subscriptions = await db.tenantSubscription.findMany({
      where: { organizationId },
      include: {
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const billingHistory = subscriptions.map(sub => ({
      id: sub.id,
      plan: sub.plan.name,
      planType: sub.plan.type,
      amount: sub.plan.price,
      cycle: sub.billingCycle,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      nextBillingDate: sub.nextBillingDate,
      autoRenew: sub.autoRenew,
      paymentStatus: sub.paymentStatus,
      createdAt: sub.createdAt
    }))

    const totalSpent = billingHistory
      .filter(b => b.status === 'ACTIVE' || b.status === 'EXPIRED')
      .reduce((sum, b) => sum + b.amount, 0)

    return NextResponse.json({
      history: billingHistory,
      summary: {
        totalTransactions: billingHistory.length,
        totalSpent,
        currentSubscription: subscriptions[0] ? {
          id: subscriptions[0].id,
          plan: subscriptions[0].plan.name,
          status: subscriptions[0].status,
          nextBillingDate: subscriptions[0].nextBillingDate
        } : null
      }
    })
  } catch (error) {
    console.error('Error fetching billing history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing history' },
      { status: 500 }
    )
  }
}
