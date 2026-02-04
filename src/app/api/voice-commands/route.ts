import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (userId) {
      where.userId = userId
    }
    
    if (status) {
      where.status = status
    }

    const commands = await db.voiceCommand.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json(commands)
  } catch (error) {
    console.error('Error fetching voice commands:', error)
    return NextResponse.json({ error: 'Failed to fetch voice commands' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      userId,
      commandText,
      intent,
      parameters,
      response,
      status = 'RECOGNIZED',
      confidence,
      duration
    } = body

    if (!userId || !commandText) {
      return NextResponse.json({ error: 'userId and commandText are required' }, { status: 400 })
    }

    const command = await db.voiceCommand.create({
      data: {
        userId,
        commandText,
        intent,
        parameters: parameters ? JSON.stringify(parameters) : null,
        response,
        status,
        confidence,
        duration
      }
    })

    return NextResponse.json(command, { status: 201 })
  } catch (error) {
    console.error('Error creating voice command:', error)
    return NextResponse.json({ error: 'Failed to create voice command' }, { status: 500 })
  }
}
