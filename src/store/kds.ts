import { create } from 'zustand'
import type { KDSOrder, KDSStatus } from './types'

interface KDSState {
  // State
  orders: KDSOrder[]
  pendingOrders: KDSOrder[]
  preparingOrders: KDSOrder[]
  readyOrders: KDSOrder[]
  completedOrders: KDSOrder[]
  loading: boolean
  filterStatus: KDSStatus | 'ALL'
  autoRefresh: boolean

  // Actions
  setOrders: (orders: KDSOrder[]) => void
  setLoading: (loading: boolean) => void
  setFilterStatus: (status: KDSStatus | 'ALL') => void
  setAutoRefresh: (autoRefresh: boolean) => void

  // Computed actions
  updateOrderLists: () => void

  // Async actions
  fetchOrders: () => Promise<void>
  updateOrderStatus: (orderId: string, status: KDSStatus) => Promise<void>
  startPreparing: (orderId: string) => Promise<void>
  markReady: (orderId: string) => Promise<void>
  completeOrder: (orderId: string) => Promise<void>
  refreshOrders: () => Promise<void>
}

export const useKDSStore = create<KDSState>()((set, get) => ({
  // Initial state
  orders: [],
  pendingOrders: [],
  preparingOrders: [],
  readyOrders: [],
  completedOrders: [],
  loading: false,
  filterStatus: 'ALL',
  autoRefresh: true,

  // Setters
  setOrders: (orders) => {
    set({ orders })
    get().updateOrderLists()
  },
  setLoading: (loading) => set({ loading }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setAutoRefresh: (autoRefresh) => set({ autoRefresh }),

  // Computed action to update filtered order lists
  updateOrderLists: () => {
    const { orders } = get()
    set({
      pendingOrders: orders.filter(order => order.status === 'PENDING'),
      preparingOrders: orders.filter(order => order.status === 'PREPARING'),
      readyOrders: orders.filter(order => order.status === 'READY'),
      completedOrders: orders.filter(order => order.status === 'COMPLETED'),
    })
  },

  // Async actions
  fetchOrders: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/kds')
      if (!response.ok) throw new Error('Failed to fetch KDS orders')
      const data = await response.json()
      set({ orders: data, loading: false })
      get().updateOrderLists()
    } catch (error) {
      console.error('Error fetching KDS orders:', error)
      set({ loading: false })
    }
  },

  updateOrderStatus: async (orderId, status) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/pos/kds/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Failed to update order status')
      const data = await response.json()
      set({
        orders: get().orders.map(order => order.id === orderId ? data : order),
        loading: false,
      })
      get().updateOrderLists()
    } catch (error) {
      console.error('Error updating order status:', error)
      set({ loading: false })
      throw error
    }
  },

  startPreparing: async (orderId) => {
    await get().updateOrderStatus(orderId, 'PREPARING')
  },

  markReady: async (orderId) => {
    await get().updateOrderStatus(orderId, 'READY')
  },

  completeOrder: async (orderId) => {
    await get().updateOrderStatus(orderId, 'COMPLETED')
  },

  refreshOrders: async () => {
    await get().fetchOrders()
  },
}))
