import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const changePlanSchema = z.object({
  organizationId: z.string(),
  newPlanId: z.string(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, newPlanId, billingCycle } = changePlanSchema.parse(body)

    const organization = await db.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const newPlan = await db.subscriptionPlan.findUnique({
      where: { id: newPlanId }
    })

    if (!newPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    const currentSubscription = await db.tenantSubscription.findFirst({
      where: {
        organizationId,
        status: { in: ['ACTIVE', 'TRIAL'] }
      }
    })

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    const currentPlan = await db.subscriptionPlan.findUnique({
      where: { id: currentSubscription.planId }
    })

    const now = new Date()
    let endDate: Date
    let proratedAmount = 0
    let message = ''

    if (billingCycle) {
      switch (billingCycle) {
        case 'MONTHLY':
          endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          break
        case 'QUARTERLY':
          endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
          break
        case 'YEARLY':
          endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
          break
      }
    } else {
      endDate = currentSubscription.endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    }

    const isUpgrade = (newPlan.price || 0) > (currentPlan?.price || 0)

    if (isUpgrade) {
      proratedAmount = (newPlan.price || 0) - (currentPlan?.price || 0)
      message = `Plan upgraded from ${currentPlan?.name} to ${newPlan.name}. New features are now active.`
    } else {
      message = `Plan changed from ${currentPlan?.name} to ${newPlan.name}. Changes will take effect at next billing cycle.`
    }

    const updatedSubscription = await db.tenantSubscription.update({
      where: { id: currentSubscription.id },
      data: {
        planId: newPlanId,
        billingCycle: billingCycle || currentSubscription.billingCycle,
        endDate,
        nextBillingDate: endDate,
        status: 'ACTIVE',
        updatedAt: now
      },
      include: {
        plan: true,
        organization: true
      }
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        plan: updatedSubscription.plan.name,
        planType: updatedSubscription.plan.type,
        price: updatedSubscription.plan.price,
        billingCycle: updatedSubscription.billingCycle,
        endDate: updatedSubscription.endDate,
        nextBillingDate: updatedSubscription.nextBillingDate,
        autoRenew: updatedSubscription.autoRenew
      },
      changes: {
        previousPlan: currentPlan?.name,
        newPlan: newPlan.name,
        proratedAmount,
        isUpgrade,
        message
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error changing plan:', error)
    return NextResponse.json(
      { error: 'Failed to change plan' },
      { status: 500 }
    )
  }
}
