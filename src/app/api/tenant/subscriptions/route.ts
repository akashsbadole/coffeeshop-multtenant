import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createSubscriptionSchema = z.object({
  organizationId: z.string(),
  planId: z.string(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  autoRenew: z.boolean().default(true),
  paymentMethod: z.string().optional(),
  paymentProvider: z.string().optional()
})

const updateSubscriptionSchema = z.object({
  planId: z.string().optional(),
  status: z.enum(['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'PENDING']).optional(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  autoRenew: z.boolean().optional(),
  paymentStatus: z.string().optional(),
  notes: z.string().optional()
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    const id = searchParams.get('id')

    if (id) {
      const subscription = await db.tenantSubscription.findUnique({
        where: { id },
        include: {
          organization: true,
          plan: true
        }
      })
      if (!subscription) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
      }
      return NextResponse.json(subscription)
    }

    if (organizationId) {
      const subscriptions = await db.tenantSubscription.findMany({
        where: { organizationId },
        include: {
          organization: true,
          plan: true
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(subscriptions)
    }

    const subscriptions = await db.tenantSubscription.findMany({
      include: {
        organization: true,
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = createSubscriptionSchema.parse(body)

    const organization = await db.organization.findUnique({
      where: { id: validatedData.organizationId }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const plan = await db.subscriptionPlan.findUnique({
      where: { id: validatedData.planId }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      )
    }

    const startDate = new Date()
    let endDate: Date

    switch (validatedData.billingCycle) {
      case 'MONTHLY':
        endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      case 'QUARTERLY':
        endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000)
        break
      case 'YEARLY':
        endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000)
        break
    }

    const subscription = await db.tenantSubscription.create({
      data: {
        ...validatedData,
        startDate,
        endDate,
        nextBillingDate: endDate,
        status: 'ACTIVE'
      },
      include: {
        organization: true,
        plan: true
      }
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
