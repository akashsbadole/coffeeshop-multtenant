import { create } from 'zustand'

interface UIState {
  // State
  activeTab: string

  // Actions
  setActiveTab: (tab: string) => void
}

export const useUIStore = create<UIState>()((set) => ({
  // Initial state
  activeTab: 'pos',

  // Setters
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
