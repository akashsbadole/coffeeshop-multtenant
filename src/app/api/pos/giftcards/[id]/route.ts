import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Gift Card by ID API
 * Handles gift card balance updates and validation
 */

// PUT - Update gift card balance or status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { pin, amount, action, status } = body

    const giftCard = await db.giftCard.findUnique({
      where: { id: params.id }
    })

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    // Verify PIN
    if (pin && giftCard.pin !== pin) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    let updatedGiftCard = giftCard

    if (status) {
      // Update status
      updatedGiftCard = await db.giftCard.update({
        where: { id: params.id },
        data: { status: status as any }
      })
    } else if (amount && action) {
      // Update balance
      if (action === 'add') {
        if (giftCard.status !== 'ACTIVE') {
          return NextResponse.json(
            { error: 'Cannot add balance to inactive gift card' },
            { status: 400 }
          )
        }
        updatedGiftCard = await db.giftCard.update({
          where: { id: params.id },
          data: {
            currentBalance: {
              increment: amount
            }
          }
        })
      } else if (action === 'deduct') {
        if (giftCard.status !== 'ACTIVE') {
          return NextResponse.json(
            { error: 'Gift card is not active' },
            { status: 400 }
          )
        }
        if (giftCard.currentBalance < amount) {
          return NextResponse.json(
            { error: 'Insufficient balance' },
            { status: 400 }
          )
        }
        updatedGiftCard = await db.giftCard.update({
          where: { id: params.id },
          data: {
            currentBalance: {
              decrement: amount
            }
          }
        })

        // Mark as used if balance is 0
        if (updatedGiftCard.currentBalance === 0) {
          updatedGiftCard = await db.giftCard.update({
            where: { id: params.id },
            data: { status: 'USED' }
          })
        }
      }
    }

    return NextResponse.json({
      ...updatedGiftCard,
      pin: undefined
    })
  } catch (error) {
    console.error('Error updating gift card:', error)
    return NextResponse.json(
      { error: 'Failed to update gift card' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a gift card
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const giftCard = await db.giftCard.findUnique({
      where: { id: params.id }
    })

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      )
    }

    if (giftCard.status === 'ACTIVE' && giftCard.currentBalance > 0) {
      return NextResponse.json(
        { error: 'Cannot delete active gift card with balance' },
        { status: 400 }
      )
    }

    await db.giftCard.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting gift card:', error)
    return NextResponse.json(
      { error: 'Failed to delete gift card' },
      { status: 500 }
    )
  }
}
