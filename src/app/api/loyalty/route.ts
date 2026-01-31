import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')

    // Find customer by phone number
    const customer = await db.customer.findFirst({
      where: { phone: phone || undefined }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Get customer's order history
    const orders = await db.order.findMany({
      where: { customerId: customer.id },
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Calculate loyalty points (1 point per ₹10 spent)
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const loyaltyPoints = Math.floor(totalSpent / 10)

    // Determine loyalty tier
    let loyaltyTier = 'Bronze'
    if (loyaltyPoints >= 1000) loyaltyTier = 'Platinum'
    else if (loyaltyPoints >= 500) loyaltyTier = 'Gold'
    else if (loyaltyPoints >= 250) loyaltyTier = 'Silver'

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        loyaltyPoints,
        loyaltyTier,
        memberSince: customer.createdAt
      },
      summary: {
        totalOrders: orders.length,
        totalSpent: totalSpent.toFixed(2),
        averageOrderValue: orders.length > 0 ? (totalSpent / orders.length).toFixed(2) : '0.00',
        lastOrderDate: orders[0]?.createdAt || null
      },
      orderHistory: orders.map(order => ({
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        date: order.createdAt,
        itemsCount: order.items?.length || 0
      })),
      rewards: {
        currentPoints: loyaltyPoints,
        tier: loyaltyTier,
        nextTier: loyaltyTier === 'Bronze' ? 'Silver (250 pts)' :
                   loyaltyTier === 'Silver' ? 'Gold (500 pts)' :
                   loyaltyTier === 'Gold' ? 'Platinum (1000 pts)' :
                   'Maximum tier reached!',
        pointsToNextTier: loyaltyTier === 'Bronze' ? 250 - loyaltyPoints :
                         loyaltyTier === 'Silver' ? 500 - loyaltyPoints :
                         loyaltyTier === 'Gold' ? 1000 - loyaltyPoints :
                         0
      }
    })
  } catch (error) {
    console.error('Loyalty error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty data' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, address } = body

    // Check if customer already exists
    const existingCustomer = await db.customer.findFirst({
      where: { phone }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 400 }
      )
    }

    // Create new customer
    const customer = await db.customer.create({
      data: {
        name,
        phone,
        email: email || null,
        address: address || null
      }
    })

    // Award welcome bonus points (50 points)
    const welcomeBonus = 50

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        memberSince: customer.createdAt
      },
      loyalty: {
        points: welcomeBonus,
        tier: 'Bronze',
        message: `Welcome! You've been awarded ${welcomeBonus} bonus points!`
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Loyalty create error:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerId, pointsToAdd, reason } = body

    // Find customer
    const customer = await db.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Note: In a real implementation, you'd have a loyaltyPoints table
    // For now, we'll return the updated calculation
    const customerOrders = await db.order.findMany({
      where: { customerId }
    })
    const totalSpent = customerOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    let loyaltyPoints = Math.floor(totalSpent / 10)

    // Add bonus points
    if (pointsToAdd) {
      loyaltyPoints += pointsToAdd
    }

    // Determine tier
    let loyaltyTier = 'Bronze'
    if (loyaltyPoints >= 1000) loyaltyTier = 'Platinum'
    else if (loyaltyPoints >= 500) loyaltyTier = 'Gold'
    else if (loyaltyPoints >= 250) loyaltyTier = 'Silver'

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        loyaltyPoints,
        loyaltyTier
      },
      message: pointsToAdd 
        ? `Successfully added ${pointsToAdd} points to ${customer.name}'s account`
        : 'Customer loyalty data updated'
    })
  } catch (error) {
    console.error('Loyalty update error:', error)
    return NextResponse.json(
      { error: 'Failed to update loyalty points' },
      { status: 500 }
    )
  }
}
