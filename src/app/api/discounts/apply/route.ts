import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, orderTotal, customerPhone, organizationId } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      )
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Find discount by code
    const discount = await db.discount.findFirst({
      where: {
        code: code.toUpperCase(),
        organizationId,
        isActive: true
      }
    })

    if (!discount) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid discount code'
      })
    }

    // Check if discount has expired
    const now = new Date()
    if (discount.validFrom > now || (discount.validUntil && discount.validUntil < now)) {
      return NextResponse.json({
        valid: false,
        message: 'Discount has expired'
      })
    }

    // Check if max uses reached
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return NextResponse.json({
        valid: false,
        message: 'Discount code usage limit reached'
      })
    }

    // Check minimum order value
    if (discount.minOrderValue && orderTotal < discount.minOrderValue) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order value of ₹${discount.minOrderValue.toFixed(2)} required`
      })
    }

    // Calculate discount amount
    let discountAmount = 0
    let discountedTotal = orderTotal

    if (discount.type === 'PERCENTAGE') {
      discountAmount = orderTotal * (discount.value / 100)
      discountedTotal = orderTotal - discountAmount
    } else if (discount.type === 'FIXED') {
      discountAmount = discount.value
      discountedTotal = orderTotal - discount.value
      if (discountedTotal < 0) discountedTotal = 0
    } else if (discount.type === 'BOGO') {
      // Buy One Get One - logic would need cart items
      // For now, apply fixed discount
      discountAmount = discount.value
      discountedTotal = orderTotal - discountAmount
    } else if (discount.type === 'BUNDLE') {
      discountAmount = orderTotal * (discount.value / 100)
      discountedTotal = orderTotal - discountAmount
    }

    // Increment usage count
    await db.discount.update({
      where: { id: discount.id },
      data: {
        usedCount: discount.usedCount + 1
      }
    })

    // Award loyalty points for discounted amount
    if (customerPhone) {
      const customer = await db.customer.findFirst({
        where: { phone: customerPhone }
      })

      if (customer) {
        // Award extra points for using discount (bonus)
        const bonusPoints = 5
        // In production, update customer's loyalty points here
      }
    }

    return NextResponse.json({
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        discountAmount: discountAmount.toFixed(2),
        originalTotal: orderTotal.toFixed(2),
        discountedTotal: discountedTotal.toFixed(2),
        savings: discountAmount.toFixed(2),
        percentageSavings: ((discountAmount / orderTotal) * 100).toFixed(1)
      },
      message: `Discount applied! You saved ₹${discountAmount.toFixed(2)}`
    })
  } catch (error) {
    console.error('Apply discount error:', error)
    return NextResponse.json(
      { error: 'Failed to apply discount' },
      { status: 500 }
    )
  }
}
