import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Tables API for Food POS
 * Handles table management (CRUD operations)
 */

// GET - Fetch all tables
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const section = searchParams.get('section')

    const where: any = {}
    if (status) where.status = status
    if (section) where.section = section

    const tables = await db.table.findMany({
      where,
      orderBy: [{ section: 'asc' }, { name: 'asc' }],
      include: {
        orders: {
          where: {
            status: { in: ['PENDING', 'PREPARING', 'READY'] }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(tables)
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    )
  }
}

// POST - Create a new table
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, capacity, section, qrCode } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      )
    }

    const table = await db.table.create({
      data: {
        name,
        capacity: capacity || 4,
        section: section || 'Main',
        status: 'AVAILABLE',
        qrCode
      }
    })

    return NextResponse.json(table, { status: 201 })
  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    )
  }
}
