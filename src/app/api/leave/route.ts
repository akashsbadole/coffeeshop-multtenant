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
    const status = searchParams.get('status')
    const year = searchParams.get('year')

    const where: any = {}
    if (userId) where.userId = userId
    if (status) where.status = status.toUpperCase()
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1)
      const endOfYear = new Date(parseInt(year), 11, 31)
      where.startDate = { gte: startOfYear, lte: endOfYear }
    }

    const leaveRequests = await db.leaveRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const summary = {
      total: leaveRequests.length,
      pending: leaveRequests.filter(l => l.status === 'PENDING').length,
      approved: leaveRequests.filter(l => l.status === 'APPROVED').length,
      rejected: leaveRequests.filter(l => l.status === 'REJECTED').length
    }

    return NextResponse.json({ requests: leaveRequests, summary })
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 })
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
    const { userId, leaveType, startDate, endDate, reason } = body

    if (!userId || !leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    const leaveRequest = await db.leaveRequest.create({
      data: {
        userId,
        leaveType: leaveType.toUpperCase(),
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: 'PENDING'
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json({
      success: true,
      leaveRequest,
      message: 'Leave request submitted successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating leave request:', error)
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    const { requestId, action, rejectionReason } = body

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 })
    }

    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id: requestId }
    })

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    }

    if (action === 'approve') {
      await db.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedBy: tenant.organizationId,
          approvedAt: new Date()
        }
      })

      await db.notification.create({
        data: {
          userId: leaveRequest.userId,
          type: 'LEAVE',
          title: 'Leave Approved',
          message: `Your ${leaveRequest.leaveType.toLowerCase()} leave has been approved.`,
          priority: 'MEDIUM'
        }
      })

      return NextResponse.json({ success: true, message: 'Leave request approved' })
    }

    if (action === 'reject') {
      await db.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          approvedBy: tenant.organizationId,
          rejectionReason: rejectionReason || 'Leave request rejected'
        }
      })

      await db.notification.create({
        data: {
          userId: leaveRequest.userId,
          type: 'LEAVE',
          title: 'Leave Rejected',
          message: `Your leave request has been rejected. Reason: ${rejectionReason}`,
          priority: 'MEDIUM'
        }
      })

      return NextResponse.json({ success: true, message: 'Leave request rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating leave request:', error)
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email')
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    await db.leaveRequest.delete({ where: { id: requestId } })

    return NextResponse.json({ success: true, message: 'Leave request deleted' })
  } catch (error) {
    console.error('Error deleting leave request:', error)
    return NextResponse.json({ error: 'Failed to delete leave request' }, { status: 500 })
  }
}
