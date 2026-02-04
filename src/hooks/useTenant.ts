import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'

interface Organization {
  id: string
  name: string
  slug: string
  email: string
  phone?: string | null
  logo?: string | null
  industry?: string | null
  gstin?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  country: string
  timezone: string
  isActive: boolean
  maxUsers: number
  maxStores: number
  createdAt: string
  updatedAt: string
}

interface SubscriptionPlan {
  id: string
  name: string
  type: string
  description?: string | null
  price: number
  yearlyPrice?: number | null
  currency: string
  features: string
  maxUsers: number
  maxStores: number
  maxOrdersPerMonth?: number | null
  maxMenuItems?: number | null
  maxInventoryItems?: number | null
  supportLevel: string
  isActive: boolean
}

interface TenantSubscription {
  id: string
  organizationId: string
  planId: string
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED' | 'PENDING'
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  startDate: string
  endDate?: string | null
  nextBillingDate?: string | null
  autoRenew: boolean
  paymentMethod?: string | null
  paymentProvider?: string | null
  paymentStatus: string
  plan?: SubscriptionPlan
}

interface UsageData {
  users: { current: number; limit: number; percentage: number }
  stores: { current: number; limit: number; percentage: number }
  menuItems: { current: number; limit: number; percentage: number }
  orders: { current: number; limit: number; percentage: number }
  customers: { current: number; limit: number | null }
  warnings: string[]
  subscription: {
    id: string
    status: string
    plan: string
    planType: string
    startDate: string
    endDate?: string | null
    nextBillingDate?: string | null
    autoRenew: boolean
  } | null
  plan: {
    id: string
    name: string
    type: string
    features: string[]
    limits: {
      maxUsers: number
      maxStores: number
      maxMenuItems: number
      maxOrdersPerMonth: number
    }
  } | null
}

interface BillingHistoryItem {
  id: string
  plan: string
  planType: string
  amount: number
  cycle: string
  status: string
  startDate: string
  endDate?: string | null
  nextBillingDate?: string | null
  autoRenew: boolean
  paymentStatus: string
  createdAt: string
}

export function useTenant() {
  const { user } = useAuthStore()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTenantData = useCallback(async () => {
    if (!user?.organizationId) {
      setOrganization(null)
      setSubscription(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tenant/organizations?id=${user.organizationId}`)
      if (!response.ok) throw new Error('Failed to fetch organization')
      const orgData = await response.json()
      setOrganization(orgData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tenant data')
    }

    try {
      const response = await fetch(`/api/tenant/subscriptions?organizationId=${user.organizationId}`)
      if (!response.ok) throw new Error('Failed to fetch subscription')
      const subsData = await response.json()
      setSubscription(subsData[0] || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription')
    }

    setLoading(false)
  }, [user?.organizationId])

  useEffect(() => {
    fetchTenantData()
  }, [fetchTenantData])

  return {
    organization,
    subscription,
    loading,
    error,
    refetch: fetchTenantData
  }
}

export function useSubscription() {
  const { user } = useAuthStore()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    if (!user?.organizationId) {
      setUsage(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tenant/usage?organizationId=${user.organizationId}`)
      if (!response.ok) throw new Error('Failed to fetch usage')
      const data = await response.json()
      setUsage(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage')
    }

    setLoading(false)
  }, [user?.organizationId])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  const isFeatureEnabled = useCallback((feature: string) => {
    if (!usage?.plan) return false
    const features = usage.plan.features || []
    return features.includes(feature) || features.includes('all_features')
  }, [usage])

  const isWithinLimits = useCallback((resource: 'users' | 'stores' | 'menuItems' | 'orders') => {
    if (!usage) return false
    const resourceData = usage[resource]
    if (!resourceData) return false
    return resourceData.current < resourceData.limit
  }, [usage])

  return {
    usage,
    loading,
    error,
    refetch: fetchUsage,
    isFeatureEnabled,
    isWithinLimits,
    canAddUser: isWithinLimits('users'),
    canAddStore: isWithinLimits('stores'),
    canAddMenuItem: isWithinLimits('menuItems')
  }
}

export function useBillingHistory() {
  const { user } = useAuthStore()
  const [history, setHistory] = useState<BillingHistoryItem[]>([])
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalSpent: 0,
    currentSubscription: null as { id: string; plan: string; status: string; nextBillingDate?: string | null } | null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!user?.organizationId) {
      setHistory([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tenant/billing?organizationId=${user.organizationId}`)
      if (!response.ok) throw new Error('Failed to fetch billing history')
      const data = await response.json()
      setHistory(data.history || [])
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch billing history')
    }

    setLoading(false)
  }, [user?.organizationId])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return {
    history,
    summary,
    loading,
    error,
    refetch: fetchHistory
  }
}

export function useAvailablePlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/tenant/plans?activeOnly=true')
        if (!response.ok) throw new Error('Failed to fetch plans')
        const data = await response.json()
        setPlans(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plans')
      }

      setLoading(false)
    }

    fetchPlans()
  }, [])

  return { plans, loading, error }
}

export function useSubscriptionActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changePlan = async (
    organizationId: string,
    newPlanId: string,
    billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  ) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tenant/subscriptions/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, newPlanId, billingCycle })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to change plan')
      }

      const data = await response.json()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change plan'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const cancelSubscription = async (subscriptionId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tenant/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      const data = await response.json()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel subscription'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    changePlan,
    cancelSubscription
  }
}
