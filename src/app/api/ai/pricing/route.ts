import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const menuItemId = searchParams.get('menuItemId')
    const isActive = searchParams.get('isActive')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (menuItemId) {
      where.menuItemId = menuItemId
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const optimizations = await db.priceOptimization.findMany({
      where,
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json(optimizations)
  } catch (error) {
    console.error('Error fetching price optimizations:', error)
    return NextResponse.json({ error: 'Failed to fetch price optimizations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      menuItemId,
      currentPrice,
      suggestedPrice,
      reason,
      expectedImpact,
      confidence
    } = body

    if (!menuItemId || !currentPrice || !suggestedPrice) {
      return NextResponse.json({ error: 'menuItemId, currentPrice, and suggestedPrice are required' }, { status: 400 })
    }

    const priceChange = ((suggestedPrice - currentPrice) / currentPrice) * 100

    const optimization = await db.priceOptimization.create({
      data: {
        menuItemId,
        currentPrice,
        suggestedPrice,
        priceChange,
        reason,
        expectedImpact: expectedImpact ? JSON.stringify(expectedImpact) : null,
        confidence
      },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    })

    return NextResponse.json(optimization, { status: 201 })
  } catch (error) {
    console.error('Error creating price optimization:', error)
    return NextResponse.json({ error: 'Failed to create price optimization' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isActive, appliedAt } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const data: any = {}
    
    if (isActive !== undefined) {
      data.isActive = isActive
      
      if (isActive) {
        data.appliedAt = appliedAt ? new Date(appliedAt) : new Date()
        
        // Update the actual menu item price
        const optimization = await db.priceOptimization.findUnique({
          where: { id },
          select: { menuItemId: true, suggestedPrice: true }
        })
        
        if (optimization) {
          await db.menuItem.update({
            where: { id: optimization.menuItemId },
            data: { price: optimization.suggestedPrice }
          })
        }
      }
    }

    const optimization = await db.priceOptimization.update({
      where: { id },
      data
    })

    return NextResponse.json(optimization)
  } catch (error) {
    console.error('Error updating price optimization:', error)
    return NextResponse.json({ error: 'Failed to update price optimization' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.priceOptimization.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting price optimization:', error)
    return NextResponse.json({ error: 'Failed to delete price optimization' }, { status: 500 })
  }
}
