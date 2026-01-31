import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Shift Management API
 * Handles shift scheduling, tracking, and reporting
 */

// GET - Fetch shifts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) where.startTime.gte = new Date(startDate)
      if (endDate) where.startTime.lte = new Date(endDate)
    }

    const shifts = await db.shift.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    })

    return NextResponse.json(shifts)
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    )
  }
}

// POST - Create a shift
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, startTime, endTime, openingBalance, notes } = body

    if (!userId || !name || !startTime) {
      return NextResponse.json(
        { error: 'User ID, name, and start time are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const shift = await db.shift.create({
      data: {
        userId,
        name,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        status: 'SCHEDULED',
        openingBalance: openingBalance || 0,
        notes
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      shift,
      message: 'Shift created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating shift:', error)
    return NextResponse.json(
      { error: 'Failed to create shift' },
      { status: 500 }
    )
  }
}

// PUT - Update shift
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, endTime, closingBalance, cashSales, cardSales, upiSales, totalSales, notes } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Shift ID is required' },
        { status: 400 }
      )
    }

    const shift = await db.shift.findUnique({
      where: { id }
    })

    if (!shift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (status) updateData.status = status.toUpperCase()
    if (endTime !== undefined) updateData.endTime = new Date(endTime)
    if (closingBalance !== undefined) updateData.closingBalance = closingBalance
    if (cashSales !== undefined) updateData.cashSales = cashSales
    if (cardSales !== undefined) updateData.cardSales = cardSales
    if (upiSales !== undefined) updateData.upiSales = upiSales
    if (totalSales !== undefined) updateData.totalSales = totalSales
    if (notes !== undefined) updateData.notes = notes

    const updatedShift = await db.shift.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      shift: updatedShift,
      message: 'Shift updated successfully'
    })
  } catch (error) {
    console.error('Error updating shift:', error)
    return NextResponse.json(
      { error: 'Failed to update shift' },
      { status: 500 }
    )
  }
}

// DELETE - Delete shift
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Shift ID is required' },
        { status: 400 }
      )
    }

    await db.shift.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Shift deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting shift:', error)
    return NextResponse.json(
      { error: 'Failed to delete shift' },
      { status: 500 }
    )
  }
}
