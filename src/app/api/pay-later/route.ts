import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const dueStatus = z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WRITE_OFF'])
const duePriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

// Create due amount from order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'create') {
      const createSchema = z.object({
        customerId: z.string().optional(),
        customerName: z.string().min(2),
        customerPhone: z.string().min(10),
        orderId: z.string().optional(),
        orderNumber: z.string(),
        originalAmount: z.number().min(0),
        dueDate: z.string(),
        notes: z.string().optional(),
        priority: duePriority.optional().default('MEDIUM')
      })

      const validated = createSchema.parse(body)

      // Check if customer exists, create if not
      let customerId = validated.customerId
      if (!customerId && validated.customerPhone) {
        const existingCustomer = await db.customer.findFirst({
          where: { phone: validated.customerPhone }
        })
        if (existingCustomer) {
          customerId = existingCustomer.id
        } else {
          const newCustomer = await db.customer.create({
            data: {
              name: validated.customerName,
              phone: validated.customerPhone
            }
          })
          customerId = newCustomer.id
        }
      }

      const dueAmount = await db.payLater.create({
        data: {
          customerId: customerId || '',
          customerName: validated.customerName,
          customerPhone: validated.customerPhone,
          orderId: validated.orderId || '',
          orderNumber: validated.orderNumber,
          originalAmount: validated.originalAmount,
          paidAmount: 0,
          dueAmount: validated.originalAmount,
          status: 'PENDING',
          priority: validated.priority,
          dueDate: new Date(validated.dueDate),
          notes: validated.notes,
          partialPayments: [],
          createdAt: new Date()
        }
      })

      return NextResponse.json({ dueAmount, success: true }, { status: 201 })
    }

    if (action === 'payment') {
      const paymentSchema = z.object({
        dueId: z.string(),
        amount: z.number().min(1),
        paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'NET_BANKING', 'WALLET']),
        paidBy: z.string().optional(),
        notes: z.string().optional()
      })

      const validated = paymentSchema.parse(body)

      const dueAmount = await db.payLater.findUnique({
        where: { id: validated.dueId }
      })

      if (!dueAmount) {
        return NextResponse.json({ error: 'Due amount not found' }, { status: 404 })
      }

      const newPayment = {
        id: Date.now().toString(),
        amount: validated.amount,
        paymentMethod: validated.paymentMethod,
        paidAt: new Date().toISOString(),
        paidBy: validated.paidBy || 'System',
        notes: validated.notes
      }

      const updatedPaidAmount = dueAmount.paidAmount + validated.amount
      const updatedDueAmount = dueAmount.dueAmount - validated.amount
      let newStatus: string = dueAmount.status

      if (updatedDueAmount <= 0) {
        newStatus = 'PAID'
      } else if (updatedPaidAmount > 0) {
        newStatus = 'PARTIAL'
      }

      const updatedDue = await db.payLater.update({
        where: { id: validated.dueId },
        data: {
          paidAmount: updatedPaidAmount,
          dueAmount: Math.max(0, updatedDueAmount),
          status: newStatus,
          partialPayments: [...(dueAmount.partialPayments as any[] || []), newPayment],
          paidAt: newStatus === 'PAID' ? new Date() : null
        }
      })

      return NextResponse.json({ dueAmount: updatedDue, success: true })
    }

    if (action === 'write-off') {
      const writeOffSchema = z.object({
        dueId: z.string(),
        reason: z.string().min(5)
      })

      const validated = writeOffSchema.parse(body)

      const dueAmount = await db.payLater.findUnique({
        where: { id: validated.dueId }
      })

      if (!dueAmount) {
        return NextResponse.json({ error: 'Due amount not found' }, { status: 404 })
      }

      const updatedDue = await db.payLater.update({
        where: { id: validated.dueId },
        data: {
          status: 'WRITE_OFF',
          writeOffReason: validated.reason,
          writtenOffAt: new Date()
        }
      })

      return NextResponse.json({ dueAmount: updatedDue, success: true })
    }

    if (action === 'reminder') {
      const reminderSchema = z.object({
        dueId: z.string()
      })

      const validated = reminderSchema.parse(body)

      const dueAmount = await db.payLater.findUnique({
        where: { id: validated.dueId },
        include: { customer: true }
      })

      if (!dueAmount) {
        return NextResponse.json({ error: 'Due amount not found' }, { status: 404 })
      }

      // Simulate sending reminder (SMS/Email)
      console.log(`Reminder sent to ${dueAmount.customerPhone} for amount: ₹${dueAmount.dueAmount}`)

      return NextResponse.json({ success: true, message: 'Reminder sent successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error('Pay Later error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// Get due amounts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const dueAmounts = await db.payLater.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await db.payLater.count({ where })

    // Check for overdue amounts
    const overdueCount = await db.payLater.count({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: new Date() }
      }
    })

    // Calculate stats
    const allDueAmounts = await db.payLater.findMany()
    const totalDueAmount = allDueAmounts.reduce((sum, due) => sum + due.dueAmount, 0)
    const totalPaidAmount = allDueAmounts.reduce((sum, due) => sum + due.paidAmount, 0)

    return NextResponse.json({
      dueAmounts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalDueAmount,
        totalPaidAmount,
        pendingAmount: totalDueAmount - totalPaidAmount,
        overdueCount,
        totalCustomers: new Set(allDueAmounts.map(due => due.customerId)).size
      }
    })
  } catch (error) {
    console.error('Get pay later error:', error)
    return NextResponse.json({ error: 'Failed to fetch due amounts' }, { status: 500 })
  }
}