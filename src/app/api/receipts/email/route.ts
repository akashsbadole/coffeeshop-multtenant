import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, email, orderData } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
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
    const order = receiptData.orderDetails
    const items = order.items || []

    // Create email content
    const subject = `🧾 Receipt - Order #${order.orderNumber} - Coffee Shop POS`

    const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0 0;
      opacity: 0.9;
    }
    .content {
      background: white;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 10px 10px;
    }
    .order-info {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .order-info div {
      margin: 5px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background: #f59e0b;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .summary {
      background: #fef3c7;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .summary-row.total {
      font-size: 18px;
      font-weight: bold;
      border-top: 2px solid #d97706;
      padding-top: 10px;
      margin-top: 15px;
      color: #92400e;
    }
    .gst-info {
      background: #dbeafe;
      padding: 15px;
      border-radius: 8px;
      font-size: 12px;
      color: #1e40af;
      margin-bottom: 20px;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .thank-you {
      text-align: center;
      font-size: 18px;
      color: #92400e;
      margin: 20px 0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>☕ Coffee Shop POS</h1>
    <p>India GST Compliant Receipt</p>
  </div>

  <div class="content">
    <div class="order-info">
      <div><strong>Order #:</strong> ${order.orderNumber}</div>
      <div><strong>Date:</strong> ${new Date(order.createdAt || new Date()).toLocaleString('en-IN')}</div>
      ${order.customerName ? `<div><strong>Customer:</strong> ${order.customerName}</div>` : ''}
      <div><strong>Payment Method:</strong> ${order.paymentMethod || 'CASH'}</div>
    </div>

    <table class="items-table">
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Amount</th>
      </tr>
      ${items.map((item: any) => `
        <tr>
          <td>${item.menuItem?.name || item.name}</td>
          <td>${item.quantity}</td>
          <td>₹${(item.menuItem?.price || item.price).toFixed(2)}</td>
          <td>₹${(item.subtotal || item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('')}
    </table>

    <div class="summary">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>₹${(order.subtotal || 0).toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>CGST:</span>
        <span>₹${(order.cgst || 0).toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>SGST:</span>
        <span>₹${(order.sgst || 0).toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Total GST:</span>
        <span>₹${(order.totalGst || 0).toFixed(2)}</span>
      </div>
      <div class="summary-row total">
        <span>TOTAL:</span>
        <span>₹${(order.total || order.totalAmount || 0).toFixed(2)}</span>
      </div>
    </div>

    <div class="gst-info">
      <p><strong>GST Information:</strong></p>
      <p>GSTIN: 22AAAAA0000A1Z5 (Demo)</p>
      <p>Tax Type: Intra-State (CGST + SGST)</p>
      <p>${items.length} item(s) taxed</p>
    </div>

    <div class="thank-you">
      ✅ Thank you for your order!
    </div>

    ${order.notes ? `
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <strong>Note:</strong> ${order.notes}
      </div>
    ` : ''}

    <div class="footer">
      <p>This is a computer-generated receipt. No signature required.</p>
      <p>For inquiries, contact us at +91 98765 43210</p>
      <p>Coffee Shop POS - Version 1.0.0</p>
    </div>
  </div>
</body>
</html>
    `.trim()

    // Create plain text version
    const plainText = `
COFFEE SHOP POS - RECEIPT
=========================
Order #${order.orderNumber}
Date: ${new Date(order.createdAt || new Date()).toLocaleString('en-IN')}
${order.customerName ? `Customer: ${order.customerName}` : ''}

ITEMS:
${items.map((item: any, index: number) =>
  `${index + 1}. ${item.menuItem?.name || item.name}
   Qty: ${item.quantity} × ₹${(item.menuItem?.price || item.price).toFixed(2)} = ₹${(item.subtotal || item.price * item.quantity).toFixed(2)}`
).join('\n\n')}

-------------------------
Subtotal: ₹${(order.subtotal || 0).toFixed(2)}
CGST: ₹${(order.cgst || 0).toFixed(2)}
SGST: ₹${(order.sgst || 0).toFixed(2)}
Total GST: ₹${(order.totalGst || 0).toFixed(2)}
-------------------------
TOTAL: ₹${(order.total || order.totalAmount || 0).toFixed(2)}
=========================

GSTIN: 22AAAAA0000A1Z5 (Demo)
Payment Method: ${order.paymentMethod || 'CASH'}

Thank you for your order!
    `.trim()

    // In a real implementation, you would use a service like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Resend
    // - Nodemailer with SMTP

    return NextResponse.json({
      success: true,
      message: 'Receipt email prepared',
      data: {
        to: email,
        subject,
        html: htmlEmail,
        plainText,
        note: 'In production, integrate with email service (SendGrid, AWS SES, etc.) for automatic sending',
        integration: 'Configure SMTP or email API credentials to send emails automatically'
      }
    })
  } catch (error) {
    console.error('Email receipt error:', error)
    return NextResponse.json(
      { error: 'Failed to send email receipt' },
      { status: 500 }
    )
  }
}
