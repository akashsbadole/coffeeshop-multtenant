import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, MenuItem } from './types'

interface CartState {
  // State
  cart: CartItem[]

  // Actions
  setCart: (cart: CartItem[]) => void
  addToCart: (menuItem: MenuItem) => void
  addCustomAmount: (amount: number, description?: string) => void
  updateQuantity: (itemId: string, newQuantity: number) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void

  // Helper
  getGstPercentage: (gstRate: string) => number
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

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      cart: [],

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

      addCustomAmount: (amount, description = 'Custom Amount') => {
        const { cart } = get()
        const customItemId = 'custom-amount'
        const existingItem = cart.find(item => item.menuItem.id === customItemId)

        const customMenuItem: MenuItem = {
          id: customItemId,
          name: description,
          description: `Custom amount: ₹${amount.toFixed(2)}`,
          price: amount,
          gstRate: 'ZERO',
          hsnCode: null,
          categoryId: 'custom',
          isAvailable: true,
          category: { name: 'Custom' }
        }

        if (existingItem) {
          get().updateQuantity(customItemId, existingItem.quantity + 1)
        } else {
          const newItem: CartItem = {
            menuItem: customMenuItem,
            quantity: 1,
            subtotal: amount,
            gstAmount: 0
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
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
)

// Selector functions for computed values
export const selectSubtotal = (state: CartState) => 
  state.cart.reduce((sum, item) => sum + item.subtotal, 0)

export const selectTotalGst = (state: CartState) => 
  state.cart.reduce((sum, item) => sum + item.gstAmount, 0)

export const selectTotal = (state: CartState) => 
  selectSubtotal(state) + selectTotalGst(state)

export const selectItemCount = (state: CartState) => 
  state.cart.reduce((sum, item) => sum + item.quantity, 0)
