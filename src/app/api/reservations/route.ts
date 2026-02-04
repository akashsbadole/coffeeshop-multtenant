import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export interface Reservation {
  id: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  tableId?: string
  partySize: number
  date: Date
  time: string
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  specialRequests?: string
  createdById?: string
  createdAt: Date
  updatedAt: Date
}

// GET - Fetch reservations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const tableId = searchParams.get('tableId')
    const upcoming = searchParams.get('upcoming') === 'true'

    const where: any = {}
    
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay
      }
    }
    
    if (upcoming) {
      where.date = {
        gte: new Date()
      }
      where.status = {
        in: ['PENDING', 'CONFIRMED']
      }
    }
    
    if (status) where.status = status
    if (tableId) where.tableId = tableId

    const reservations = await db.reservation.findMany({
      where,
      include: {
        table: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      reservations,
      count: reservations.length
    })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}

// POST - Create reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerPhone,
      customerEmail,
      tableId,
      partySize,
      date,
      time,
      notes,
      specialRequests,
      createdById
    } = body

    if (!customerName || !customerPhone || !date || !time || !partySize) {
      return NextResponse.json(
        { error: 'Customer name, phone, date, time, and party size are required' },
        { status: 400 }
      )
    }

    // Check if table is already reserved for that time
    if (tableId) {
      const existingReservation = await db.reservation.findFirst({
        where: {
          tableId,
          date: new Date(date),
          time: {
            gte: time,
            lte: time
          },
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      })

      if (existingReservation) {
        return NextResponse.json(
          { error: 'Table is already reserved for this time slot' },
          { status: 400 }
        )
      }
    }

    const reservation = await db.reservation.create({
      data: {
        customerName,
        customerPhone,
        customerEmail,
        tableId,
        partySize: parseInt(partySize),
        date: new Date(date),
        time,
        status: 'PENDING',
        notes,
        specialRequests,
        createdById
      },
      include: {
        table: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      reservation,
      message: 'Reservation created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}

// PUT - Update reservation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, tableId, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = { ...updates }
    if (status) updateData.status = status
    if (tableId !== undefined) updateData.tableId = tableId

    const reservation = await db.reservation.update({
      where: { id },
      data: updateData,
      include: {
        table: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      reservation,
      message: 'Reservation updated successfully'
    })
  } catch (error) {
    console.error('Error updating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel reservation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      )
    }

    await db.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({
      success: true,
      message: 'Reservation cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling reservation:', error)
    return NextResponse.json(
      { error: 'Failed to cancel reservation' },
      { status: 500 }
    )
  }
}
