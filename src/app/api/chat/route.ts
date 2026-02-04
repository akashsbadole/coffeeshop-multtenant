import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TicketStatus, TicketPriority, MessageSender } from '@prisma/client'

// GET: Fetch chat history, tickets, or unread count
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const ticketId = searchParams.get('ticketId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch unread message count
    if (type === 'unread') {
      const unreadCount = await db.chatMessage.count({
        where: {
          ticket: {
            createdById: userId
          },
          senderType: MessageSender.AGENT,
          isRead: false
        }
      })

      return NextResponse.json({ unreadCount })
    }

    // Fetch specific ticket with messages
    if (ticketId) {
      const ticket = await db.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          assignedTo: {
            select: { id: true, name: true, email: true }
          },
          resolvedBy: {
            select: { id: true, name: true, email: true }
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      })

      if (!ticket) {
        return NextResponse.json(
          { error: 'Ticket not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(ticket)
    }

    // Fetch user's tickets
    const tickets = await db.supportTicket.findMany({
      where: {
        createdById: userId,
        ...(status && { status: status as TicketStatus })
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderType: MessageSender.AGENT
              }
            }
          }
        }
      }
    })

    const total = await db.supportTicket.count({
      where: {
        createdById: userId,
        ...(status && { status: status as TicketStatus })
      }
    })

    return NextResponse.json({
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat data' },
      { status: 500 }
    )
  }
}

// POST: Create new ticket or message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type } = body

    // Create new support ticket
    if (type === 'ticket') {
      const { subject, description, priority, createdById, orderId } = body

      if (!subject || !createdById) {
        return NextResponse.json(
          { error: 'Subject and createdById are required' },
          { status: 400 }
        )
      }

      const ticket = await db.supportTicket.create({
        data: {
          subject,
          description,
          priority: (priority as TicketPriority) || TicketPriority.MEDIUM,
          createdById,
          orderId,
          status: TicketStatus.OPEN
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      return NextResponse.json(ticket, { status: 201 })
    }

    // Create new message
    if (type === 'message') {
      const { ticketId, senderId, content, attachments, senderType } = body

      if (!ticketId || !senderId || !content) {
        return NextResponse.json(
          { error: 'Ticket ID, sender ID, and content are required' },
          { status: 400 }
        )
      }

      // Verify ticket exists
      const ticket = await db.supportTicket.findUnique({
        where: { id: ticketId }
      })

      if (!ticket) {
        return NextResponse.json(
          { error: 'Ticket not found' },
          { status: 404 }
        )
      }

      // Create message
      const message = await db.chatMessage.create({
        data: {
          ticketId,
          senderId,
          senderType: (senderType as MessageSender) || MessageSender.CUSTOMER,
          content,
          attachments: attachments ? JSON.stringify(attachments) : null
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true }
          },
          ticket: {
            select: { id: true, subject: true, status: true }
          }
        }
      })

      // Update ticket status to IN_PROGRESS if customer sends a new message and ticket is OPEN
      if (message.senderType === MessageSender.CUSTOMER && ticket.status === TicketStatus.OPEN) {
        await db.supportTicket.update({
          where: { id: ticketId },
          data: { 
            status: TicketStatus.IN_PROGRESS,
            updatedAt: new Date()
          }
        })
      }

      return NextResponse.json(message, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "ticket" or "message"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create chat data' },
      { status: 500 }
    )
  }
}

// PUT: Update ticket status, assign agent, mark messages as read
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // Update ticket status
    if (action === 'update-ticket') {
      const { ticketId, status, priority, assignedToId, resolvedById } = body

      if (!ticketId) {
        return NextResponse.json(
          { error: 'Ticket ID is required' },
          { status: 400 }
        )
      }

      const updateData: any = {
        updatedAt: new Date()
      }

      if (status) {
        updateData.status = status as TicketStatus
        if (status === TicketStatus.RESOLVED) {
          updateData.resolvedAt = new Date()
        }
        if (status === TicketStatus.CLOSED) {
          updateData.closedAt = new Date()
        }
      }

      if (priority) {
        updateData.priority = priority as TicketPriority
      }

      if (assignedToId !== undefined) {
        updateData.assignedToId = assignedToId
      }

      if (resolvedById) {
        updateData.resolvedById = resolvedById
      }

      const ticket = await db.supportTicket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true }
          },
          resolvedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      return NextResponse.json(ticket)
    }

    // Mark messages as read
    if (action === 'mark-read') {
      const { ticketId, userId, messageIds } = body

      if (!ticketId || !userId) {
        return NextResponse.json(
          { error: 'Ticket ID and user ID are required' },
          { status: 400 }
        )
      }

      const whereClause: any = {
        ticketId,
        isRead: false,
        senderType: {
          not: MessageSender.CUSTOMER
        }
      }

      if (messageIds && messageIds.length > 0) {
        whereClause.id = { in: messageIds }
      }

      await db.chatMessage.updateMany({
        where: whereClause,
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      return NextResponse.json({ success: true })
    }

    // Add agent response with quick response template
    if (action === 'agent-response') {
      const { ticketId, agentId, content, quickResponseId } = body

      if (!ticketId || !agentId || !content) {
        return NextResponse.json(
          { error: 'Ticket ID, agent ID, and content are required' },
          { status: 400 }
        )
      }

      // Create agent message
      const message = await db.chatMessage.create({
        data: {
          ticketId,
          senderId: agentId,
          senderType: MessageSender.AGENT,
          content
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Update quick response usage count
      if (quickResponseId) {
        await db.quickResponse.update({
          where: { id: quickResponseId },
          data: {
            usageCount: { increment: 1 }
          }
        })
      }

      return NextResponse.json(message)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Chat PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update chat data' },
      { status: 500 }
    )
  }
}