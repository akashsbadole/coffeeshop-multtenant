import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Customer Management API
 * Handles customer CRUD operations, loyalty points management
 */

// GET - Fetch customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const search = searchParams.get('search')
    const tier = searchParams.get('tier')

    const where: any = {}

    if (phone) {
      where.phone = phone
    }

    if (tier) {
      where.loyaltyTier = tier.toUpperCase()
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ]
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: { orders: true }
        }
      }
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, address, gstin, panNumber } = body

    // Check if customer with phone already exists
    if (phone) {
      const existing = await db.customer.findUnique({
        where: { phone }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Customer with this phone number already exists' },
          { status: 409 }
        )
      }
    }

    const customer = await db.customer.create({
      data: {
        name,
        phone,
        email,
        address,
        gstin,
        panNumber,
        loyaltyPoints: 0,
        loyaltyTier: 'BRONZE',
        totalSpent: 0,
        visitCount: 0
      }
    })

    return NextResponse.json({
      success: true,
      customer,
      message: 'Customer created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}

// PUT - Update customer
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, phone, email, address, gstin, panNumber } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const customer = await db.customer.findUnique({
      where: { id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (address !== undefined) updateData.address = address
    if (gstin !== undefined) updateData.gstin = gstin
    if (panNumber !== undefined) updateData.panNumber = panNumber
    if (phone !== undefined) {
      // Check if new phone number conflicts
      const existing = await db.customer.findUnique({
        where: { phone }
      })
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: 'Phone number already in use' },
          { status: 409 }
        )
      }
      updateData.phone = phone
    }

    const updatedCustomer = await db.customer.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: 'Customer updated successfully'
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE - Delete customer
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    await db.customer.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
