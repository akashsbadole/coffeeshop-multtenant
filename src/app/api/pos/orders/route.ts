import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    if (organizationId) {
      where.organizationId = organizationId
    }
    
    if (status) {
      where.status = status
    }

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

// Function to deduct inventory when order is completed
async function deductInventory(items: any[]) {
  const deductions: { item: string; quantity: number; success: boolean; error?: string }[] = []

  for (const item of items) {
    try {
      // Check if item has a variant
      if (item.variantId) {
        // Deduct from product variant
        const variant = await db.productVariant.findUnique({
          where: { id: item.variantId }
        })

        if (variant && variant.stockQuantity >= item.quantity) {
          await db.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                decrement: item.quantity
              }
            }
          })
          deductions.push({ item: item.name || 'Product', quantity: item.quantity, success: true })
        } else {
          deductions.push({ 
            item: item.name || 'Product', 
            quantity: item.quantity, 
            success: false, 
            error: 'Insufficient stock' 
          })
        }
      } else if (item.menuItemId) {
        // Deduct from inventory
        const inventoryItem = await db.inventoryItem.findFirst({
          where: { menuItemId: item.menuItemId }
        })

        if (inventoryItem) {
          if (inventoryItem.quantity >= item.quantity) {
            await db.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: {
                quantity: {
                  decrement: item.quantity
                },
                lastRestocked: new Date()
              }
            })
            deductions.push({ item: item.name || 'Product', quantity: item.quantity, success: true })
          } else {
            deductions.push({ 
              item: item.name || 'Product', 
              quantity: item.quantity, 
              success: false, 
              error: 'Insufficient stock' 
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error deducting inventory for item ${item.menuItemId}:`, error)
      deductions.push({ 
        item: item.name || 'Product', 
        quantity: item.quantity, 
        success: false, 
        error: 'Database error' 
      })
    }
  }

  return deductions
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      organizationId,
      customerName,
      customerPhone,
      notes,
      items,
      subtotal,
      totalGst,
      sgst,
      cgst,
      totalAmount,
      total,
      paymentMethod,
      deductStock = true
    } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const finalTotalAmount = typeof totalAmount === 'number' ? totalAmount : total

    console.log('Received order request:', JSON.stringify({ ...body, totalAmount: finalTotalAmount }, null, 2))

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must have at least one item' },
        { status: 400 }
      )
    }

    if (typeof subtotal !== 'number' || typeof finalTotalAmount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid order amounts' },
        { status: 400 }
      )
    }

    const lastOrder = await db.order.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true }
    })

    let nextOrderNumber = '0001'
    if (lastOrder?.orderNumber) {
      const lastNum = parseInt(lastOrder.orderNumber)
      nextOrderNumber = String(lastNum + 1).padStart(4, '0')
    }

    let customerId: string | undefined = undefined
    if (customerName || customerPhone) {
      const customer = await db.customer.create({
        data: {
          name: customerName || null,
          phone: customerPhone || null,
          organizationId
        }
      })
      customerId = customer.id
    }

    let userId = 'default-user'
    const existingUser = await db.user.findFirst({
      where: { organizationId }
    })
    if (!existingUser) {
      const newUser = await db.user.create({
        data: {
          email: 'admin@coffeeshop.com',
          name: 'Admin',
          role: 'ADMIN',
          password: 'admin123',
          organizationId
        }
      })
      userId = newUser.id
    } else {
      userId = existingUser.id
    }

    console.log('Creating order with:', {
      orderNumber: nextOrderNumber,
      itemCount: items.length,
      totalAmount: finalTotalAmount
    })

    const order = await db.order.create({
      data: {
        organizationId,
        orderNumber: nextOrderNumber,
        customerId,
        status: 'COMPLETED',
        subtotal,
        totalGst,
        sgst,
        cgst,
        totalAmount: finalTotalAmount,
        notes,
        createdById: userId,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            variantId: item.variantId || null,
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
            amount: finalTotalAmount,
            status: 'PAID'
          }]
        }
      },
      include: {
        items: {
          include: {
            menuItem: true,
            variant: true
          }
        },
        payments: true
      }
    })

    let inventoryDeductions: any[] = []
    if (deductStock) {
      console.log('Deducting inventory for order:', order.id)
      inventoryDeductions = await deductInventory(order.items)
      console.log('Inventory deductions:', inventoryDeductions)
    }

    console.log('Order created successfully:', order.id, order.orderNumber)

    return NextResponse.json({
      ...order,
      inventoryDeductions
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// PUT - Update order status and handle inventory for returns/cancellations
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { organizationId, id, status, restoreStock = false } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    const order = await db.order.findFirst({
      where: { id, organizationId },
      include: {
        items: {
          include: {
            menuItem: true,
            variant: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    let restoredItems: any[] = []
    if (restoreStock && status === 'CANCELLED') {
      for (const item of order.items) {
        try {
          if (item.variantId) {
            await db.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockQuantity: {
                  increment: item.quantity
                }
              }
            })
            restoredItems.push({ item: item.menuItem?.name, quantity: item.quantity })
          } else if (item.menuItemId) {
            const inventoryItem = await db.inventoryItem.findFirst({
              where: { menuItemId: item.menuItemId }
            })
            if (inventoryItem) {
              await db.inventoryItem.update({
                where: { id: inventoryItem.id },
                data: {
                  quantity: {
                    increment: item.quantity
                  }
                }
              })
              restoredItems.push({ item: item.menuItem?.name, quantity: item.quantity })
            }
          }
        } catch (error) {
          console.error('Error restoring inventory:', error)
        }
      }
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
        payments: true
      }
    })

    return NextResponse.json({
      ...updatedOrder,
      restoredItems: restoreStock ? restoredItems : undefined
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
