import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, orderId: orderParam } = body

    // If orderId is passed, fetch the order details
    let orderDetails
    if (orderId || orderParam) {
      const id = orderId || orderParam
      const orderResponse = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/pos/orders?limit=100`
      )
      if (orderResponse.ok) {
        const orders = await orderResponse.json()
        orderDetails = orders.find((o: any) => o.id === id || o.orderNumber === id)
      }
    }

    // Generate receipt HTML
    const receiptHTML = generateReceiptHTML(body, orderDetails)

    return NextResponse.json({
      success: true,
      receiptHTML,
      orderDetails: orderDetails || body
    })
  } catch (error) {
    console.error('Receipt generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    )
  }
}

function generateReceiptHTML(orderData: any, fetchedOrder?: any): string {
  const order = fetchedOrder || orderData

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const items = order.items || []

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${order.orderNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      max-width: 80mm;
      margin: 0 auto;
      padding: 10px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 1px dashed #333;
      padding-bottom: 10px;
    }
    .header h1 {
      font-size: 18px;
      margin-bottom: 5px;
      font-weight: bold;
    }
    .header p {
      font-size: 10px;
      color: #666;
    }
    .order-info {
      margin-bottom: 15px;
      border-bottom: 1px dashed #333;
      padding-bottom: 10px;
    }
    .order-info div {
      margin-bottom: 3px;
    }
    .items {
      margin-bottom: 15px;
      border-bottom: 1px dashed #333;
      padding-bottom: 10px;
    }
    .item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .item-name {
      flex: 1;
    }
    .item-qty {
      text-align: center;
      min-width: 30px;
    }
    .item-price {
      text-align: right;
      min-width: 60px;
    }
    .summary {
      margin-bottom: 15px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .summary-row.total {
      font-weight: bold;
      font-size: 14px;
      border-top: 1px solid #333;
      padding-top: 5px;
      margin-top: 5px;
    }
    .gst-info {
      font-size: 10px;
      color: #666;
      margin-bottom: 15px;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #666;
      margin-top: 10px;
    }
    .barcode {
      text-align: center;
      margin: 10px 0;
      font-family: monospace;
      font-size: 20px;
      letter-spacing: 2px;
    }
    .thank-you {
      text-align: center;
      font-weight: bold;
      margin: 10px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>☕ Coffee Shop POS</h1>
    <p>India GST Compliant</p>
    <p>+91 98765 43210</p>
  </div>

  <div class="order-info">
    <div><strong>Order #:</strong> ${order.orderNumber || 'N/A'}</div>
    <div><strong>Date:</strong> ${formatDate(order.createdAt || new Date().toISOString())}</div>
    ${order.customerName ? `<div><strong>Customer:</strong> ${order.customerName}</div>` : ''}
    ${order.customerPhone ? `<div><strong>Phone:</strong> ${order.customerPhone}</div>` : ''}
    <div><strong>Payment:</strong> ${order.paymentMethod || 'CASH'}</div>
  </div>

  <div class="items">
    <div class="item" style="font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 5px;">
      <span class="item-name">Item</span>
      <span class="item-qty">Qty</span>
      <span class="item-price">Amount</span>
    </div>
    ${items.map((item: any) => `
      <div class="item">
        <span class="item-name">${item.menuItem?.name || item.name}</span>
        <span class="item-qty">${item.quantity}</span>
        <span class="item-price">₹${(item.subtotal || item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('')}
  </div>

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

  ${order.orderNumber ? `
    <div class="barcode">
      ${order.orderNumber}
    </div>
  ` : ''}

  <div class="thank-you">
    Thank You! Visit Again!
  </div>

  <div class="footer">
    <p>This is a computer-generated receipt</p>
    <p>No signature required</p>
    ${order.notes ? `<p><strong>Note:</strong> ${order.notes}</p>` : ''}
  </div>
</body>
</html>
  `.trim()
}
