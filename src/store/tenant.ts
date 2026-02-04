import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Organization,
  SubscriptionPlan,
  TenantSubscription,
  CreateOrganizationData,
  UpdateOrganizationData,
  CreateSubscriptionData,
  UpdateSubscriptionData
} from './types'

interface TenantState {
  organization: Organization | null
  subscription: TenantSubscription | null
  availablePlans: SubscriptionPlan[]
  loading: boolean
  error: string

  setOrganization: (org: Organization | null) => void
  setSubscription: (sub: TenantSubscription | null) => void
  setAvailablePlans: (plans: SubscriptionPlan[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string) => void

  fetchOrganization: () => Promise<void>
  fetchSubscription: () => Promise<void>
  fetchAvailablePlans: () => Promise<void>
  createOrganization: (data: CreateOrganizationData) => Promise<Organization>
  updateOrganization: (id: string, data: UpdateOrganizationData) => Promise<Organization>
  createSubscription: (data: CreateSubscriptionData) => Promise<TenantSubscription>
  updateSubscription: (id: string, data: UpdateSubscriptionData) => Promise<TenantSubscription>
  cancelSubscription: (id: string) => Promise<TenantSubscription>
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      organization: null,
      subscription: null,
      availablePlans: [],
      loading: false,
      error: '',

      setOrganization: (org) => set({ organization: org }),
      setSubscription: (sub) => set({ subscription: sub }),
      setAvailablePlans: (plans) => set({ availablePlans: plans }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      fetchOrganization: async () => {
        set({ loading: true, error: '' })
        try {
          const response = await fetch('/api/tenant/organization')
          if (!response.ok) throw new Error('Failed to fetch organization')
          const org = await response.json()
          set({ organization: org, loading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch organization',
            loading: false
          })
        }
      },

      fetchSubscription: async () => {
        set({ loading: true, error: '' })
        try {
          const response = await fetch('/api/tenant/subscription')
          if (!response.ok) throw new Error('Failed to fetch subscription')
          const sub = await response.json()
          set({ subscription: sub, loading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch subscription',
            loading: false
          })
        }
      },

      fetchAvailablePlans: async () => {
        set({ loading: true, error: '' })
        try {
          const response = await fetch('/api/tenant/plans')
          if (!response.ok) throw new Error('Failed to fetch plans')
          const plans = await response.json()
          set({ availablePlans: plans, loading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch plans',
            loading: false
          })
        }
      },

      createOrganization: async (data) => {
        set({ loading: true, error: '' })
        try {
          const response = await fetch('/api/tenant/organizations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to create organization')
          }
          const org = await response.json()
          set({ organization: org, loading: false })
          return org
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create organization',
            loading: false
          })
          throw error
        }
      },

      updateOrganization: async (id, data) => {
        set({ loading: true, error: '' })
        try {
          const response = await fetch(`/api/tenant/organizations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to update organization')
          }
          const org = await response.json()
          set({ organization: org, loading: false })
          return org
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update organization',
            loading: false
          })
          throw error
        }
      },

      createSubscription: async (data) => {
        set({ loading: true, error: '' })
        try {
          const response = await fetch('/api/tenant/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to create subscription')
          }
          const sub = await response.json()
          set({ subscription: sub, loading: false })
          return sub
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create subscription',
            loading: false
          })
          throw error
        }
      },

      updateSubscription: async (id, data) => {
        set({ loading: true, error: '' })
        try {
          const response = await fetch(`/api/tenant/subscriptions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to update subscription')
          }
          const sub = await response.json()
          set({ subscription: sub, loading: false })
          return sub
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update subscription',
            loading: false
          })
          throw error
        }
      },

      cancelSubscription: async (id) => {
        set({ loading: true, error: '' })
        try {
          const response = await fetch(`/api/tenant/subscriptions/${id}/cancel`, {
            method: 'POST'
          })
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to cancel subscription')
          }
          const sub = await response.json()
          set({ subscription: sub, loading: false })
          return sub
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to cancel subscription',
            loading: false
          })
          throw error
        }
      }
    }),
    {
      name: 'tenant-storage',
      partialize: (state) => ({ organization: state.organization, subscription: state.subscription })
    }
  )
)
