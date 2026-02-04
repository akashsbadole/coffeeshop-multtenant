import { NextRequest, NextResponse } from 'next/server'
import { generateUPIQRCode, isValidUPIId, parseUPIId } from '@/lib/upi-qr'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { upiId, payeeName, amount, transactionNote, orderId, transactionRef } = body

    if (!upiId) {
      return NextResponse.json(
        { error: 'UPI ID is required' },
        { status: 400 }
      )
    }

    const parsedUpiId = parseUPIId(upiId)

    if (!isValidUPIId(parsedUpiId)) {
      return NextResponse.json(
        { error: 'Invalid UPI ID format' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    const qrCodeDataUrl = await generateUPIQRCode(
      parsedUpiId,
      payeeName || 'Coffee Shop',
      amount,
      transactionNote || `Order Payment`,
      transactionRef || orderId || `TXN_${Date.now()}`
    )

    const upiSchema = `upi://pay?pa=${encodeURIComponent(parsedUpiId)}&pn=${encodeURIComponent(payeeName || 'Coffee Shop')}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote || 'Order Payment')}`

    return NextResponse.json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl,
        upiId: parsedUpiId,
        payeeName: payeeName || 'Coffee Shop',
        amount,
        transactionNote: transactionNote || 'Order Payment',
        upiSchema,
        transactionRef: transactionRef || `TXN_${Date.now()}`
      }
    })
  } catch (error) {
    console.error('UPI QR generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate UPI QR code' },
      { status: 500 }
    )
  }
}
