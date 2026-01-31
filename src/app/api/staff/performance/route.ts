import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Staff Performance API
 * Handles staff performance tracking and metrics
 */

// GET - Fetch staff performance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') // today, week, month, year

    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (period) {
      const now = new Date()
      switch (period.toLowerCase()) {
        case 'today':
          where.date = {
            gte: new Date(now.setHours(0, 0, 0, 0)),
            lte: new Date(now.setHours(23, 59, 59, 999))
          }
          break
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7))
          where.date = { gte: weekAgo }
          break
        case 'month':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
          where.date = { gte: monthAgo }
          break
        case 'year':
          const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1))
          where.date = { gte: yearAgo }
          break
      }
    }

    if (startDate || endDate) {
      where.date = where.date || {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const performanceRecords = await db.staffPerformance.findMany({
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

    // Calculate aggregates
    const aggregates = performanceRecords.reduce((acc, record) => {
      acc.totalOrders += record.ordersProcessed
      acc.totalSales += record.totalSales
      acc.avgOrderValue = acc.totalOrders > 0
        ? acc.totalSales / acc.totalOrders
        : 0
      if (record.customerRating) {
        acc.totalRating += record.customerRating
        acc.ratingCount++
      }
      return acc
    }, {
      totalOrders: 0,
      totalSales: 0,
      avgOrderValue: 0,
      totalRating: 0,
      ratingCount: 0
    })

    return NextResponse.json({
      records: performanceRecords,
      summary: {
        ...aggregates,
        avgCustomerRating: aggregates.ratingCount > 0
          ? aggregates.totalRating / aggregates.ratingCount
          : null
      }
    })
  } catch (error) {
    console.error('Error fetching staff performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff performance' },
      { status: 500 }
    )
  }
}

// POST - Create or update staff performance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      date,
      ordersProcessed,
      totalSales,
      averageOrderValue,
      customerRating
    } = body

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'User ID and date are required' },
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

    // Check if performance record already exists for this date and user
    const existing = await db.staffPerformance.findFirst({
      where: {
        userId,
        date: new Date(new Date(date).setHours(0, 0, 0, 0))
      }
    })

    let performance

    if (existing) {
      // Update existing record
      performance = await db.staffPerformance.update({
        where: { id: existing.id },
        data: {
          ordersProcessed: ordersProcessed || existing.ordersProcessed,
          totalSales: totalSales || existing.totalSales,
          averageOrderValue: averageOrderValue || existing.averageOrderValue,
          customerRating: customerRating || existing.customerRating
        }
      })
    } else {
      // Create new record
      performance = await db.staffPerformance.create({
        data: {
          userId,
          date: new Date(new Date(date).setHours(0, 0, 0, 0)),
          ordersProcessed: ordersProcessed || 0,
          totalSales: totalSales || 0,
          averageOrderValue,
          customerRating
        }
      })
    }

    return NextResponse.json({
      success: true,
      performance,
      message: existing ? 'Performance updated successfully' : 'Performance recorded successfully'
    }, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error('Error saving staff performance:', error)
    return NextResponse.json(
      { error: 'Failed to save staff performance' },
      { status: 500 }
    )
  }
}

// PUT - Update staff performance
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ordersProcessed, totalSales, averageOrderValue, customerRating } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Performance ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (ordersProcessed !== undefined) updateData.ordersProcessed = ordersProcessed
    if (totalSales !== undefined) updateData.totalSales = totalSales
    if (averageOrderValue !== undefined) updateData.averageOrderValue = averageOrderValue
    if (customerRating !== undefined) updateData.customerRating = customerRating

    const performance = await db.staffPerformance.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      performance,
      message: 'Performance updated successfully'
    })
  } catch (error) {
    console.error('Error updating staff performance:', error)
    return NextResponse.json(
      { error: 'Failed to update staff performance' },
      { status: 500 }
    )
  }
}
