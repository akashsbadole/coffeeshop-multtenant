import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, phoneNumber, orderData } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Generate receipt first
    const receiptResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/receipts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, orderData })
    })

    if (!receiptResponse.ok) {
      throw new Error('Failed to generate receipt')
    }

    const receiptData = await receiptResponse.json()

    // Format phone number (remove spaces, add +91 if needed)
    let formattedPhone = phoneNumber.replace(/\s/g, '')
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone
    }

    // Create WhatsApp message
    const order = receiptData.orderDetails
    const items = order.items || []

    let message = `☕ *Coffee Shop POS*\n`
    message += `-----------------\n`
    message += `🧾 *Order #${order.orderNumber}*\n`
    message += `📅 ${new Date(order.createdAt || new Date()).toLocaleString('en-IN')}\n\n`

    message += `*Items:*\n`
    items.forEach((item: any, index: number) => {
      message += `${index + 1}. ${item.menuItem?.name || item.name}\n`
      message += `   Qty: ${item.quantity} × ₹${item.menuItem?.price || item.price} = ₹${(item.subtotal || item.price * item.quantity).toFixed(2)}\n`
    })

    message += `\n-----------------\n`
    message += `*Subtotal:* ₹${(order.subtotal || 0).toFixed(2)}\n`
    message += `*CGST:* ₹${(order.cgst || 0).toFixed(2)}\n`
    message += `*SGST:* ₹${(order.sgst || 0).toFixed(2)}\n`
    message += `*Total GST:* ₹${(order.totalGst || 0).toFixed(2)}\n`
    message += `-----------------\n`
    message += `💰 *TOTAL: ₹${(order.total || order.totalAmount || 0).toFixed(2)}*\n\n`

    message += `Payment Method: ${order.paymentMethod || 'CASH'}\n`
    if (order.customerName) message += `Customer: ${order.customerName}\n`

    message += `\n✅ *Thank you for your order!*`
    message += `\n\n_GSTIN: 22AAAAA0000A1Z5 (Demo)_`

    // In a real implementation, you would integrate with a WhatsApp Business API
    // For demo purposes, we'll return the message and WhatsApp link
    const encodedMessage = encodeURIComponent(message)
    const whatsappURL = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodedMessage}`

    // Here you would typically use:
    // - Twilio API for WhatsApp
    // - Meta WhatsApp Business API
    // - Third-party services like Gupshup, WATI, etc.

    return NextResponse.json({
      success: true,
      message: 'Receipt prepared for WhatsApp',
      data: {
        phoneNumber: formattedPhone,
        message,
        whatsappURL,
        note: 'Click the URL to send via WhatsApp (demo mode)',
        integration: 'In production, integrate with WhatsApp Business API for automatic sending'
      }
    })
  } catch (error) {
    console.error('WhatsApp receipt error:', error)
    return NextResponse.json(
      { error: 'Failed to send WhatsApp receipt' },
      { status: 500 }
    )
  }
}
