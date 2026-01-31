import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Cash Drawer API
 * Handles cash drawer opening, closing, and transactions
 */

// GET - Fetch cash drawer status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const where: any = {}
    if (userId) where.userId = userId
    if (status) where.status = status

    const cashDrawers = await db.cashDrawer.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      },
      orderBy: { openedAt: 'desc' }
    })

    return NextResponse.json(cashDrawers)
  } catch (error) {
    console.error('Error fetching cash drawers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cash drawers' },
      { status: 500 }
    )
  }
}

// POST - Open a new cash drawer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, openingBalance, notes } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user has an open cash drawer
    const existingOpen = await db.cashDrawer.findFirst({
      where: {
        userId,
        status: 'OPEN'
      }
    })

    if (existingOpen) {
      return NextResponse.json(
        { error: 'User already has an open cash drawer' },
        { status: 400 }
      )
    }

    const cashDrawer = await db.cashDrawer.create({
      data: {
        userId,
        openingBalance: openingBalance || 0,
        status: 'OPEN',
        notes: notes || null
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(cashDrawer, { status: 201 })
  } catch (error) {
    console.error('Error opening cash drawer:', error)
    return NextResponse.json(
      { error: 'Failed to open cash drawer' },
      { status: 500 }
    )
  }
}
