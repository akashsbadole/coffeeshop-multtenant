import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: any = {}
    
    if (organizationId) {
      where.organizationId = organizationId
    }
    
    if (status) {
      where.status = status
    }
    
    if (type) {
      where.type = type
    }

    const stores = await db.store.findMany({
      where,
      include: {
        settings: true,
        managers: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(stores)
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      organizationId,
      name,
      code,
      type = 'BRANCH',
      status = 'ACTIVE',
      address,
      city,
      state,
      stateCode,
      pincode,
      country = 'India',
      phone,
      email,
      gstin,
      latitude,
      longitude,
      timezone = 'Asia/Kolkata',
      currency = 'INR',
      openingHours,
      isDefault = false,
      logoUrl,
      notes,
      settings
    } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    const store = await db.store.create({
      data: {
        organizationId,
        name,
        code,
        type,
        status,
        address,
        city,
        state,
        stateCode,
        pincode,
        country,
        phone,
        email,
        gstin,
        latitude,
        longitude,
        timezone,
        currency,
        openingHours,
        isDefault,
        logoUrl,
        notes,
        settings: settings ? {
          create: settings
        } : undefined
      },
      include: {
        settings: true
      }
    })

    return NextResponse.json(store, { status: 201 })
  } catch (error) {
    console.error('Error creating store:', error)
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 })
  }
}
