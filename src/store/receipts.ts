import { create } from 'zustand'
import type { Order, ReceiptData } from './types'

interface ReceiptsState {
  // State
  receiptDialogOpen: boolean
  selectedOrderForReceipt: Order | null
  sendWhatsAppDialogOpen: boolean
  sendEmailDialogOpen: boolean
  receiptPhone: string
  receiptEmail: string
  loading: boolean

  // Actions
  setReceiptDialogOpen: (open: boolean) => void
  setSelectedOrderForReceipt: (order: Order | null) => void
  setSendWhatsAppDialogOpen: (open: boolean) => void
  setSendEmailDialogOpen: (open: boolean) => void
  setReceiptPhone: (phone: string) => void
  setReceiptEmail: (email: string) => void
  setLoading: (loading: boolean) => void

  // Async actions
  generateReceipt: (orderId: string) => Promise<ReceiptData | null>
  sendWhatsApp: (orderId: string, phone: string) => Promise<void>
  sendEmail: (orderId: string, email: string) => Promise<void>
  printReceipt: (receiptData: ReceiptData) => void
}

export const useReceiptsStore = create<ReceiptsState>()((set, get) => ({
  // Initial state
  receiptDialogOpen: false,
  selectedOrderForReceipt: null,
  sendWhatsAppDialogOpen: false,
  sendEmailDialogOpen: false,
  receiptPhone: '',
  receiptEmail: '',
  loading: false,

  // Setters
  setReceiptDialogOpen: (open) => set({ receiptDialogOpen: open }),
  setSelectedOrderForReceipt: (order) => set({ selectedOrderForReceipt: order }),
  setSendWhatsAppDialogOpen: (open) => set({ sendWhatsAppDialogOpen: open }),
  setSendEmailDialogOpen: (open) => set({ sendEmailDialogOpen: open }),
  setReceiptPhone: (phone) => set({ receiptPhone: phone }),
  setReceiptEmail: (email) => set({ receiptEmail: email }),
  setLoading: (loading) => set({ loading }),

  // Async actions
  generateReceipt: async (orderId) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/receipts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) throw new Error('Failed to generate receipt')
      const data = await response.json()
      set({ loading: false })
      return data
    } catch (error) {
      console.error('Error generating receipt:', error)
      set({ loading: false })
      return null
    }
  },

  sendWhatsApp: async (orderId, phone) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/receipts/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, phone }),
      })

      if (!response.ok) throw new Error('Failed to send receipt via WhatsApp')
      set({ loading: false })
    } catch (error) {
      console.error('Error sending WhatsApp receipt:', error)
      set({ loading: false })
      throw error
    }
  },

  sendEmail: async (orderId, email) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/receipts/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, email }),
      })

      if (!response.ok) throw new Error('Failed to send receipt via email')
      set({ loading: false })
    } catch (error) {
      console.error('Error sending email receipt:', error)
      set({ loading: false })
      throw error
    }
  },

  printReceipt: (receiptData) => {
    // Create a printable receipt window
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body {
              font-family: monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .total {
              border-top: 1px dashed #000;
              margin-top: 10px;
              padding-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>RECEIPT</h2>
            <p>Order #${receiptData.orderNumber}</p>
            <p>${new Date(receiptData.createdAt).toLocaleString()}</p>
          </div>
          ${receiptData.items.map(item => `
            <div class="item">
              <span>${item.name} x${item.quantity}</span>
              <span>₹${item.subtotal.toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="total">
            <div class="item">
              <span>Subtotal:</span>
              <span>₹${receiptData.subtotal.toFixed(2)}</span>
            </div>
            <div class="item">
              <span>GST:</span>
              <span>₹${receiptData.gstAmount.toFixed(2)}</span>
            </div>
            <div class="item">
              <strong>Total:</strong>
              <strong>₹${receiptData.total.toFixed(2)}</strong>
            </div>
          </div>
          <div class="footer">
            <p>Payment: ${receiptData.paymentMethod}</p>
            <p>Thank you!</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(receiptHtml)
    printWindow.document.close()
    printWindow.print()
  },
}))
