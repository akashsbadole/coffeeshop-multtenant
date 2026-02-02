import { create } from 'zustand'
import type { AIInsightsData } from './types'

interface AIInsightsState {
  // State
  aiInsights: AIInsightsData | null
  loading: boolean

  // Actions
  setAiInsights: (insights: AIInsightsData | null) => void
  setLoading: (loading: boolean) => void

  // Async actions
  fetchAIInsights: (days?: number) => Promise<void>
}

export const useAIInsightsStore = create<AIInsightsState>()((set, get) => ({
  // Initial state
  aiInsights: null,
  loading: false,

  // Setters
  setAiInsights: (insights) => set({ aiInsights: insights }),
  setLoading: (loading) => set({ loading }),

  // Async actions
  fetchAIInsights: async (days = 7) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/ai/insights?days=${days}`)
      if (!response.ok) throw new Error('Failed to fetch AI insights')
      const data = await response.json()
      set({ aiInsights: data, loading: false })
    } catch (error) {
      console.error('Error fetching AI insights:', error)
      set({ loading: false })
    }
  },
}))
