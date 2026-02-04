import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createPlanSchema = z.object({
  name: z.string(),
  type: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']),
  description: z.string().optional(),
  price: z.number(),
  yearlyPrice: z.number().optional(),
  currency: z.string().default('INR'),
  features: z.string(),
  maxUsers: z.number().default(5),
  maxStores: z.number().default(1),
  maxOrdersPerMonth: z.number().optional(),
  maxMenuItems: z.number().optional(),
  maxInventoryItems: z.number().optional(),
  supportLevel: z.string().default('email'),
  isActive: z.boolean().default(true)
})

const updatePlanSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  yearlyPrice: z.number().optional(),
  currency: z.string().optional(),
  features: z.string().optional(),
  maxUsers: z.number().optional(),
  maxStores: z.number().optional(),
  maxOrdersPerMonth: z.number().optional(),
  maxMenuItems: z.number().optional(),
  maxInventoryItems: z.number().optional(),
  supportLevel: z.string().optional(),
  isActive: z.boolean().optional()
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const activeOnly = searchParams.get('activeOnly')

    const where: any = {}
    if (type) {
      where.type = type
    }
    if (activeOnly === 'true') {
      where.isActive = true
    }

    const plans = await db.subscriptionPlan.findMany({
      where,
      orderBy: { price: 'asc' }
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = createPlanSchema.parse(body)

    const plan = await db.subscriptionPlan.create({
      data: validatedData
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    )
  }
}
