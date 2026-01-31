import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Purchase Orders API
 * Handles purchase order management for Retail POS inventory restocking
 */

// GET - Fetch purchase orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status') // PENDING, APPROVED, RECEIVED, CANCELLED
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (supplierId) {
      where.supplierId = supplierId
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    if (startDate || endDate) {
      where.orderDate = {}
      if (startDate) where.orderDate.gte = new Date(startDate)
      if (endDate) where.orderDate.lte = new Date(endDate)
    }

    const purchaseOrders = await db.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true
              }
            }
          }
        }
      },
      orderBy: { orderDate: 'desc' }
    })

    return NextResponse.json(purchaseOrders)
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

// POST - Create purchase order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      supplierId,
      items, // Array of { menuItemId, quantity, unitPrice, notes }
      expectedDate,
      notes
    } = body

    if (!supplierId || !items || !items.length) {
      return NextResponse.json(
        { error: 'Supplier ID and items are required' },
        { status: 400 }
      )
    }

    // Check if supplier exists
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Generate order number
    const lastOrder = await db.purchaseOrder.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true }
    })

    const lastNumber = lastOrder
      ? parseInt(lastOrder.orderNumber.replace('PO', '')) || 0
      : 0
    const orderNumber = `PO${String(lastNumber + 1).padStart(6, '0')}`

    // Calculate total amount
    let totalAmount = 0
    const orderItems = items.map((item: any) => {
      const lineTotal = item.quantity * item.unitPrice
      totalAmount += lineTotal
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: lineTotal,
        notes: item.notes
      }
    })

    // Create purchase order with items
    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        supplierId,
        orderNumber,
        totalAmount,
        status: 'PENDING',
        orderDate: new Date(),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        items: {
          create: orderItems
        }
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      purchaseOrder,
      message: `Purchase order ${orderNumber} created successfully`
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}

// PUT - Update purchase order
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, receivedDate, notes, items } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Purchase order ID is required' },
        { status: 400 }
      )
    }

    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (status) {
      updateData.status = status.toUpperCase()
      if (status.toUpperCase() === 'RECEIVED' && !purchaseOrder.receivedDate) {
        updateData.receivedDate = new Date()
        // Update inventory quantities when order is received
        for (const item of items || purchaseOrder.items) {
          const receivedQty = item.receivedQty !== undefined ? item.receivedQty : item.quantity
          await db.inventoryItem.upsert({
            where: { menuItemId: item.menuItemId },
            update: {
              quantity: { increment: receivedQty },
              lastRestocked: new Date()
            },
            create: {
              menuItemId: item.menuItemId,
              quantity: receivedQty,
              reorderLevel: 10,
              lastRestocked: new Date()
            }
          })
        }
      }
    }

    if (receivedDate !== undefined) {
      updateData.receivedDate = receivedDate ? new Date(receivedDate) : null
    }

    if (notes !== undefined) updateData.notes = notes

    const updatedOrder = await db.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      purchaseOrder: updatedOrder,
      message: 'Purchase order updated successfully'
    })
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to update purchase order' },
      { status: 500 }
    )
  }
}

// DELETE - Delete purchase order
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Purchase order ID is required' },
        { status: 400 }
      )
    }

    await db.purchaseOrder.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Purchase order deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to delete purchase order' },
      { status: 500 }
    )
  }
}
