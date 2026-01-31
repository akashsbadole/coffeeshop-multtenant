import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { quantity, lowStockAlert } = body

    const updateData: any = {
      updatedAt: new Date()
    }

    if (typeof quantity === 'number') {
      updateData.quantity = quantity
    }

    if (typeof lowStockAlert === 'number') {
      updateData.lowStockAlert = lowStockAlert
    }

    // If this is a restock, update the lastRestocked timestamp
    if (typeof quantity === 'number') {
      const currentItem = await db.inventoryItem.findUnique({
        where: { id: params.id }
      })
      if (currentItem && quantity > currentItem.quantity) {
        updateData.lastRestocked = new Date()
      }
    }

    const inventoryItem = await db.inventoryItem.update({
      where: { id: params.id },
      data: updateData,
      include: {
        menuItem: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json(inventoryItem)
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    )
  }
}
