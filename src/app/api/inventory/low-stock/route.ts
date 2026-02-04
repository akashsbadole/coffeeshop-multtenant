import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Low Stock Alerts API
 * Returns items that are below their reorder threshold
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const criticalOnly = searchParams.get('critical') === 'true'
    
    // Get all inventory items with their menu items
    const inventoryItems = await db.inventoryItem.findMany({
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Get product variants with stock
    const variants = await db.productVariant.findMany({
      where: {
        stockQuantity: {
          lte: 10 // Default low stock threshold
        }
      },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Process inventory items
    const lowStockItems = inventoryItems
      .filter(item => {
        const threshold = item.reorderLevel || 10
        return item.quantity <= threshold
      })
      .map(item => ({
        id: item.id,
        type: 'inventory',
        name: item.menuItem.name,
        sku: item.menuItem.sku,
        barcode: item.menuItem.barcode,
        category: item.menuItem.category?.name || 'Uncategorized',
        currentQuantity: item.quantity,
        reorderLevel: item.reorderLevel || 10,
        maxStock: item.maxStock,
        lastRestocked: item.lastRestocked,
        status: item.quantity === 0 ? 'out_of_stock' : 
                item.quantity <= (item.reorderLevel || 10) * 0.5 ? 'critical' : 'low'
      }))

    // Process variant items
    const lowStockVariants = variants.map(variant => ({
      id: variant.id,
      type: 'variant',
      name: `${variant.menuItem.name} (${variant.size || ''} ${variant.color || ''})`.trim(),
      sku: variant.sku,
      barcode: variant.barcode,
      category: variant.menuItem.category?.name || 'Uncategorized',
      currentQuantity: variant.stockQuantity,
      reorderLevel: 10,
      maxStock: null,
      lastRestocked: null,
      status: variant.stockQuantity === 0 ? 'out_of_stock' :
              variant.stockQuantity <= 5 ? 'critical' : 'low'
    }))

    // Combine and sort by status priority
    const allAlerts = [...lowStockItems, ...lowStockVariants]
      .sort((a, b) => {
        const priority = { out_of_stock: 0, critical: 1, low: 2 }
        return priority[a.status] - priority[b.status]
      })

    // Filter critical only if requested
    const filteredAlerts = criticalOnly 
      ? allAlerts.filter(item => item.status === 'critical' || item.status === 'out_of_stock')
      : allAlerts

    // Calculate summary
    const summary = {
      totalAlerts: allAlerts.length,
      critical: allAlerts.filter(i => i.status === 'critical').length,
      outOfStock: allAlerts.filter(i => i.status === 'out_of_stock').length,
      low: allAlerts.filter(i => i.status === 'low').length
    }

    return NextResponse.json({
      alerts: filteredAlerts,
      summary,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching low stock alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch low stock alerts' },
      { status: 500 }
    )
  }
}

// POST - Mark alert as acknowledged
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, itemType, notes } = body

    // In a real implementation, you might want to store acknowledged alerts
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Alert acknowledged',
      acknowledgedAt: new Date().toISOString(),
      itemId,
      itemType,
      notes
    })
  } catch (error) {
    console.error('Error acknowledging alert:', error)
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    )
  }
}
