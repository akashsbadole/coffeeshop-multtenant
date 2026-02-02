import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Order, HeldOrder, CartItem } from './types'

interface OrdersState {
  // State
  orders: Order[]
  heldOrders: HeldOrder[]
  heldOrdersOpen: boolean
  loading: boolean

  // Actions
  setOrders: (orders: Order[]) => void
  setHeldOrders: (orders: HeldOrder[]) => void
  setHeldOrdersOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void

  // Async actions
  fetchOrders: () => Promise<void>
  holdOrder: (cart: CartItem[], subtotal: number, totalGst: number, sgst: number, cgst: number, total: number, heldBy: string, customerName?: string, customerPhone?: string, notes?: string) => void
  recallOrder: (heldOrderId: string) => HeldOrder | null
  deleteHeldOrder: (heldOrderId: string) => void
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      // Initial state
      orders: [],
      heldOrders: [],
      heldOrdersOpen: false,
      loading: false,

      // Setters
      setOrders: (orders) => set({ orders }),
      setHeldOrders: (orders) => set({ heldOrders: orders }),
      setHeldOrdersOpen: (open) => set({ heldOrdersOpen: open }),
      setLoading: (loading) => set({ loading }),

      // Async actions
      fetchOrders: async () => {
        set({ loading: true })
        try {
          const response = await fetch('/api/pos/orders')
          if (!response.ok) throw new Error('Failed to fetch orders')
          const data = await response.json()
          set({ orders: data, loading: false })
        } catch (error) {
          console.error('Error fetching orders:', error)
          set({ loading: false })
        }
      },

      holdOrder: (cart, subtotal, totalGst, sgst, cgst, total, heldBy, customerName, customerPhone, notes) => {
        const { heldOrders } = get()
        const newHeldOrder: HeldOrder = {
          id: `held-${Date.now()}`,
          items: [...cart],
          customerName,
          customerPhone,
          notes,
          subtotal,
          totalGst,
          sgst,
          cgst,
          total,
          heldAt: new Date().toISOString(),
          heldBy,
        }
        set({ heldOrders: [...heldOrders, newHeldOrder] })
      },

      recallOrder: (heldOrderId) => {
        const { heldOrders } = get()
        const heldOrder = heldOrders.find(order => order.id === heldOrderId)
        if (heldOrder) {
          // Remove the recalled order from heldOrders
          set({ heldOrders: heldOrders.filter(order => order.id !== heldOrderId) })
          return heldOrder
        }
        return null
      },

      deleteHeldOrder: (heldOrderId) => {
        set({
          heldOrders: get().heldOrders.filter(order => order.id !== heldOrderId)
        })
      },
    }),
    {
      name: 'orders-storage',
      partialize: (state) => ({ heldOrders: state.heldOrders }),
    }
  )
)
