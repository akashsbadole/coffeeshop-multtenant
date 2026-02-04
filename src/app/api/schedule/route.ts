import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContextFromEmail } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email')
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await getTenantContextFromEmail(email)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const action = searchParams.get('action')

    if (action === 'calendar') {
      const where: any = {
        date: {
          gte: startDate ? new Date(startDate) : new Date(),
          lte: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }

      if (userId) where.userId = userId

      const scheduleAssignments = await db.scheduleAssignment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, role: true } }
        },
        orderBy: { date: 'asc' }
      })

      const attendance = await db.attendance.findMany({
        where: {
          date: where.date,
          ...(userId && { userId })
        },
        include: {
          user: { select: { id: true, name: true, role: true } }
        }
      })

      const leaveRequests = await db.leaveRequest.findMany({
        where: {
          status: 'APPROVED',
          startDate: where.date.gte,
          endDate: where.date.lte,
          ...(userId && { userId })
        },
        include: {
          user: { select: { id: true, name: true, role: true } }
        }
      })

      return NextResponse.json({
        schedule: scheduleAssignments,
        attendance,
        leaves: leaveRequests
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email')
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await getTenantContextFromEmail(email)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (action === 'createSchedule') {
      const { weekStartDate, weekEndDate, assignments, notes } = data

      let schedule = await db.weeklySchedule.findFirst({
        where: { weekStartDate: new Date(weekStartDate) }
      })

      if (schedule) {
        await db.scheduleAssignment.deleteMany({ where: { scheduleId: schedule.id } })
        schedule = await db.weeklySchedule.update({
          where: { id: schedule.id },
          data: { weekEndDate: new Date(weekEndDate), notes, isPublished: false }
        })
      } else {
        schedule = await db.weeklySchedule.create({
          data: {
            weekStartDate: new Date(weekStartDate),
            weekEndDate: new Date(weekEndDate),
            notes
          }
        })
      }

      const assignmentsData = assignments.map((a: any) => ({
        scheduleId: schedule.id,
        userId: a.userId,
        date: new Date(a.date),
        shiftType: a.shiftType,
        startTime: a.startTime,
        endTime: a.endTime,
        isOffDay: a.isOffDay || false,
        notes: a.notes
      }))

      await db.scheduleAssignment.createMany({ data: assignmentsData })

      return NextResponse.json({
        success: true,
        schedule,
        message: 'Schedule created successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
