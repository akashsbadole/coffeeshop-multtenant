import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Return by ID API
 * Handles return approval, rejection, and completion
 */

// PUT - Update return status (approve, reject, complete)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, processedBy, notes } = body

    const validStatuses = ['REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updatedReturn = await db.return.update({
      where: { id: params.id },
      data: {
        status: status as any,
        processedBy: processedBy || null,
        processedAt: ['APPROVED', 'REJECTED', 'COMPLETED'].includes(status) ? new Date() : null,
        notes: notes || undefined
      },
      include: {
        order: true,
        customer: true
      }
    })

    // If return is approved/completed, update order status and potentially stock
    if (status === 'COMPLETED') {
      // Update stock for the returned item
      const orderItem = updatedReturn.orderItemId
        ? await db.orderItem.findUnique({
            where: { id: updatedReturn.orderItemId },
            include: { variant: true }
          })
        : null

      if (orderItem?.variant) {
        await db.productVariant.update({
          where: { id: orderItem.variantId },
          data: {
            stockQuantity: {
              increment: updatedReturn.quantity
            }
          }
        })
      } else if (orderItem?.menuItemId) {
        const inventoryItem = await db.inventoryItem.findUnique({
          where: { menuItemId: orderItem.menuItemId }
        })
        if (inventoryItem) {
          await db.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: {
              quantity: {
                increment: updatedReturn.quantity
              }
            }
          })
        }
      }

      // Update order status if all returns are completed
      await db.order.update({
        where: { id: updatedReturn.orderId },
        data: { status: 'REFUNDED' }
      })
    }

    return NextResponse.json(updatedReturn)
  } catch (error) {
    console.error('Error updating return:', error)
    return NextResponse.json(
      { error: 'Failed to update return' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a return request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const returnRequest = await db.return.findUnique({
      where: { id: params.id }
    })

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Return request not found' },
        { status: 404 }
      )
    }

    if (returnRequest.status !== 'REQUESTED') {
      return NextResponse.json(
        { error: 'Cannot delete processed return requests' },
        { status: 400 }
      )
    }

    await db.return.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting return:', error)
    return NextResponse.json(
      { error: 'Failed to delete return' },
      { status: 500 }
    )
  }
}
