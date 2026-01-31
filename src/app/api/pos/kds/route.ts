import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Kitchen Display System (KDS) API
 * Handles order items for kitchen display with status updates
 */

// GET - Fetch orders for kitchen display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const tableId = searchParams.get('tableId')

    const where: any = {
      status: status as any
    }

    // Fetch order items with the specified status
    const orderItems = await db.orderItem.findMany({
      where: {
        status: status as any
      },
      include: {
        order: {
          include: {
            customer: true,
            table: true,
            createdBy: {
              select: {
                name: true
              }
            }
          }
        },
        menuItem: {
          include: {
            category: true
          }
        },
        variant: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group by order
    const groupedOrders = orderItems.reduce((acc: any, item: any) => {
      const orderId = item.orderId
      if (!acc[orderId]) {
        acc[orderId] = {
          order: item.order,
          items: []
        }
      }
      acc[orderId].items.push(item)
      return acc
    }, {})

    return NextResponse.json({
      orders: Object.values(groupedOrders),
      summary: {
        totalOrders: Object.keys(groupedOrders).length,
        totalItems: orderItems.length,
        status
      }
    })
  } catch (error) {
    console.error('Error fetching KDS orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KDS orders' },
      { status: 500 }
    )
  }
}

// PUT - Update order item status (e.g., mark as ready)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderItemId, status, notes } = body

    if (!orderItemId || !status) {
      return NextResponse.json(
        { error: 'Order item ID and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'READY', 'SERVED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updatedItem = await db.orderItem.update({
      where: { id: orderItemId },
      data: {
        status: status as any,
        notes: notes || undefined
      },
      include: {
        order: true,
        menuItem: true
      }
    })

    // Check if all items in the order are ready to update order status
    if (status === 'READY' || status === 'SERVED') {
      const allItems = await db.orderItem.findMany({
        where: { orderId: updatedItem.orderId }
      })

      const allReady = allItems.every(item => item.status === 'READY' || item.status === 'SERVED')
      const anyInProgress = allItems.some(item => item.status === 'IN_PROGRESS')

      if (allReady) {
        await db.order.update({
          where: { id: updatedItem.orderId },
          data: { status: 'READY' }
        })
      } else if (anyInProgress || status === 'IN_PROGRESS') {
        await db.order.update({
          where: { id: updatedItem.orderId },
          data: { status: 'PREPARING' }
        })
      }
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating order item status:', error)
    return NextResponse.json(
      { error: 'Failed to update order item status' },
      { status: 500 }
    )
  }
}
