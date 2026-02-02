import { create } from 'zustand'
import type { CashDrawer } from './types'

interface CashDrawerState {
  // State
  cashDrawer: CashDrawer | null
  loading: boolean

  // Actions
  setCashDrawer: (drawer: CashDrawer | null) => void
  setLoading: (loading: boolean) => void

  // Async actions
  fetchCashDrawer: () => Promise<void>
  cashIn: (amount: number, reason?: string) => Promise<void>
  cashOut: (amount: number, reason?: string) => Promise<void>
  openDrawer: (openingBalance: number) => Promise<void>
  closeDrawer: () => Promise<void>
}

export const useCashDrawerStore = create<CashDrawerState>()((set, get) => ({
  // Initial state
  cashDrawer: null,
  loading: false,

  // Setters
  setCashDrawer: (drawer) => set({ cashDrawer: drawer }),
  setLoading: (loading) => set({ loading }),

  // Async actions
  fetchCashDrawer: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/cashdrawer')
      if (!response.ok) throw new Error('Failed to fetch cash drawer')
      const data = await response.json()
      set({ cashDrawer: data, loading: false })
    } catch (error) {
      console.error('Error fetching cash drawer:', error)
      set({ loading: false })
    }
  },

  cashIn: async (amount, reason) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/cashdrawer/cash-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason }),
      })

      if (!response.ok) throw new Error('Failed to record cash in')
      const data = await response.json()
      set({ cashDrawer: data, loading: false })
    } catch (error) {
      console.error('Error recording cash in:', error)
      set({ loading: false })
      throw error
    }
  },

  cashOut: async (amount, reason) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/cashdrawer/cash-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason }),
      })

      if (!response.ok) throw new Error('Failed to record cash out')
      const data = await response.json()
      set({ cashDrawer: data, loading: false })
    } catch (error) {
      console.error('Error recording cash out:', error)
      set({ loading: false })
      throw error
    }
  },

  openDrawer: async (openingBalance) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/cashdrawer/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingBalance }),
      })

      if (!response.ok) throw new Error('Failed to open cash drawer')
      const data = await response.json()
      set({ cashDrawer: data, loading: false })
    } catch (error) {
      console.error('Error opening cash drawer:', error)
      set({ loading: false })
      throw error
    }
  },

  closeDrawer: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/cashdrawer/close', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to close cash drawer')
      const data = await response.json()
      set({ cashDrawer: data, loading: false })
    } catch (error) {
      console.error('Error closing cash drawer:', error)
      set({ loading: false })
      throw error
    }
  },
}))
