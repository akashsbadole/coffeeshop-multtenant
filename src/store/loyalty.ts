import { create } from 'zustand'
import type { Customer, LoyaltyHistory, LoyaltyRegistration, LoyaltyRedemption } from './types'

interface LoyaltyState {
  // State
  customers: Customer[]
  loyaltyHistory: LoyaltyHistory[]
  selectedCustomer: Customer | null
  loading: boolean
  tierUpgradeNotification: string | null

  // Actions
  setCustomers: (customers: Customer[]) => void
  setLoyaltyHistory: (history: LoyaltyHistory[]) => void
  setSelectedCustomer: (customer: Customer | null) => void
  setLoading: (loading: boolean) => void
  setTierUpgradeNotification: (notification: string | null) => void

  // Async actions
  fetchCustomers: () => Promise<void>
  fetchCustomerByPhone: (phone: string) => Promise<Customer | null>
  registerCustomer: (registration: LoyaltyRegistration) => Promise<Customer>
  addPoints: (customerId: string, amount: number, orderId?: string) => Promise<void>
  redeemPoints: (redemption: LoyaltyRedemption) => Promise<void>
  fetchLoyaltyHistory: (customerId: string) => Promise<void>
  updateCustomerTier: (customerId: string) => Promise<void>
}

export const useLoyaltyStore = create<LoyaltyState>()((set, get) => ({
  // Initial state
  customers: [],
  loyaltyHistory: [],
  selectedCustomer: null,
  loading: false,
  tierUpgradeNotification: null,

  // Setters
  setCustomers: (customers) => set({ customers }),
  setLoyaltyHistory: (history) => set({ loyaltyHistory: history }),
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  setLoading: (loading) => set({ loading }),
  setTierUpgradeNotification: (notification) => set({ tierUpgradeNotification: notification }),

  // Async actions
  fetchCustomers: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/loyalty')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const data = await response.json()
      set({ customers: data, loading: false })
    } catch (error) {
      console.error('Error fetching customers:', error)
      set({ loading: false })
    }
  },

  fetchCustomerByPhone: async (phone) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/loyalty?phone=${encodeURIComponent(phone)}`)
      if (!response.ok) {
        if (response.status === 404) {
          set({ loading: false })
          return null
        }
        throw new Error('Failed to fetch customer')
      }
      const data = await response.json()
      set({ selectedCustomer: data, loading: false })
      return data
    } catch (error) {
      console.error('Error fetching customer by phone:', error)
      set({ loading: false })
      return null
    }
  },

  registerCustomer: async (registration) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration),
      })

      if (!response.ok) throw new Error('Failed to register customer')
      const data = await response.json()
      set({
        customers: [...get().customers, data],
        selectedCustomer: data,
        loading: false,
      })
      return data
    } catch (error) {
      console.error('Error registering customer:', error)
      set({ loading: false })
      throw error
    }
  },

  addPoints: async (customerId, amount, orderId) => {
    set({ loading: true })
    try {
      const points = Math.floor(amount / 10) // 1 point per ₹10 spent
      const response = await fetch(`/api/customers/${customerId}/loyalty`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'earned',
          points,
          orderId,
          description: `Points earned from order`,
        }),
      })

      if (!response.ok) throw new Error('Failed to add points')
      const data = await response.json()

      // Update customer in state
      set({
        customers: get().customers.map(customer =>
          customer.id === customerId ? data.customer : customer
        ),
        selectedCustomer: get().selectedCustomer?.id === customerId ? data.customer : get().selectedCustomer,
        loyaltyHistory: [...get().loyaltyHistory, data.history],
        loading: false,
      })

      // Check for tier upgrade
      if (data.tierUpgraded) {
        set({ tierUpgradeNotification: `Congratulations! You've been upgraded to ${data.customer.tier} tier!` })
      }
    } catch (error) {
      console.error('Error adding points:', error)
      set({ loading: false })
      throw error
    }
  },

  redeemPoints: async (redemption) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/customers/${redemption.customerId}/loyalty`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'redeemed',
          points: redemption.points,
          description: redemption.description,
        }),
      })

      if (!response.ok) throw new Error('Failed to redeem points')
      const data = await response.json()

      set({
        customers: get().customers.map(customer =>
          customer.id === redemption.customerId ? data.customer : customer
        ),
        selectedCustomer: get().selectedCustomer?.id === redemption.customerId ? data.customer : get().selectedCustomer,
        loyaltyHistory: [...get().loyaltyHistory, data.history],
        loading: false,
      })
    } catch (error) {
      console.error('Error redeeming points:', error)
      set({ loading: false })
      throw error
    }
  },

  fetchLoyaltyHistory: async (customerId) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/loyalty/history?customerId=${customerId}`)
      if (!response.ok) throw new Error('Failed to fetch loyalty history')
      const data = await response.json()
      set({ loyaltyHistory: data, loading: false })
    } catch (error) {
      console.error('Error fetching loyalty history:', error)
      set({ loading: false })
    }
  },

  updateCustomerTier: async (customerId) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/customers/${customerId}/loyalty/tier`, {
        method: 'PUT',
      })

      if (!response.ok) throw new Error('Failed to update customer tier')
      const data = await response.json()

      set({
        customers: get().customers.map(customer =>
          customer.id === customerId ? data : customer
        ),
        selectedCustomer: get().selectedCustomer?.id === customerId ? data : get().selectedCustomer,
        loading: false,
      })

      if (data.tierUpgraded) {
        set({ tierUpgradeNotification: `Congratulations! You've been upgraded to ${data.tier} tier!` })
      }
    } catch (error) {
      console.error('Error updating customer tier:', error)
      set({ loading: false })
      throw error
    }
  },
}))
