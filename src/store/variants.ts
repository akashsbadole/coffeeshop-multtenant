import { create } from 'zustand'
import type { Variant } from './types'

interface VariantsState {
  // State
  selectedVariant: Variant | null
  variants: Variant[]
  loading: boolean

  // Actions
  setSelectedVariant: (variant: Variant | null) => void
  setVariants: (variants: Variant[]) => void
  setLoading: (loading: boolean) => void

  // Async actions
  fetchVariants: (menuItemId?: string) => Promise<void>
  createVariant: (variant: Omit<Variant, 'id'>) => Promise<void>
  updateVariant: (id: string, variant: Partial<Variant>) => Promise<void>
  deleteVariant: (id: string) => Promise<void>
}

export const useVariantsStore = create<VariantsState>()((set, get) => ({
  // Initial state
  selectedVariant: null,
  variants: [],
  loading: false,

  // Setters
  setSelectedVariant: (variant) => set({ selectedVariant: variant }),
  setVariants: (variants) => set({ variants }),
  setLoading: (loading) => set({ loading }),

  // Async actions
  fetchVariants: async (menuItemId) => {
    set({ loading: true })
    try {
      const url = menuItemId
        ? `/api/pos/variants?menuItemId=${menuItemId}`
        : '/api/pos/variants'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch variants')
      const data = await response.json()
      set({ variants: data, loading: false })
    } catch (error) {
      console.error('Error fetching variants:', error)
      set({ loading: false })
    }
  },

  createVariant: async (variant) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variant),
      })

      if (!response.ok) throw new Error('Failed to create variant')
      const data = await response.json()
      set({ variants: [...get().variants, data], loading: false })
    } catch (error) {
      console.error('Error creating variant:', error)
      set({ loading: false })
      throw error
    }
  },

  updateVariant: async (id, variant) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/pos/variants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variant),
      })

      if (!response.ok) throw new Error('Failed to update variant')
      const data = await response.json()
      set({
        variants: get().variants.map(v => v.id === id ? data : v),
        loading: false,
      })
    } catch (error) {
      console.error('Error updating variant:', error)
      set({ loading: false })
      throw error
    }
  },

  deleteVariant: async (id) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/pos/variants/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete variant')
      set({
        variants: get().variants.filter(v => v.id !== id),
        loading: false,
      })
    } catch (error) {
      console.error('Error deleting variant:', error)
      set({ loading: false })
      throw error
    }
  },
}))
