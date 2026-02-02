import { create } from 'zustand'
import type { Discount, DiscountApplication, DiscountResult } from './types'

interface DiscountsState {
  // State
  discounts: Discount[]
  loading: boolean
  appliedDiscount: Discount | null
  discountError: string | null

  // Actions
  setDiscounts: (discounts: Discount[]) => void
  setLoading: (loading: boolean) => void
  setAppliedDiscount: (discount: Discount | null) => void
  setDiscountError: (error: string | null) => void

  // Async actions
  fetchDiscounts: () => Promise<void>
  fetchDiscountById: (id: string) => Promise<Discount | null>
  createDiscount: (discount: Omit<Discount, 'id' | 'currentUsage' | 'createdAt' | 'updatedAt'>) => Promise<Discount>
  updateDiscount: (id: string, discount: Partial<Discount>) => Promise<Discount>
  deleteDiscount: (id: string) => Promise<void>
  applyDiscount: (application: DiscountApplication) => Promise<DiscountResult>
  validateDiscount: (code: string, totalAmount: number) => Promise<DiscountResult>
  toggleDiscountStatus: (id: string) => Promise<void>
}

export const useDiscountsStore = create<DiscountsState>()((set, get) => ({
  // Initial state
  discounts: [],
  loading: false,
  appliedDiscount: null,
  discountError: null,

  // Setters
  setDiscounts: (discounts) => set({ discounts }),
  setLoading: (loading) => set({ loading }),
  setAppliedDiscount: (discount) => set({ appliedDiscount: discount }),
  setDiscountError: (error) => set({ discountError: error }),

  // Async actions
  fetchDiscounts: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/discounts')
      if (!response.ok) throw new Error('Failed to fetch discounts')
      const data = await response.json()
      set({ discounts: data, loading: false })
    } catch (error) {
      console.error('Error fetching discounts:', error)
      set({ loading: false })
    }
  },

  fetchDiscountById: async (id) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/discounts/${id}`)
      if (!response.ok) throw new Error('Failed to fetch discount')
      const data = await response.json()
      set({ loading: false })
      return data
    } catch (error) {
      console.error('Error fetching discount:', error)
      set({ loading: false })
      return null
    }
  },

  createDiscount: async (discount) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discount),
      })

      if (!response.ok) throw new Error('Failed to create discount')
      const data = await response.json()
      set({
        discounts: [...get().discounts, data],
        loading: false,
      })
      return data
    } catch (error) {
      console.error('Error creating discount:', error)
      set({ loading: false })
      throw error
    }
  },

  updateDiscount: async (id, discount) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/discounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discount),
      })

      if (!response.ok) throw new Error('Failed to update discount')
      const data = await response.json()
      set({
        discounts: get().discounts.map(d => d.id === id ? data : d),
        loading: false,
      })
      return data
    } catch (error) {
      console.error('Error updating discount:', error)
      set({ loading: false })
      throw error
    }
  },

  deleteDiscount: async (id) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/discounts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete discount')
      set({
        discounts: get().discounts.filter(d => d.id !== id),
        loading: false,
      })
    } catch (error) {
      console.error('Error deleting discount:', error)
      set({ loading: false })
      throw error
    }
  },

  applyDiscount: async (application) => {
    set({ loading: true, discountError: null })
    try {
      const response = await fetch('/api/discounts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to apply discount')
      }

      const data: DiscountResult = await response.json()
      set({
        appliedDiscount: data.discount || null,
        discountError: data.success ? null : data.message || null,
        loading: false,
      })
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply discount'
      console.error('Error applying discount:', error)
      set({
        appliedDiscount: null,
        discountError: errorMessage,
        loading: false,
      })
      return {
        success: false,
        discountAmount: 0,
        message: errorMessage,
      }
    }
  },

  validateDiscount: async (code, totalAmount) => {
    set({ loading: true, discountError: null })
    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, totalAmount }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Invalid discount code')
      }

      const data: DiscountResult = await response.json()
      set({ loading: false })
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid discount code'
      console.error('Error validating discount:', error)
      set({
        discountError: errorMessage,
        loading: false,
      })
      return {
        success: false,
        discountAmount: 0,
        message: errorMessage,
      }
    }
  },

  toggleDiscountStatus: async (id) => {
    set({ loading: true })
    try {
      const discount = get().discounts.find(d => d.id === id)
      if (!discount) throw new Error('Discount not found')

      const newStatus = discount.status === 'active' ? 'inactive' : 'active'
      const response = await fetch(`/api/discounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to toggle discount status')
      const data = await response.json()
      set({
        discounts: get().discounts.map(d => d.id === id ? data : d),
        loading: false,
      })
    } catch (error) {
      console.error('Error toggling discount status:', error)
      set({ loading: false })
      throw error
    }
  },
}))
