import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Gift Cards API
 * Handles gift card creation, validation, and balance management
 */

// GET - Fetch gift cards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cardNumber = searchParams.get('cardNumber')
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')

    if (cardNumber) {
      // Lookup specific card
      const giftCard = await db.giftCard.findUnique({
        where: { cardNumber },
        include: {
          customer: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          }
        }
      })

      if (!giftCard) {
        return NextResponse.json(
          { found: false, message: 'Gift card not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        found: true,
        data: {
          ...giftCard,
          pin: undefined // Don't return PIN
        }
      })
    }

    const where: any = {}
    if (customerId) where.customerId = customerId
    if (status) where.status = status

    const giftCards = await db.giftCard.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      found: true,
      data: giftCards.map(card => ({ ...card, pin: undefined }))
    })
  } catch (error) {
    console.error('Error fetching gift cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gift cards' },
      { status: 500 }
    )
  }
}

// POST - Create a new gift card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardNumber, pin, customerId, initialBalance, expiryDate, notes } = body

    if (!cardNumber || !pin) {
      return NextResponse.json(
        { error: 'Card number and PIN are required' },
        { status: 400 }
      )
    }

    // Check if card number already exists
    const existing = await db.giftCard.findUnique({
      where: { cardNumber }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Gift card number already exists' },
        { status: 400 }
      )
    }

    const giftCard = await db.giftCard.create({
      data: {
        cardNumber,
        pin,
        customerId: customerId || null,
        initialBalance: initialBalance || 0,
        currentBalance: initialBalance || 0,
        status: 'ACTIVE',
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        issuedAt: new Date(),
        expiresAt: expiryDate ? new Date(expiryDate) : null,
        notes: notes || null
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json({
      ...giftCard,
      pin: undefined // Don't return PIN
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating gift card:', error)
    return NextResponse.json(
      { error: 'Failed to create gift card' },
      { status: 500 }
    )
  }
}
