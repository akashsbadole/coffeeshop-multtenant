import { db } from '@/lib/db'
import crypto from 'crypto'

export interface PaymentRequest {
  orderId: string
  amount: number
  provider: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  description?: string
}

export interface PaymentResponse {
  success: boolean
  transactionId?: string
  paymentUrl?: string
  error?: string
}

export interface PaymentGatewayConfig {
  provider: string
  apiKeyId: string
  apiKeySecret: string
  isTestMode: boolean
}

export class PaymentGatewayService {
  private config: PaymentGatewayConfig | null = null

  async getConfig(organizationId: string, provider: string): Promise<PaymentGatewayConfig | null> {
    try {
      const apiKey = await db.paymentApiKey.findFirst({
        where: {
          organizationId,
          provider: provider.toLowerCase(),
          isActive: true
        }
      })

      if (!apiKey) {
        return null
      }

      return {
        provider: apiKey.provider,
        apiKeyId: apiKey.apiKeyId,
        apiKeySecret: apiKey.apiKeySecret,
        isTestMode: apiKey.isTestMode
      }
    } catch (error) {
      console.error('Error fetching payment config:', error)
      return null
    }
  }

  async createPayment(
    organizationId: string,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    const config = await this.getConfig(organizationId, request.provider)

    if (!config) {
      return {
        success: false,
        error: `No active payment configuration found for provider: ${request.provider}`
      }
    }

    switch (request.provider.toLowerCase()) {
      case 'razorpay':
        return this.createRazorpayPayment(config, request)
      case 'stripe':
        return this.createStripePayment(config, request)
      case 'paytm':
        return this.createPaytmPayment(config, request)
      case 'cashfree':
        return this.createCashfreePayment(config, request)
      default:
        return {
          success: false,
          error: `Unsupported payment provider: ${request.provider}`
        }
    }
  }

  private async createRazorpayPayment(
    config: PaymentGatewayConfig,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const razorpayEndpoint = config.isTestMode
        ? 'https://api.razorpay.com/v1/orders'
        : 'https://api.razorpay.com/v1/orders'

      const auth = Buffer.from(`${config.apiKeyId}:${config.apiKeySecret}`).toString('base64')

      const response = await fetch(razorpayEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          amount: Math.round(request.amount * 100),
          currency: 'INR',
          receipt: `order_${request.orderId}_${Date.now()}`,
          notes: {
            orderId: request.orderId,
            description: request.description || 'Coffee Shop POS Order'
          },
          customer: {
            name: request.customerName,
            email: request.customerEmail,
            contact: request.customerPhone
          }
        })
      })

      const data = await response.json()

      if (data.error) {
        return {
          success: false,
          error: data.error.description || 'Razorpay payment creation failed'
        }
      }

      return {
        success: true,
        transactionId: data.id,
        paymentUrl: `https://checkout.razorpay.com/v1/checkout.js`
      }
    } catch (error) {
      console.error('Razorpay payment error:', error)
      return {
        success: false,
        error: 'Failed to create Razorpay payment'
      }
    }
  }

  private async createStripePayment(
    config: PaymentGatewayConfig,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const stripeEndpoint = 'https://api.stripe.com/v1/payment_intents'
      const auth = Buffer.from(`${config.apiKeyId}:${config.apiKeySecret}`).toString('base64')

      const response = await fetch(stripeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        },
        body: new URLSearchParams({
          amount: Math.round(request.amount * 100).toString(),
          currency: 'inr',
          receipt_email: request.customerEmail || '',
          description: request.description || 'Coffee Shop POS Order',
          'metadata[orderId]': request.orderId
        }).toString()
      })

      const data = await response.json()

      if (data.error) {
        return {
          success: false,
          error: data.error.message || 'Stripe payment creation failed'
        }
      }

      return {
        success: true,
        transactionId: data.id,
        paymentUrl: `https://js.stripe.com/v3/`
      }
    } catch (error) {
      console.error('Stripe payment error:', error)
      return {
        success: false,
        error: 'Failed to create Stripe payment'
      }
    }
  }

  private async createPaytmPayment(
    config: PaymentGatewayConfig,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const mid = config.apiKeyId
      const key = config.apiKeySecret
      const orderId = `ORDER_${request.orderId}_${Date.now()}`

      const body = {
        mid,
        orderId,
        txnAmount: {
          value: request.amount.toString(),
          currency: 'INR'
        },
        userInfo: {
          custId: request.customerEmail || `cust_${request.orderId}`
        },
        callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/payments/webhook/paytm`
      }

      const checksum = this.generatePaytmChecksum(body, key)

      return {
        success: true,
        transactionId: orderId,
        paymentUrl: 'https://securegw.paytm.in/order/process'
      }
    } catch (error) {
      console.error('Paytm payment error:', error)
      return {
        success: false,
        error: 'Failed to create Paytm payment'
      }
    }
  }

  private async createCashfreePayment(
    config: PaymentGatewayConfig,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const endpoint = config.isTestMode
        ? 'https://test.cashfree.com/api/v1/order/create'
        : 'https://api.cashfree.com/api/v1/order/create'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': config.apiKeyId,
          'x-client-secret': config.apiKeySecret
        },
        body: JSON.stringify({
          order_id: `order_${request.orderId}_${Date.now()}`,
          order_amount: request.amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: request.customerEmail || `cust_${request.orderId}`,
            customer_name: request.customerName,
            customer_email: request.customerEmail,
            customer_phone: request.customerPhone
          },
          order_note: request.description || 'Coffee Shop POS Order'
        })
      })

      const data = await response.json()

      if (data.error) {
        return {
          success: false,
          error: data.error.message || 'Cashfree payment creation failed'
        }
      }

      return {
        success: true,
        transactionId: data.payment_session_id,
        paymentUrl: `https://checkout.cashfree.com/payment/${data.payment_session_id}`
      }
    } catch (error) {
      console.error('Cashfree payment error:', error)
      return {
        success: false,
        error: 'Failed to create Cashfree payment'
      }
    }
  }

  private generatePaytmChecksum(body: any, key: string): string {
    const sortedBody = this.sortObject(body)
    const concatenatedString = Object.keys(sortedBody)
      .map(key => `${key}=${sortedBody[key]}`)
      .join('&')

    const hash = crypto
      .createHmac('sha256', key)
      .update(concatenatedString)
      .digest('hex')

    return hash
  }

  private sortObject(obj: any): any {
    const sorted: any = {}
    const keys = Object.keys(obj).sort()
    for (const key of keys) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sorted[key] = this.sortObject(obj[key])
      } else {
        sorted[key] = obj[key]
      }
    }
    return sorted
  }

  async verifyPayment(
    organizationId: string,
    provider: string,
    transactionId: string,
    amount: number
  ): Promise<{ verified: boolean; error?: string }> {
    const config = await this.getConfig(organizationId, provider)

    if (!config) {
      return { verified: false, error: 'Payment configuration not found' }
    }

    switch (provider.toLowerCase()) {
      case 'razorpay':
        return this.verifyRazorpayPayment(config, transactionId, amount)
      default:
        return { verified: true }
    }
  }

  private async verifyRazorpayPayment(
    config: PaymentGatewayConfig,
    transactionId: string,
    amount: number
  ): Promise<{ verified: boolean; error?: string }> {
    try {
      const auth = Buffer.from(`${config.apiKeyId}:${config.apiKeySecret}`).toString('base64')

      const response = await fetch(
        `https://api.razorpay.com/v1/orders/${transactionId}`,
        {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        }
      )

      const data = await response.json()

      if (data.status === 'paid' || data.status === 'captured') {
        return { verified: true }
      }

      return { verified: false, error: `Payment status: ${data.status}` }
    } catch (error) {
      console.error('Razorpay verification error:', error)
      return { verified: false, error: 'Failed to verify payment' }
    }
  }

  async refundPayment(
    organizationId: string,
    provider: string,
    transactionId: string,
    amount: number,
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    const config = await this.getConfig(organizationId, provider)

    if (!config) {
      return { success: false, error: 'Payment configuration not found' }
    }

    switch (provider.toLowerCase()) {
      case 'razorpay':
        return this.razorpayRefund(config, transactionId, amount, reason)
      default:
        return { success: false, error: 'Refund not supported for this provider' }
    }
  }

  private async razorpayRefund(
    config: PaymentGatewayConfig,
    transactionId: string,
    amount: number,
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const auth = Buffer.from(`${config.apiKeyId}:${config.apiKeySecret}`).toString('base64')

      const response = await fetch('https://api.razorpay.com/v1/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          payment_id: transactionId,
          amount: Math.round(amount * 100),
          currency: 'INR',
          notes: {
            reason: reason || 'Customer refund'
          }
        })
      })

      const data = await response.json()

      if (data.error) {
        return {
          success: false,
          error: data.error.description || 'Refund failed'
        }
      }

      return {
        success: true,
        refundId: data.id
      }
    } catch (error) {
      console.error('Razorpay refund error:', error)
      return {
        success: false,
        error: 'Failed to process refund'
      }
    }
  }
}

export const paymentGateway = new PaymentGatewayService()
