import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export interface BundleItem {
  menuItemId: string
  quantity: number
  discountPercent?: number
}

export interface Bundle {
  id: string
  name: string
  description?: string
  items: BundleItem[]
  bundlePrice: number
  originalPrice: number
  savings: number
  isActive: boolean
  validFrom?: Date
  validUntil?: Date
  minQuantity?: number
  maxQuantity?: number
  usageCount: number
  maxUsage?: number
}

// GET - Fetch all bundles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    const id = searchParams.get('id')

    if (id) {
      // Get specific bundle
      // For now, we'll return a simplified structure
      return NextResponse.json({
        success: true,
        bundle: null
      })
    }

    // Get all bundles from discounts table (using discounts with type BUNDLE)
    const bundles = await db.discount.findMany({
      where: activeOnly ? { 
        type: 'BUNDLE',
        isActive: true,
        status: 'ACTIVE'
      } : {
        type: 'BUNDLE'
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      bundles: bundles.map(bundle => ({
        id: bundle.id,
        name: bundle.code,
        description: bundle.minOrderValue ? `Min order: ₹${bundle.minOrderValue}` : undefined,
        type: bundle.type,
        value: bundle.value,
        isActive: bundle.isActive,
        usageCount: bundle.usedCount,
        maxUsage: bundle.usageLimit,
        validFrom: bundle.validFrom,
        validUntil: bundle.validUntil
      }))
    })
  } catch (error) {
    console.error('Error fetching bundles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bundles' },
      { status: 500 }
    )
  }
}

// POST - Create new bundle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      items, 
      bundlePrice, 
      originalPrice,
      validFrom,
      validUntil,
      maxUsage,
      minQuantity
    } = body

    if (!name || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Bundle name and at least one item are required' },
        { status: 400 }
      )
    }

    // Calculate savings
    const savings = (originalPrice || 0) - (bundlePrice || 0)
    const discountPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0

    // Create bundle as a discount with type BUNDLE
    const bundle = await db.discount.create({
      data: {
        code: name,
        type: 'BUNDLE',
        value: discountPercent,
        minOrderValue: minQuantity || 0,
        maxDiscount: savings,
        usageLimit: maxUsage,
        usedCount: 0,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: true,
        status: 'ACTIVE',
        categoryIds: JSON.stringify(items.map((item: any) => item.menuItemId))
      }
    })

    return NextResponse.json({
      success: true,
      bundle: {
        id: bundle.id,
        name: bundle.code,
        description,
        items,
        bundlePrice,
        originalPrice,
        savings,
        discountPercent,
        isActive: bundle.isActive,
        validFrom: bundle.validFrom,
        validUntil: bundle.validUntil,
        maxUsage: bundle.usageLimit,
        usageCount: 0
      },
      message: 'Bundle created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating bundle:', error)
    return NextResponse.json(
      { error: 'Failed to create bundle' },
      { status: 500 }
    )
  }
}

// PUT - Update bundle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isActive, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Bundle ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (updates.name) updateData.code = updates.name
    if (isActive !== undefined) {
      updateData.isActive = isActive
      updateData.status = isActive ? 'ACTIVE' : 'INACTIVE'
    }
    if (updates.maxUsage !== undefined) updateData.usageLimit = updates.maxUsage
    if (updates.validFrom) updateData.validFrom = new Date(updates.validFrom)
    if (updates.validUntil) updateData.validUntil = new Date(updates.validUntil)

    const bundle = await db.discount.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      bundle: {
        id: bundle.id,
        name: bundle.code,
        isActive: bundle.isActive,
        status: bundle.status,
        maxUsage: bundle.usageLimit,
        usageCount: bundle.usedCount
      },
      message: 'Bundle updated successfully'
    })
  } catch (error) {
    console.error('Error updating bundle:', error)
    return NextResponse.json(
      { error: 'Failed to update bundle' },
      { status: 500 }
    )
  }
}

// DELETE - Delete bundle
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Bundle ID is required' },
        { status: 400 }
      )
    }

    await db.discount.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Bundle deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting bundle:', error)
    return NextResponse.json(
      { error: 'Failed to delete bundle' },
      { status: 500 }
    )
  }
}
