import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const anomalyType = searchParams.get('anomalyType')
    const severity = searchParams.get('severity')
    const isResolved = searchParams.get('isResolved')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (anomalyType) {
      where.anomalyType = anomalyType
    }
    
    if (severity) {
      where.severity = severity
    }
    
    if (isResolved !== null) {
      where.isResolved = isResolved === 'true'
    }
    
    if (startDate || endDate) {
      where.detectedDate = {}
      if (startDate) {
        where.detectedDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.detectedDate.lte = new Date(endDate)
      }
    }

    const anomalies = await db.revenueAnomaly.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { detectedDate: 'desc' }
      ],
      take: limit
    })

    return NextResponse.json(anomalies)
  } catch (error) {
    console.error('Error fetching revenue anomalies:', error)
    return NextResponse.json({ error: 'Failed to fetch revenue anomalies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      anomalyType,
      severity,
      detectedDate,
      metric,
      actualValue,
      expectedValue,
      threshold,
      description,
      metadata
    } = body

    if (!anomalyType || !severity || !metric || !actualValue || !expectedValue) {
      return NextResponse.json({ 
        error: 'anomalyType, severity, metric, actualValue, and expectedValue are required' 
      }, { status: 400 })
    }

    const deviation = ((actualValue - expectedValue) / expectedValue) * 100

    const anomaly = await db.revenueAnomaly.create({
      data: {
        anomalyType,
        severity,
        detectedDate: detectedDate ? new Date(detectedDate) : new Date(),
        metric,
        actualValue,
        expectedValue,
        deviation,
        threshold,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    })

    return NextResponse.json(anomaly, { status: 201 })
  } catch (error) {
    console.error('Error creating revenue anomaly:', error)
    return NextResponse.json({ error: 'Failed to create revenue anomaly' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isResolved, resolvedAt, resolvedBy, resolutionNotes } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const data: any = {}
    
    if (isResolved !== undefined) {
      data.isResolved = isResolved
      
      if (isResolved) {
        data.resolvedAt = resolvedAt ? new Date(resolvedAt) : new Date()
      }
    }
    
    if (resolvedBy) {
      data.resolvedBy = resolvedBy
    }
    
    if (resolutionNotes !== undefined) {
      data.resolutionNotes = resolutionNotes
    }

    const anomaly = await db.revenueAnomaly.update({
      where: { id },
      data
    })

    return NextResponse.json(anomaly)
  } catch (error) {
    console.error('Error updating revenue anomaly:', error)
    return NextResponse.json({ error: 'Failed to update revenue anomaly' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resolved = searchParams.get('resolved')
    const beforeDate = searchParams.get('beforeDate')

    if (resolved === 'true' && beforeDate) {
      await db.revenueAnomaly.deleteMany({
        where: {
          isResolved: true,
          updatedAt: {
            lt: new Date(beforeDate)
          }
        }
      })
      return NextResponse.json({ success: true, message: 'Resolved anomalies deleted' })
    }

    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.revenueAnomaly.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting revenue anomaly:', error)
    return NextResponse.json({ error: 'Failed to delete revenue anomaly' }, { status: 500 })
  }
}
