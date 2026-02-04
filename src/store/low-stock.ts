import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LowStockAlert {
  id: string
  type: 'inventory' | 'variant'
  name: string
  sku: string | null
  barcode: string | null
  category: string
  currentQuantity: number
  reorderLevel: number
  maxStock: number | null
  lastRestocked: string | null
  status: 'out_of_stock' | 'critical' | 'low'
}

interface AlertSummary {
  totalAlerts: number
  critical: number
  outOfStock: number
  low: number
}

interface LowStockState {
  alerts: LowStockAlert[]
  summary: AlertSummary | null
  isLoading: boolean
  error: string | null
  acknowledgedAlerts: string[]
  fetchAlerts: (criticalOnly?: boolean) => Promise<void>
  acknowledgeAlert: (itemId: string, notes?: string) => Promise<void>
  dismissAlert: (itemId: string) => void
  refreshAlerts: () => Promise<void>
}

export const useLowStockStore = create<LowStockState>()(
  persist(
    (set, get) => ({
      alerts: [],
      summary: null,
      isLoading: false,
      error: null,
      acknowledgedAlerts: [],

      fetchAlerts: async (criticalOnly = false) => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch(`/api/inventory/low-stock${criticalOnly ? '?critical=true' : ''}`)
          
          if (response.ok) {
            const data = await response.json()
            set({ 
              alerts: data.alerts,
              summary: data.summary,
              isLoading: false 
            })
          } else {
            set({ error: 'Failed to fetch alerts', isLoading: false })
          }
        } catch (error) {
          console.error('Error fetching low stock alerts:', error)
          set({ error: 'Failed to fetch alerts', isLoading: false })
        }
      },

      acknowledgeAlert: async (itemId: string, notes?: string) => {
        try {
          const alert = get().alerts.find(a => a.id === itemId)
          if (!alert) return

          const response = await fetch('/api/inventory/low-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemId,
              itemType: alert.type,
              notes
            })
          })

          if (response.ok) {
            set(state => ({
              acknowledgedAlerts: [...state.acknowledgedAlerts, itemId]
            }))
          }
        } catch (error) {
          console.error('Error acknowledging alert:', error)
        }
      },

      dismissAlert: (itemId: string) => {
        set(state => ({
          alerts: state.alerts.filter(a => a.id !== itemId),
          acknowledgedAlerts: [...state.acknowledgedAlerts, itemId]
        }))
      },

      refreshAlerts: async () => {
        await get().fetchAlerts()
      }
    }),
    {
      name: 'low-stock-storage',
      partialize: (state) => ({ acknowledgedAlerts: state.acknowledgedAlerts })
    }
  )
)
