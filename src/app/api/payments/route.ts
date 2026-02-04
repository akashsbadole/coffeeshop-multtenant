import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContextFromEmail } from '@/lib/tenant'
import crypto from 'crypto'

async function getOrganizationId(request: NextRequest): Promise<string | null> {
  const email = request.headers.get('x-user-email')
  if (!email) {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Basic ')) {
      try {
        const tokenEmail = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf8')
        if (tokenEmail) {
          const tenant = await getTenantContextFromEmail(tokenEmail)
          return tenant?.organizationId || null
        }
      } catch (e) {
        return null
      }
    }
    return null
  }
  const tenant = await getTenantContextFromEmail(email)
  return tenant?.organizationId || null
}

export async function GET(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const action = searchParams.get('action')

    if (action === 'providers') {
      const providers = await db.paymentApiKey.findMany({
        where: {
          organizationId,
          isActive: true
        },
        select: {
          provider: true,
          isTestMode: true,
          apiKeyId: true
        }
      })

      return NextResponse.json({
        providers: providers.map(p => ({
          id: p.provider,
          name: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
          mode: p.isTestMode ? 'test' : 'live',
          keyPrefix: p.apiKeyId.substring(0, 10) + '...'
        }))
      })
    }

    if (orderId) {
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          items: { include: { menuItem: true } }
        }
      })

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      const payments = await db.payment.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        order: { id: order.id, orderNumber: order.orderNumber, amount: order.totalAmount },
        payments
      })
    }

    const payments = await db.payment.findMany({
      where: { order: { organizationId } },
      include: { order: { select: { orderNumber: true, totalAmount: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = await getOrganizationId(request)
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, method, customerName, customerEmail, customerPhone, action } = body

    if (action === 'initialize') {
      if (!orderId || !method) {
        return NextResponse.json({ error: 'Order ID and payment method are required' }, { status: 400 })
      }

      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      })

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      const apiKey = await db.paymentApiKey.findFirst({
        where: { organizationId, provider: method.toLowerCase(), isActive: true }
      })

      if (!apiKey) {
        return NextResponse.json(
          { error: `Payment method '${method}' is not configured. Please add API keys in Settings > Payment Keys.` },
          { status: 400 }
        )
      }

      const organization = await db.organization.findUnique({ where: { id: organizationId } })
      const businessName = organization?.name || 'Coffee Shop'

      let paymentData: any = {
        provider: method,
        amount: order.totalAmount,
        currency: 'INR',
        orderId: order.orderNumber,
        testMode: apiKey.isTestMode
      }

      switch (method.toLowerCase()) {
        case 'razorpay':
          const razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`
          paymentData = {
            ...paymentData,
            key: apiKey.apiKeyId,
            razorpayOrderId,
            name: businessName,
            description: `Order #${order.orderNumber}`,
            prefill: {
              name: customerName || order.customer?.name || '',
              email: customerEmail || order.customer?.email || '',
              contact: customerPhone || order.customer?.phone || ''
            }
          }
          break

        case 'stripe':
          paymentData = {
            ...paymentData,
            key: apiKey.apiKeyId,
            name: businessName,
            description: `Order #${order.orderNumber}`,
            email: customerEmail || order.customer?.email || ''
          }
          break

        case 'paytm':
          paymentData = {
            ...paymentData,
            mid: apiKey.apiKeyId,
            orderId: `POS_${order.id}_${Date.now()}`
          }
          break

        case 'cashfree':
          paymentData = {
            ...paymentData,
            clientId: apiKey.apiKeyId,
            orderId: `order_${order.id}_${Date.now()}`
          }
          break

        default:
          return NextResponse.json({ error: `Unsupported payment method: ${method}` }, { status: 400 })
      }

      const payment = await db.payment.create({
        data: {
          orderId: order.id,
          method: method.toUpperCase() as any,
          amount: order.totalAmount,
          status: 'PENDING',
          transactionId: paymentData.razorpayOrderId || paymentData.orderId || `TXN_${Date.now()}`,
          notes: JSON.stringify({ provider: method, testMode: apiKey.isTestMode })
        }
      })

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        paymentData,
        testMode: apiKey.isTestMode
      })
    }

    if (action === 'verify') {
      const { paymentId, signature, orderId: razorpayOrderId } = body

      if (!paymentId) {
        return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
      }

      const payment = await db.payment.findUnique({ where: { id: paymentId } })

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      const apiKey = await db.paymentApiKey.findFirst({
        where: { organizationId, provider: payment.method.toLowerCase(), isActive: true }
      })

      let isValid = false

      if (payment.method.toLowerCase() === 'razorpay' && apiKey) {
        if (signature && razorpayOrderId) {
          const generatedSignature = crypto
            .createHmac('sha256', apiKey.apiKeySecret)
            .update(razorpayOrderId + '|' + paymentId)
            .digest('hex')
          isValid = generatedSignature === signature
        } else {
          isValid = true
        }
      } else {
        isValid = true
      }

      if (isValid) {
        await db.payment.update({ where: { id: payment.id }, data: { status: 'COMPLETED' } })
        await db.order.update({ where: { id: payment.orderId }, data: { status: 'COMPLETED' } })
        return NextResponse.json({ success: true, verified: true, message: 'Payment verified successfully' })
      }

      return NextResponse.json({ success: false, verified: false, message: 'Payment verification failed' })
    }

    if (action === 'refund') {
      const { paymentId, reason } = body

      if (!paymentId) {
        return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
      }

      const payment = await db.payment.findUnique({ where: { id: paymentId } })

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      await db.payment.update({ where: { id: payment.id }, data: { status: 'REFUNDED' } })

      return NextResponse.json({ success: true, message: 'Refund processed successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
  }
}
