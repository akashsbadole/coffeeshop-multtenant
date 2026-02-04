import { create } from 'zustand'
import type { PaymentMethod, CartItem } from './types'

interface CheckoutState {
  // State
  checkoutOpen: boolean
  paymentMethod: PaymentMethod
  customerPhone: string
  customerName: string
  customerEmail: string
  notes: string
  sendWhatsApp: boolean
  sendEmail: boolean
  upiId: string
  upiQrCode: string | null
  processing: boolean

  // Actions
  setCheckoutOpen: (open: boolean) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setCustomerPhone: (phone: string) => void
  setCustomerName: (name: string) => void
  setCustomerEmail: (email: string) => void
  setNotes: (notes: string) => void
  setSendWhatsApp: (send: boolean) => void
  setSendEmail: (send: boolean) => void
  setUpiId: (upiId: string) => void
  setUpiQrCode: (qrCode: string | null) => void
  setProcessing: (processing: boolean) => void

  // Async actions
  processCheckout: (cart: CartItem[], subtotal: number, totalGst: number, total: number) => Promise<void>
  generateUpiQrCode: (payeeName: string, amount: number, transactionNote: string, orderId?: string) => Promise<void>
  resetCheckout: () => void
}

export const useCheckoutStore = create<CheckoutState>()((set, get) => ({
  // Initial state
  checkoutOpen: false,
  paymentMethod: 'CASH',
  customerPhone: '',
  customerName: '',
  customerEmail: '',
  notes: '',
  sendWhatsApp: false,
  sendEmail: false,
  upiId: '',
  upiQrCode: null,
  processing: false,

  // Setters
  setCheckoutOpen: (open) => set({ checkoutOpen: open }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCustomerPhone: (phone) => set({ customerPhone: phone }),
  setCustomerName: (name) => set({ customerName: name }),
  setCustomerEmail: (email) => set({ customerEmail: email }),
  setNotes: (notes) => set({ notes }),
  setSendWhatsApp: (send) => set({ sendWhatsApp: send }),
  setSendEmail: (send) => set({ sendEmail: send }),
  setUpiId: (upiId) => set({ upiId }),
  setUpiQrCode: (qrCode) => set({ upiQrCode: qrCode }),
  setProcessing: (processing) => set({ processing: processing }),

  // Async actions
  processCheckout: async (cart, subtotal, totalGst, total) => {
    const { paymentMethod, customerPhone, customerName, customerEmail, notes, sendWhatsApp, sendEmail, upiId } = get()
    set({ processing: true })

    try {
      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            price: item.menuItem.price,
            gstRate: item.menuItem.gstRate,
            gstAmount: item.gstAmount,
            subtotal: item.subtotal,
          })),
          subtotal,
          totalGst,
          total,
          paymentMethod,
          customerPhone,
          customerName,
          customerEmail,
          notes,
          sendWhatsApp,
          sendEmail,
          upiId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to process checkout')
      }

      const data = await response.json()
      set({ processing: false })
      return data
    } catch (error) {
      set({ processing: false })
      throw error
    }
  },

  generateUpiQrCode: async (payeeName, amount, transactionNote, orderId) => {
    const { upiId } = get()

    if (!upiId) {
      return
    }

    try {
      const response = await fetch('/api/upi/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId,
          payeeName,
          amount,
          transactionNote,
          orderId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate UPI QR code')
      }

      const data = await response.json()
      set({ upiQrCode: data.data.qrCode })
    } catch (error) {
      console.error('Error generating UPI QR code:', error)
      set({ upiQrCode: null })
    }
  },

  resetCheckout: () => {
    set({
      checkoutOpen: false,
      paymentMethod: 'CASH',
      customerPhone: '',
      customerName: '',
      customerEmail: '',
      notes: '',
      sendWhatsApp: false,
      sendEmail: false,
      upiId: '',
      upiQrCode: null,
      processing: false,
    })
  },
}))
