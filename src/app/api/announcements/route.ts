import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Announcements API
 * Handles store announcements, notifications, and alerts
 */

// GET - Fetch announcements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    const type = searchParams.get('type') // INFO, WARNING, URGENT
    const role = searchParams.get('role') // CASHIER, MANAGER, ADMIN

    const where: any = {}

    if (activeOnly) {
      where.isActive = true
      where.startDate = { lte: new Date() }
      where.OR = [
        { endDate: null },
        { endDate: { gte: new Date() } }
      ]
    }

    if (type) {
      where.type = type.toUpperCase()
    }

    if (role) {
      where.OR = [
        { targetRole: role.toUpperCase() },
        { targetRole: null }
      ]
    }

    const announcements = await db.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

// POST - Create announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, type, startDate, endDate, targetRole, isActive } = body

    if (!title || !content || !type) {
      return NextResponse.json(
        { error: 'Title, content, and type are required' },
        { status: 400 }
      )
    }

    const validTypes = ['INFO', 'WARNING', 'URGENT']
    if (!validTypes.includes(type.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid type. Must be INFO, WARNING, or URGENT' },
        { status: 400 }
      )
    }

    const validRoles = ['CASHIER', 'MANAGER', 'ADMIN']
    if (targetRole && !validRoles.includes(targetRole.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid role. Must be CASHIER, MANAGER, or ADMIN' },
        { status: 400 }
      )
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        type: type.toUpperCase(),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        targetRole: targetRole ? targetRole.toUpperCase() : null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({
      success: true,
      announcement,
      message: 'Announcement created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}

// PUT - Update announcement
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isActive, title, content } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (title) updateData.title = title
    if (content) updateData.content = content

    const announcement = await db.announcement.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      announcement,
      message: 'Announcement updated successfully'
    })
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    )
  }
}

// DELETE - Delete announcement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      )
    }

    await db.announcement.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    )
  }
}
