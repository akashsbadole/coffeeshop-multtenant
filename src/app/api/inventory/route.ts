import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    const where: any = {}
    
    if (organizationId) {
      where.menuItem = {
        organizationId
      }
    }

    const inventory = await db.inventoryItem.findMany({
      where,
      include: {
        menuItem: {
          include: {
            category: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { organizationId, menuItemId, quantity, reorderLevel } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const inventoryItem = await db.inventoryItem.create({
      data: {
        menuItemId,
        quantity: parseInt(quantity),
        reorderLevel: parseInt(reorderLevel) || 10
      },
      include: {
        menuItem: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json(inventoryItem, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}
