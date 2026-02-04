import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (orderId) {
      where.orderId = orderId
    }
    
    if (customerId) {
      where.customerId = customerId
    }
    
    if (status) {
      where.status = status
    }

    const deliveries = await db.delivery.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json(deliveries)
  } catch (error) {
    console.error('Error fetching deliveries:', error)
    return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      orderId,
      customerId,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      deliveryNotes,
      estimatedTime,
      deliveryPerson,
      deliveryPersonPhone
    } = body

    if (!orderId || !deliveryAddress) {
      return NextResponse.json({ error: 'orderId and deliveryAddress are required' }, { status: 400 })
    }

    const delivery = await db.delivery.create({
      data: {
        orderId,
        customerId,
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        deliveryNotes,
        estimatedTime,
        deliveryPerson,
        deliveryPersonPhone
      }
    })

    return NextResponse.json(delivery, { status: 201 })
  } catch (error) {
    console.error('Error creating delivery:', error)
    return NextResponse.json({ error: 'Failed to create delivery' }, { status: 500 })
  }
}
