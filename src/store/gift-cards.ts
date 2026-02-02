import { create } from 'zustand'
import type { GiftCard } from './types'

interface GiftCardsState {
  // State
  giftCards: GiftCard[]
  giftCardLookup: string
  giftCardBalance: number | null
  loading: boolean

  // Actions
  setGiftCards: (cards: GiftCard[]) => void
  setGiftCardLookup: (lookup: string) => void
  setGiftCardBalance: (balance: number | null) => void
  setLoading: (loading: boolean) => void

  // Async actions
  fetchGiftCards: () => Promise<void>
  lookupGiftCard: (cardNumber: string) => Promise<void>
  issueGiftCard: (cardData: Omit<GiftCard, 'id' | 'issuedAt'>) => Promise<void>
  rechargeGiftCard: (cardId: string, amount: number) => Promise<void>
}

export const useGiftCardsStore = create<GiftCardsState>()((set, get) => ({
  // Initial state
  giftCards: [],
  giftCardLookup: '',
  giftCardBalance: null,
  loading: false,

  // Setters
  setGiftCards: (cards) => set({ giftCards: cards }),
  setGiftCardLookup: (lookup) => set({ giftCardLookup: lookup }),
  setGiftCardBalance: (balance) => set({ giftCardBalance: balance }),
  setLoading: (loading) => set({ loading }),

  // Async actions
  fetchGiftCards: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/giftcards')
      if (!response.ok) throw new Error('Failed to fetch gift cards')
      const data = await response.json()
      set({ giftCards: data, loading: false })
    } catch (error) {
      console.error('Error fetching gift cards:', error)
      set({ loading: false })
    }
  },

  lookupGiftCard: async (cardNumber) => {
    set({ loading: true, giftCardLookup: cardNumber })
    try {
      const response = await fetch(`/api/pos/giftcards/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNumber }),
      })

      if (!response.ok) throw new Error('Gift card not found')
      const data = await response.json()
      set({ giftCardBalance: data.balance, loading: false })
    } catch (error) {
      console.error('Error looking up gift card:', error)
      set({ giftCardBalance: null, loading: false })
      throw error
    }
  },

  issueGiftCard: async (cardData) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/giftcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      })

      if (!response.ok) throw new Error('Failed to issue gift card')
      const data = await response.json()
      set({ giftCards: [...get().giftCards, data], loading: false })
    } catch (error) {
      console.error('Error issuing gift card:', error)
      set({ loading: false })
      throw error
    }
  },

  rechargeGiftCard: async (cardId, amount) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/pos/giftcards/${cardId}/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      if (!response.ok) throw new Error('Failed to recharge gift card')
      const data = await response.json()
      set({
        giftCards: get().giftCards.map(card => card.id === cardId ? data : card),
        loading: false,
      })
    } catch (error) {
      console.error('Error recharging gift card:', error)
      set({ loading: false })
      throw error
    }
  },
}))
