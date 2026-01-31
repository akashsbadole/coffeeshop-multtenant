import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Product Variants API for Garment POS
 * Handles size, color variants and inventory for products
 */

// GET - Fetch variants for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const menuItemId = searchParams.get('menuItemId')

    if (!menuItemId) {
      return NextResponse.json(
        { error: 'Menu item ID is required' },
        { status: 400 }
      )
    }

    const variants = await db.productVariant.findMany({
      where: { menuItemId },
      orderBy: [{ size: 'asc' }, { color: 'asc' }]
    })

    return NextResponse.json(variants)
  } catch (error) {
    console.error('Error fetching variants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch variants' },
      { status: 500 }
    )
  }
}

// POST - Create a new product variant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { menuItemId, size, color, sku, barcode, stockQuantity, priceAdjustment } = body

    if (!menuItemId) {
      return NextResponse.json(
        { error: 'Menu item ID is required' },
        { status: 400 }
      )
    }

    const variant = await db.productVariant.create({
      data: {
        menuItemId,
        size: size || null,
        color: color || null,
        sku: sku || null,
        barcode: barcode || null,
        stockQuantity: stockQuantity || 0,
        priceAdjustment: priceAdjustment || 0
      }
    })

    return NextResponse.json(variant, { status: 201 })
  } catch (error) {
    console.error('Error creating variant:', error)
    return NextResponse.json(
      { error: 'Failed to create variant' },
      { status: 500 }
    )
  }
}
