import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const delivery = await db.delivery.findUnique({
      where: { id: params.id }
    })

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    return NextResponse.json(delivery)
  } catch (error) {
    console.error('Error fetching delivery:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const delivery = await db.delivery.update({
      where: { id: params.id },
      data: body
    })

    return NextResponse.json(delivery)
  } catch (error) {
    console.error('Error updating delivery:', error)
    return NextResponse.json({ error: 'Failed to update delivery' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, pickupTime, deliveredAt } = body

    const updateData: any = {}
    
    if (status) {
      updateData.status = status
      
      if (status === 'OUT_FOR_DELIVERY' && pickupTime) {
        updateData.pickupTime = new Date(pickupTime)
      }
      
      if (status === 'DELIVERED') {
        updateData.deliveredAt = deliveredAt ? new Date(deliveredAt) : new Date()
      }
    }

    const delivery = await db.delivery.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(delivery)
  } catch (error) {
    console.error('Error updating delivery status:', error)
    return NextResponse.json({ error: 'Failed to update delivery status' }, { status: 500 })
  }
}
