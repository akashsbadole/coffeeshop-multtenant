import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const inventory = await db.inventoryItem.findMany({
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
    const { menuItemId, quantity, unit, lowStockAlert } = body

    const inventoryItem = await db.inventoryItem.create({
      data: {
        menuItemId,
        quantity: parseInt(quantity),
        unit: unit || 'pcs',
        lowStockAlert: parseInt(lowStockAlert) || 10
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
