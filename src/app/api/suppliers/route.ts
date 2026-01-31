import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Suppliers Management API
 * Handles supplier CRUD operations for Retail POS
 */

// GET - Fetch suppliers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    const search = searchParams.get('search')

    const where: any = {}

    if (activeOnly) {
      where.isActive = true
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ]
    }

    const suppliers = await db.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { purchaseOrders: true }
        }
      }
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST - Create supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, contactPerson, phone, email, address, gstin, isActive } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    const supplier = await db.supplier.create({
      data: {
        name,
        contactPerson,
        phone,
        email,
        address,
        gstin,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({
      success: true,
      supplier,
      message: 'Supplier created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}

// PUT - Update supplier
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, contactPerson, phone, email, address, gstin, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      )
    }

    const supplier = await db.supplier.findUnique({
      where: { id }
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (address !== undefined) updateData.address = address
    if (gstin !== undefined) updateData.gstin = gstin
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedSupplier = await db.supplier.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      supplier: updatedSupplier,
      message: 'Supplier updated successfully'
    })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

// DELETE - Delete supplier
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      )
    }

    await db.supplier.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}
