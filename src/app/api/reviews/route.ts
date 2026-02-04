import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const customerId = searchParams.get('customerId')
    const rating = searchParams.get('rating')
    const sentiment = searchParams.get('sentiment')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (orderId) {
      where.orderId = orderId
    }
    
    if (customerId) {
      where.customerId = customerId
    }
    
    if (rating) {
      where.rating = parseInt(rating)
    }
    
    if (sentiment) {
      where.sentiment = sentiment
    }

    const reviews = await db.review.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      orderId,
      customerId,
      rating,
      title,
      content
    } = body

    if (!rating) {
      return NextResponse.json({ error: 'rating is required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 })
    }

    const review = await db.review.create({
      data: {
        orderId,
        customerId,
        rating,
        title,
        content
      }
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
