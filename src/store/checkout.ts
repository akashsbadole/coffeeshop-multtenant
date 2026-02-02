import { create } from 'zustand'
import type { PaymentMethod, CartItem } from './types'

interface CheckoutState {
  // State
  checkoutOpen: boolean
  paymentMethod: PaymentMethod
  customerPhone: string
  customerName: string
  notes: string
  processing: boolean

  // Actions
  setCheckoutOpen: (open: boolean) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setCustomerPhone: (phone: string) => void
  setCustomerName: (name: string) => void
  setNotes: (notes: string) => void
  setProcessing: (processing: boolean) => void

  // Async actions
  processCheckout: (cart: CartItem[], subtotal: number, totalGst: number, total: number) => Promise<void>
  resetCheckout: () => void
}

export const useCheckoutStore = create<CheckoutState>()((set, get) => ({
  // Initial state
  checkoutOpen: false,
  paymentMethod: 'CASH',
  customerPhone: '',
  customerName: '',
  notes: '',
  processing: false,

  // Setters
  setCheckoutOpen: (open) => set({ checkoutOpen: open }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCustomerPhone: (phone) => set({ customerPhone: phone }),
  setCustomerName: (name) => set({ customerName: name }),
  setNotes: (notes) => set({ notes }),
  setProcessing: (processing) => set({ processing }),

  // Async actions
  processCheckout: async (cart, subtotal, totalGst, total) => {
    const { paymentMethod, customerPhone, customerName, notes } = get()
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
          notes,
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

  resetCheckout: () => {
    set({
      checkoutOpen: false,
      paymentMethod: 'CASH',
      customerPhone: '',
      customerName: '',
      notes: '',
      processing: false,
    })
  },
}))
