import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const churnRisk = searchParams.get('churnRisk')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (customerId) {
      where.customerId = customerId
    }
    
    if (churnRisk) {
      where.churnRisk = churnRisk
    }

    const predictions = await db.customerChurnPrediction.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json(predictions)
  } catch (error) {
    console.error('Error fetching churn predictions:', error)
    return NextResponse.json({ error: 'Failed to fetch churn predictions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      churnRisk,
      churnProbability,
      lastPurchaseDate,
      predictedChurnDate,
      factors,
      recommendations
    } = body

    if (!customerId || !churnRisk) {
      return NextResponse.json({ error: 'customerId and churnRisk are required' }, { status: 400 })
    }

    const data: any = {
      customerId,
      churnRisk,
      churnProbability,
      factors: factors ? JSON.stringify(factors) : null,
      recommendations: recommendations ? JSON.stringify(recommendations) : null
    }

    if (lastPurchaseDate) {
      data.lastPurchaseDate = new Date(lastPurchaseDate)
    }

    if (predictedChurnDate) {
      data.predictedChurnDate = new Date(predictedChurnDate)
    }

    const prediction = await db.customerChurnPrediction.create({
      data
    })

    return NextResponse.json(prediction, { status: 201 })
  } catch (error) {
    console.error('Error creating churn prediction:', error)
    return NextResponse.json({ error: 'Failed to create churn prediction' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
    }

    const body = await request.json()
    const { hasChurned, actualChurnDate } = body

    const updateData: any = {}
    
    if (hasChurned !== undefined) {
      updateData.hasChurned = hasChurned
    }
    
    if (actualChurnDate) {
      updateData.actualChurnDate = new Date(actualChurnDate)
    }

    const prediction = await db.customerChurnPrediction.updateMany({
      where: { customerId },
      data: updateData
    })

    return NextResponse.json({ success: true, updated: prediction.count })
  } catch (error) {
    console.error('Error updating churn prediction:', error)
    return NextResponse.json({ error: 'Failed to update churn prediction' }, { status: 500 })
  }
}
