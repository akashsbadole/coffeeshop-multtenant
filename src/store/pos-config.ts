import { create } from 'zustand'
import type { POSConfig } from './types'

interface POSConfigState {
  // State
  posConfig: POSConfig | null
  loading: boolean

  // Actions
  setPosConfig: (config: POSConfig | null) => void
  setLoading: (loading: boolean) => void

  // Async actions
  fetchPOSConfig: () => Promise<void>

  // Helper
  isFeatureEnabled: (feature: keyof POSConfig['features']) => boolean
}

export const usePOSConfigStore = create<POSConfigState>()((set, get) => ({
  // Initial state
  posConfig: null,
  loading: true,

  // Setters
  setPosConfig: (config) => set({ posConfig: config }),
  setLoading: (loading) => set({ loading }),

  // Async actions
  fetchPOSConfig: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/config')
      if (!response.ok) throw new Error('Failed to fetch POS config')
      const data = await response.json()
      set({ posConfig: data, loading: false })
    } catch (error) {
      console.error('Error fetching POS config:', error)
      set({ loading: false })
    }
  },

  // Helper
  isFeatureEnabled: (feature) => {
    const { posConfig } = get()
    return posConfig?.features[feature] ?? false
  },
}))
