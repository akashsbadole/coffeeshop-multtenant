import { create } from 'zustand'
import type { ReturnItem } from './types'

interface ReturnsState {
  // State
  returns: ReturnItem[]
  loading: boolean

  // Actions
  setReturns: (returns: ReturnItem[]) => void
  setLoading: (loading: boolean) => void

  // Async actions
  fetchReturns: () => Promise<void>
  createReturn: (returnData: Omit<ReturnItem, 'id' | 'createdAt'>) => Promise<void>
  updateReturn: (id: string, returnData: Partial<ReturnItem>) => Promise<void>
  deleteReturn: (id: string) => Promise<void>
}

export const useReturnsStore = create<ReturnsState>()((set, get) => ({
  // Initial state
  returns: [],
  loading: false,

  // Setters
  setReturns: (returns) => set({ returns }),
  setLoading: (loading) => set({ loading }),

  // Async actions
  fetchReturns: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/returns')
      if (!response.ok) throw new Error('Failed to fetch returns')
      const data = await response.json()
      set({ returns: data, loading: false })
    } catch (error) {
      console.error('Error fetching returns:', error)
      set({ loading: false })
    }
  },

  createReturn: async (returnData) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      })

      if (!response.ok) throw new Error('Failed to create return')
      const data = await response.json()
      set({ returns: [...get().returns, data], loading: false })
    } catch (error) {
      console.error('Error creating return:', error)
      set({ loading: false })
      throw error
    }
  },

  updateReturn: async (id, returnData) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/pos/returns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      })

      if (!response.ok) throw new Error('Failed to update return')
      const data = await response.json()
      set({
        returns: get().returns.map(r => r.id === id ? data : r),
        loading: false,
      })
    } catch (error) {
      console.error('Error updating return:', error)
      set({ loading: false })
      throw error
    }
  },

  deleteReturn: async (id) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/pos/returns/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete return')
      set({
        returns: get().returns.filter(r => r.id !== id),
        loading: false,
      })
    } catch (error) {
      console.error('Error deleting return:', error)
      set({ loading: false })
      throw error
    }
  },
}))
