import { create } from 'zustand'
import type { StaffPerformance, StaffPerformanceFilters } from './types'

interface StaffState {
  // State
  performanceData: StaffPerformance[]
  selectedStaffId: string | null
  loading: boolean
  filters: StaffPerformanceFilters

  // Actions
  setPerformanceData: (data: StaffPerformance[]) => void
  setSelectedStaffId: (staffId: string | null) => void
  setLoading: (loading: boolean) => void
  setFilters: (filters: StaffPerformanceFilters) => void

  // Computed actions
  getStaffById: (staffId: string) => StaffPerformance | undefined
  getTeamAverage: () => {
    averageOrders: number
    averageRevenue: number
    averageItemsSold: number
    averageEfficiency: number
  } | null
  getTopPerformers: (limit?: number) => StaffPerformance[]

  // Async actions
  fetchPerformanceData: (filters?: StaffPerformanceFilters) => Promise<void>
  fetchStaffPerformance: (staffId: string, date?: string) => Promise<StaffPerformance | null>
  refreshPerformanceData: () => Promise<void>
}

export const useStaffStore = create<StaffState>()((set, get) => ({
  // Initial state
  performanceData: [],
  selectedStaffId: null,
  loading: false,
  filters: {},

  // Setters
  setPerformanceData: (data) => set({ performanceData: data }),
  setSelectedStaffId: (staffId) => set({ selectedStaffId: staffId }),
  setLoading: (loading) => set({ loading }),
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  // Computed actions
  getStaffById: (staffId) => {
    return get().performanceData.find(staff => staff.staffId === staffId)
  },

  getTeamAverage: () => {
    const { performanceData } = get()
    if (performanceData.length === 0) return null

    const totalOrders = performanceData.reduce((sum, staff) => sum + staff.ordersProcessed, 0)
    const totalRevenue = performanceData.reduce((sum, staff) => sum + staff.totalRevenue, 0)
    const totalItemsSold = performanceData.reduce((sum, staff) => sum + staff.itemsSold, 0)
    const totalEfficiency = performanceData.reduce((sum, staff) => sum + staff.efficiencyScore, 0)

    return {
      averageOrders: totalOrders / performanceData.length,
      averageRevenue: totalRevenue / performanceData.length,
      averageItemsSold: totalItemsSold / performanceData.length,
      averageEfficiency: totalEfficiency / performanceData.length,
    }
  },

  getTopPerformers: (limit = 5) => {
    const { performanceData } = get()
    return [...performanceData]
      .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
      .slice(0, limit)
  },

  // Async actions
  fetchPerformanceData: async (filters) => {
    set({ loading: true })
    try {
      const queryParams = new URLSearchParams()
      if (filters?.startDate) queryParams.append('startDate', filters.startDate)
      if (filters?.endDate) queryParams.append('endDate', filters.endDate)
      if (filters?.staffId) queryParams.append('staffId', filters.staffId)

      const url = `/api/staff/performance${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch staff performance data')
      const data = await response.json()
      set({ performanceData: data, loading: false })
    } catch (error) {
      console.error('Error fetching staff performance data:', error)
      set({ loading: false })
    }
  },

  fetchStaffPerformance: async (staffId, date) => {
    set({ loading: true })
    try {
      const queryParams = new URLSearchParams()
      if (date) queryParams.append('date', date)

      const url = `/api/staff/performance/${staffId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch staff performance')
      const data = await response.json()
      set({ loading: false })
      return data
    } catch (error) {
      console.error('Error fetching staff performance:', error)
      set({ loading: false })
      return null
    }
  },

  refreshPerformanceData: async () => {
    const { filters } = get()
    await get().fetchPerformanceData(filters)
  },
}))
