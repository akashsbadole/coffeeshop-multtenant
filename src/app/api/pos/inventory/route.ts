import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Inventory API for Retail POS
 * Handles inventory management, stock tracking, and low stock alerts
 */

// GET - Fetch inventory items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lowStock = searchParams.get('lowStock') === 'true'
    const menuItemId = searchParams.get('menuItemId')

    const where: any = {}

    if (menuItemId) {
      where.menuItemId = menuItemId
    }

    if (lowStock) {
      // Using a simple filter for low stock (SQLite limitation)
      // In production, you'd filter at the database level
      const allItems = await db.inventoryItem.findMany({
        where,
        include: {
          menuItem: {
            include: {
              category: true
            }
          }
        },
        orderBy: { quantity: 'asc' }
      })

      const lowStockItems = allItems.filter(
        item => item.quantity <= item.reorderLevel
      )

      return NextResponse.json(lowStockItems)
    }

    const inventoryItems = await db.inventoryItem.findMany({
      where,
      include: {
        menuItem: {
          include: {
            category: true
          }
        }
      },
      orderBy: { quantity: 'asc' }
    })

    return NextResponse.json(inventoryItems)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

// POST - Create or update inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { menuItemId, quantity, reorderLevel, maxStock, location, serialNumbers } = body

    if (!menuItemId) {
      return NextResponse.json(
        { error: 'Menu item ID is required' },
        { status: 400 }
      )
    }

    // Check if inventory item already exists
    const existing = await db.inventoryItem.findUnique({
      where: { menuItemId }
    })

    let inventoryItem

    if (existing) {
      // Update existing inventory item
      inventoryItem = await db.inventoryItem.update({
        where: { menuItemId },
        data: {
          quantity: quantity !== undefined ? quantity : existing.quantity,
          reorderLevel: reorderLevel !== undefined ? reorderLevel : existing.reorderLevel,
          maxStock: maxStock !== undefined ? maxStock : existing.maxStock,
          location: location !== undefined ? location : existing.location,
          serialNumbers: serialNumbers !== undefined ? JSON.stringify(serialNumbers) : existing.serialNumbers,
          lastRestocked: quantity !== undefined && quantity > existing.quantity ? new Date() : existing.lastRestocked
        }
      })
    } else {
      // Create new inventory item
      inventoryItem = await db.inventoryItem.create({
        data: {
          menuItemId,
          quantity: quantity || 0,
          reorderLevel: reorderLevel || 10,
          maxStock: maxStock || null,
          location: location || null,
          serialNumbers: serialNumbers ? JSON.stringify(serialNumbers) : null,
          lastRestocked: new Date()
        }
      })
    }

    // Check if stock is low
    const isLowStock = inventoryItem.quantity <= inventoryItem.reorderLevel

    return NextResponse.json({
      ...inventoryItem,
      serialNumbers: inventoryItem.serialNumbers ? JSON.parse(inventoryItem.serialNumbers) : null,
      isLowStock
    }, { status: 201 })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}
