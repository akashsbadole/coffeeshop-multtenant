import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Customer Loyalty Points API
 * Handles loyalty points accrual, redemption, and tier management
 */

// Loyalty tier thresholds (points)
const LOYALTY_TIERS = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 10000
}

// Points earned per rupee spent
const POINTS_PER_RUPEE = 1

// Get customer loyalty tier based on points
function getLoyaltyTier(points: number): string {
  if (points >= LOYALTY_TIERS.PLATINUM) return 'PLATINUM'
  if (points >= LOYALTY_TIERS.GOLD) return 'GOLD'
  if (points >= LOYALTY_TIERS.SILVER) return 'SILVER'
  return 'BRONZE'
}

// GET - Get customer loyalty info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        totalSpent: true,
        visitCount: true
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const nextTier = Object.entries(LOYALTY_TIERS)
      .filter(([_, threshold]) => threshold > customer.loyaltyPoints)
      .sort((a, b) => a[1] - b[1])[0]

    const pointsToNextTier = nextTier
      ? nextTier[1] - customer.loyaltyPoints
      : 0

    return NextResponse.json({
      ...customer,
      currentTier: customer.loyaltyTier,
      pointsToNextTier,
      nextTier: nextTier ? nextTier[0] : null,
      tierBenefits: getTierBenefits(customer.loyaltyTier as string)
    })
  } catch (error) {
    console.error('Error fetching loyalty info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty info' },
      { status: 500 }
    )
  }
}

// POST - Add loyalty points
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { amount, incrementVisitCount = false } = body

    if (!amount || amount < 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    const customer = await db.customer.findUnique({
      where: { id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const pointsEarned = Math.floor(amount * POINTS_PER_RUPEE)
    const newPoints = customer.loyaltyPoints + pointsEarned
    const newTier = getLoyaltyTier(newPoints)

    const updateData: any = {
      loyaltyPoints: newPoints,
      loyaltyTier: newTier
    }

    if (incrementVisitCount) {
      updateData.visitCount = customer.visitCount + 1
    }

    const updatedCustomer = await db.customer.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      pointsEarned,
      previousTier: customer.loyaltyTier,
      newTier,
      message: `${pointsEarned} loyalty points added`
    })
  } catch (error) {
    console.error('Error adding loyalty points:', error)
    return NextResponse.json(
      { error: 'Failed to add loyalty points' },
      { status: 500 }
    )
  }
}

// PUT - Redeem loyalty points
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { points } = body

    if (!points || points < 0) {
      return NextResponse.json(
        { error: 'Valid points amount is required' },
        { status: 400 }
      )
    }

    const customer = await db.customer.findUnique({
      where: { id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    if (customer.loyaltyPoints < points) {
      return NextResponse.json(
        { error: 'Insufficient loyalty points' },
        { status: 400 }
      )
    }

    const newPoints = customer.loyaltyPoints - points
    const newTier = getLoyaltyTier(newPoints)

    const updatedCustomer = await db.customer.update({
      where: { id },
      data: {
        loyaltyPoints: newPoints,
        loyaltyTier: newTier
      }
    })

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      pointsRedeemed: points,
      previousTier: customer.loyaltyTier,
      newTier,
      message: `${points} loyalty points redeemed`
    })
  } catch (error) {
    console.error('Error redeeming loyalty points:', error)
    return NextResponse.json(
      { error: 'Failed to redeem loyalty points' },
      { status: 500 }
    )
  }
}

function getTierBenefits(tier: string) {
  const benefits: Record<string, string[]> = {
    BRONZE: ['Basic membership', '1 point per ₹1 spent'],
    SILVER: ['5% birthday discount', 'Priority service', '2 points per ₹1 spent'],
    GOLD: ['10% birthday discount', 'Exclusive offers', 'Free delivery', '3 points per ₹1 spent'],
    PLATINUM: ['15% birthday discount', 'VIP priority service', 'Free delivery & setup', '4 points per ₹1 spent', 'Exclusive events access']
  }

  return benefits[tier] || benefits.BRONZE
}
