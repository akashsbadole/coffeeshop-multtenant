import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'
    const typeParam = searchParams.get('type') // all, percentage, fixed, bogo, bundle

    const discounts = await db.discount.findMany({
      where: {
        isActive: activeOnly ? true : undefined,
        type: typeParam ? typeParam.toUpperCase() : undefined
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(discounts)
  } catch (error) {
    console.error('Get discounts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      code,
      type, // PERCENTAGE, FIXED, BOGO, BUNDLE
      value,
      description,
      usageLimit,
      minOrderValue,
      maxDiscount,
      categoryIds,
      validFrom,
      validUntil,
      isActive
    } = body

    // Check if discount code already exists
    const existingDiscount = await db.discount.findFirst({
      where: { code: code.toUpperCase() }
    })

    if (existingDiscount) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      )
    }

    // Validate dates
    if (validFrom && validUntil && new Date(validFrom) > new Date(validUntil)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Create discount
    const discount = await db.discount.create({
      data: {
        code: code.toUpperCase(),
        type: type?.toUpperCase() || 'PERCENTAGE',
        value: parseFloat(value) || 0,
        minOrderValue: parseFloat(minOrderValue) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        categoryIds: categoryIds ? JSON.stringify(categoryIds) : null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: isActive !== undefined ? isActive : true,
        usedCount: 0
      }
    })

    return NextResponse.json({
      success: true,
      discount,
      message: `Discount "${code}" created successfully`
    }, { status: 201 })
  } catch (error) {
    console.error('Create discount error:', error)
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, isActive, status } = body

    const discount = await db.discount.findUnique({
      where: { id }
    })

    if (!discount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      )
    }

    // Update discount status
    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (status) updateData.status = status

    const updatedDiscount = await db.discount.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      discount: updatedDiscount,
      message: isActive ? 'Discount activated' : 'Discount deactivated'
    })
  } catch (error) {
    console.error('Update discount error:', error)
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Discount ID required' },
        { status: 400 }
      )
    }

    // Delete discount
    await db.discount.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Discount deleted successfully'
    })
  } catch (error) {
    console.error('Delete discount error:', error)
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    )
  }
}
