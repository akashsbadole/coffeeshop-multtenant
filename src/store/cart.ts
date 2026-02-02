import { create } from 'zustand'
import type { CartItem, MenuItem } from './types'

interface CartState {
  // State
  cart: CartItem[]

  // Actions
  setCart: (cart: CartItem[]) => void
  addToCart: (menuItem: MenuItem) => void
  updateQuantity: (itemId: string, newQuantity: number) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void

  // Helper
  getGstPercentage: (gstRate: string) => number

  // Computed
  subtotal: number
  totalGst: number
  total: number
  itemCount: number
}

// GST Rate mapper - Convert enum strings to percentage values
const getGstPercentage = (gstRate: string): number => {
  const gstMap: Record<string, number> = {
    'ZERO': 0,
    'FIVE': 5,
    'TWELVE': 12,
    'EIGHTEEN': 18,
    'TWENTY_EIGHT': 28
  }
  return gstMap[gstRate] || 0
}

export const useCartStore = create<CartState>()((set, get) => ({
  // Initial state
  cart: [],

  // Computed values (calculated on access)
  get subtotal() {
    return get().cart.reduce((sum, item) => sum + item.subtotal, 0)
  },

  get totalGst() {
    return get().cart.reduce((sum, item) => sum + item.gstAmount, 0)
  },

  get total() {
    return get().subtotal + get().totalGst
  },

  get itemCount() {
    return get().cart.reduce((sum, item) => sum + item.quantity, 0)
  },

  // Setters
  setCart: (cart) => set({ cart }),

  // Actions
  addToCart: (menuItem) => {
    const { cart } = get()
    const existingItem = cart.find(item => item.menuItem.id === menuItem.id)

    if (existingItem) {
      get().updateQuantity(menuItem.id, existingItem.quantity + 1)
    } else {
      const gstPercentage = getGstPercentage(menuItem.gstRate)
      const gstAmount = menuItem.price * (gstPercentage / 100)
      const newItem: CartItem = {
        menuItem,
        quantity: 1,
        subtotal: menuItem.price,
        gstAmount: gstAmount
      }
      set({ cart: [...cart, newItem] })
    }
  },

  updateQuantity: (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      get().removeFromCart(itemId)
      return
    }

    set({
      cart: get().cart.map(item => {
        if (item.menuItem.id === itemId) {
          const gstPercentage = getGstPercentage(item.menuItem.gstRate)
          const gstAmount = item.menuItem.price * newQuantity * (gstPercentage / 100)
          const subtotal = item.menuItem.price * newQuantity
          return {
            ...item,
            quantity: newQuantity,
            subtotal,
            gstAmount
          }
        }
        return item
      })
    })
  },

  removeFromCart: (itemId) => {
    set({ cart: get().cart.filter(item => item.menuItem.id !== itemId) })
  },

  clearCart: () => {
    set({ cart: [] })
  },

  // Helper function
  getGstPercentage,
}))
