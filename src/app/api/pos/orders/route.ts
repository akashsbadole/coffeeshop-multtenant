import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = status ? { status: status as any } : {}

    const orders = await db.order.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        payments: true,
        customer: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerPhone,
      notes,
      items,
      subtotal,
      totalGst,
      sgst,
      cgst,
      totalAmount,
      paymentMethod
    } = body

    console.log('Received order request:', JSON.stringify(body, null, 2))

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must have at least one item' },
        { status: 400 }
      )
    }

    if (typeof subtotal !== 'number' || typeof totalAmount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid order amounts' },
        { status: 400 }
      )
    }

    // Generate order number (sequential)
    const lastOrder = await db.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true }
    })

    let nextOrderNumber = '0001'
    if (lastOrder?.orderNumber) {
      const lastNum = parseInt(lastOrder.orderNumber)
      nextOrderNumber = String(lastNum + 1).padStart(4, '0')
    }

    // Create customer if name or phone provided
    let customerId: string | undefined = undefined
    if (customerName || customerPhone) {
      const customer = await db.customer.create({
        data: {
          name: customerName || null,
          phone: customerPhone || null
        }
      })
      customerId = customer.id
    }

    // Create a default user if none exists
    let userId = 'default-user'
    const existingUser = await db.user.findFirst()
    if (!existingUser) {
      const newUser = await db.user.create({
        data: {
          email: 'admin@coffeeshop.com',
          name: 'Admin',
          role: 'ADMIN',
          password: 'admin123' // In production, this should be hashed
        }
      })
      userId = newUser.id
    } else {
      userId = existingUser.id
    }

    console.log('Creating order with:', {
      orderNumber: nextOrderNumber,
      itemCount: items.length,
      totalAmount
    })

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber: nextOrderNumber,
        customerId,
        status: 'COMPLETED',
        subtotal,
        totalGst,
        sgst,
        cgst,
        totalAmount,
        notes,
        createdById: userId,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            gstRate: item.gstRate,
            gstAmount: item.gstAmount,
            subtotal: item.subtotal
          }))
        },
        payments: {
          create: [{
            method: paymentMethod as any,
            amount: totalAmount,
            status: 'PAID'
          }]
        }
      },
      include: {
        items: true,
        payments: true
      }
    })

    console.log('Order created successfully:', order.id, order.orderNumber)

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
