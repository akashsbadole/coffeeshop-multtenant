import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const forecastDate = searchParams.get('forecastDate')
    const storeId = searchParams.get('storeId')
    const menuItemId = searchParams.get('menuItemId')
    const limit = parseInt(searchParams.get('limit') || '30')

    const where: any = {}
    
    if (forecastDate) {
      where.forecastDate = new Date(forecastDate)
    }
    
    if (storeId) {
      where.storeId = storeId
    }
    
    if (menuItemId) {
      where.menuItemId = menuItemId
    }

    const forecasts = await db.salesForecast.findMany({
      where,
      orderBy: {
        forecastDate: 'desc'
      },
      take: limit
    })

    return NextResponse.json(forecasts)
  } catch (error) {
    console.error('Error fetching sales forecasts:', error)
    return NextResponse.json({ error: 'Failed to fetch sales forecasts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      forecastDate,
      storeId,
      menuItemId,
      predictedRevenue,
      predictedOrders,
      confidence,
      factors
    } = body

    if (!forecastDate) {
      return NextResponse.json({ error: 'forecastDate is required' }, { status: 400 })
    }

    const forecast = await db.salesForecast.create({
      data: {
        forecastDate: new Date(forecastDate),
        storeId,
        menuItemId,
        predictedRevenue,
        predictedOrders,
        confidence,
        factors: factors ? JSON.stringify(factors) : null
      }
    })

    return NextResponse.json(forecast, { status: 201 })
  } catch (error) {
    console.error('Error creating sales forecast:', error)
    return NextResponse.json({ error: 'Failed to create sales forecast' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const beforeDate = searchParams.get('beforeDate')

    if (!beforeDate) {
      return NextResponse.json({ error: 'beforeDate is required for cleanup' }, { status: 400 })
    }

    await db.salesForecast.deleteMany({
      where: {
        forecastDate: {
          lt: new Date(beforeDate)
        }
      }
    })

    return NextResponse.json({ success: true, message: 'Old forecasts deleted' })
  } catch (error) {
    console.error('Error deleting sales forecasts:', error)
    return NextResponse.json({ error: 'Failed to delete sales forecasts' }, { status: 500 })
  }
}
