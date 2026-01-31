import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Returns & Exchanges API for Garment/Retail POS
 * Handles return and exchange requests
 */

// GET - Fetch all returns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')

    const where: any = {}
    if (status) where.status = status
    if (customerId) where.customerId = customerId

    const returns = await db.return.findMany({
      where,
      include: {
        order: {
          include: {
            items: true
          }
        },
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(returns)
  } catch (error) {
    console.error('Error fetching returns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    )
  }
}

// POST - Create a new return/exchange request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, customerId, orderItemId, quantity, returnType, exchangeItemId, reason, notes } = body

    if (!orderId || !customerId || !quantity || !returnType || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const returnTypeOptions = ['RETURN', 'EXCHANGE']
    if (!returnTypeOptions.includes(returnType)) {
      return NextResponse.json(
        { error: 'Invalid return type. Must be RETURN or EXCHANGE' },
        { status: 400 }
      )
    }

    // Get order details to calculate refund amount
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    let refundAmount = 0

    if (orderItemId) {
      const orderItem = order.items.find(item => item.id === orderItemId)
      if (orderItem) {
        refundAmount = (orderItem.subtotal / orderItem.quantity) * quantity
      }
    } else {
      // Return entire order
      refundAmount = (order.totalAmount / order.items.reduce((sum, item) => sum + item.quantity, 0)) * quantity
    }

    const returnRequest = await db.return.create({
      data: {
        orderId,
        customerId,
        orderItemId: orderItemId || null,
        quantity,
        returnType,
        exchangeItemId: exchangeItemId || null,
        reason,
        refundAmount,
        notes: notes || null,
        status: 'REQUESTED'
      },
      include: {
        order: true,
        customer: true
      }
    })

    return NextResponse.json(returnRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating return request:', error)
    return NextResponse.json(
      { error: 'Failed to create return request' },
      { status: 500 }
    )
  }
}
