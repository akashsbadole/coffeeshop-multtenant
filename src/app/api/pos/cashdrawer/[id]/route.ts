import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Cash Drawer by ID API
 * Handles closing cash drawer and viewing transactions
 */

// PUT - Close cash drawer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { closingBalance, notes } = body

    const cashDrawer = await db.cashDrawer.findUnique({
      where: { id: params.id },
      include: {
        transactions: true
      }
    })

    if (!cashDrawer) {
      return NextResponse.json(
        { error: 'Cash drawer not found' },
        { status: 404 }
      )
    }

    if (cashDrawer.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Cash drawer is already closed' },
        { status: 400 }
      )
    }

    // Calculate expected balance
    const cashIn = cashDrawer.transactions
      .filter(t => t.type === 'IN')
      .reduce((sum, t) => sum + t.amount, 0)

    const cashOut = cashDrawer.transactions
      .filter(t => t.type === 'OUT')
      .reduce((sum, t) => sum + t.amount, 0)

    const expectedBalance = cashDrawer.openingBalance + cashIn - cashOut

    const updatedCashDrawer = await db.cashDrawer.update({
      where: { id: params.id },
      data: {
        closingBalance: closingBalance || 0,
        status: 'CLOSED',
        closedAt: new Date(),
        notes: notes || cashDrawer.notes
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    const difference = (closingBalance || 0) - expectedBalance

    return NextResponse.json({
      ...updatedCashDrawer,
      summary: {
        openingBalance: cashDrawer.openingBalance,
        cashIn,
        cashOut,
        expectedBalance,
        actualBalance: closingBalance || 0,
        difference,
        isBalanced: Math.abs(difference) < 0.01
      }
    })
  } catch (error) {
    console.error('Error closing cash drawer:', error)
    return NextResponse.json(
      { error: 'Failed to close cash drawer' },
      { status: 500 }
    )
  }
}
