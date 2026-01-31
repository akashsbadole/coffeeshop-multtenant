import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Barcode API for Retail POS
 * Handles barcode scanning and product lookup
 */

// GET - Lookup product by barcode
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barcode = searchParams.get('barcode')

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      )
    }

    // Try to find product variant with matching barcode first
    const variant = await db.productVariant.findFirst({
      where: { barcode },
      include: {
        menuItem: {
          include: {
            category: true
          }
        }
      }
    })

    if (variant) {
      return NextResponse.json({
        found: true,
        type: 'variant',
        data: variant
      })
    }

    // Try to find menu item with matching barcode
    const menuItem = await db.menuItem.findFirst({
      where: { barcode },
      include: {
        category: true,
        variants: true
      }
    })

    if (menuItem) {
      return NextResponse.json({
        found: true,
        type: 'product',
        data: menuItem
      })
    }

    // Product not found
    return NextResponse.json({
      found: false,
      message: 'No product found with this barcode'
    })
  } catch (error) {
    console.error('Error looking up barcode:', error)
    return NextResponse.json(
      { error: 'Failed to lookup barcode' },
      { status: 500 }
    )
  }
}

// POST - Generate/generate barcodes for products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { menuItemId, variantIds, barcodePrefix } = body

    let generatedBarcodes: any[] = []

    if (variantIds && Array.isArray(variantIds)) {
      // Generate barcodes for specific variants
      for (const variantId of variantIds) {
        const variant = await db.productVariant.update({
          where: { id: variantId },
          data: {
            barcode: `${barcodePrefix || 'SKU'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
          }
        })
        generatedBarcodes.push(variant)
      }
    } else if (menuItemId) {
      // Generate barcode for product
      const menuItem = await db.menuItem.update({
        where: { id: menuItemId },
        data: {
          barcode: `${barcodePrefix || 'SKU'}-${Date.now()}`
        }
      })
      generatedBarcodes.push(menuItem)
    }

    return NextResponse.json({
      success: true,
      barcodes: generatedBarcodes
    }, { status: 201 })
  } catch (error) {
    console.error('Error generating barcodes:', error)
    return NextResponse.json(
      { error: 'Failed to generate barcodes' },
      { status: 500 }
    )
  }
}
