import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Attendance Management API
 * Handles staff clock-in, clock-out, and attendance tracking
 */

// GET - Fetch attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const period = searchParams.get('period')

    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    if (period) {
      const now = new Date()
      switch (period.toLowerCase()) {
        case 'today':
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          where.date = { gte: today }
          break
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7))
          where.date = { gte: weekAgo }
          break
        case 'month':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
          where.date = { gte: monthAgo }
          break
      }
    }

    if (startDate || endDate) {
      where.date = where.date || {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const attendance = await db.attendance.findMany({
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
      orderBy: { date: 'desc' }
    })

    // Calculate summary
    const summary = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      halfDay: attendance.filter(a => a.status === 'HALF_DAY').length,
      onLeave: attendance.filter(a => a.status === 'ON_LEAVE').length,
      totalRegularHours: attendance.reduce((sum, a) => sum + a.regularHours, 0),
      totalOvertimeHours: attendance.reduce((sum, a) => sum + a.overtimeHours, 0)
    }

    return NextResponse.json({
      records: attendance,
      summary
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

// POST - Clock in/out
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, notes } = body

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action (clockIn/clockOut) are required' },
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find today's attendance record
    let attendance = await db.attendance.findFirst({
      where: {
        userId,
        date: { gte: today }
      }
    })

    if (action === 'clockIn') {
      if (attendance && attendance.clockIn) {
        return NextResponse.json(
          { error: 'Already clocked in today' },
          { status: 400 }
        )
      }

      // Check if late (after 9:30 AM)
      const now = new Date()
      const lateThreshold = new Date(today)
      lateThreshold.setHours(9, 30, 0, 0)
      const status = now > lateThreshold ? 'LATE' : 'PRESENT'

      if (attendance) {
        attendance = await db.attendance.update({
          where: { id: attendance.id },
          data: {
            clockIn: new Date(),
            status,
            notes
          }
        })
      } else {
        attendance = await db.attendance.create({
          data: {
            userId,
            date: new Date(),
            clockIn: new Date(),
            status,
            notes
          }
        })
      }

      return NextResponse.json({
        success: true,
        attendance,
        message: status === 'LATE' ? 'Clocked in late' : 'Clocked in successfully'
      }, { status: 201 })
    } else if (action === 'clockOut') {
      if (!attendance || !attendance.clockIn) {
        return NextResponse.json(
          { error: 'Not clocked in today' },
          { status: 400 }
        )
      }

      if (attendance.clockOut) {
        return NextResponse.json(
          { error: 'Already clocked out today' },
          { status: 400 }
        )
      }

      const clockInTime = new Date(attendance.clockIn)
      const clockOutTime = new Date()
      
      // Calculate hours worked
      const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)
      
      // Regular hours (8 hours) and overtime
      const regularHours = Math.min(hoursWorked, 8)
      const overtimeHours = Math.max(hoursWorked - 8, 0)

      attendance = await db.attendance.update({
        where: { id: attendance.id },
        data: {
          clockOut: clockOutTime,
          regularHours,
          overtimeHours,
          notes: attendance.notes ? `${attendance.notes}; ${notes}` : notes
        }
      })

      return NextResponse.json({
        success: true,
        attendance,
        message: 'Clocked out successfully',
        hoursWorked: {
          regular: regularHours.toFixed(2),
          overtime: overtimeHours.toFixed(2)
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use clockIn or clockOut' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error processing attendance:', error)
    return NextResponse.json(
      { error: 'Failed to process attendance' },
      { status: 500 }
    )
  }
}

// PUT - Update attendance (for manual adjustments)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, regularHours, overtimeHours, overtimeStatus, notes } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Attendance ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status.toUpperCase()
    if (regularHours !== undefined) updateData.regularHours = regularHours
    if (overtimeHours !== undefined) updateData.overtimeHours = overtimeHours
    if (overtimeStatus) updateData.overtimeStatus = overtimeStatus.toUpperCase()
    if (notes !== undefined) updateData.notes = notes

    const attendance = await db.attendance.update({
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
      attendance,
      message: 'Attendance updated successfully'
    })
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    )
  }
}

// DELETE - Delete attendance record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Attendance ID is required' },
        { status: 400 }
      )
    }

    await db.attendance.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting attendance:', error)
    return NextResponse.json(
      { error: 'Failed to delete attendance record' },
      { status: 500 }
    )
  }
}
