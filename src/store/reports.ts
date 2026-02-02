import { create } from 'zustand'
import type { ReportData, ReportType } from './types'

interface ReportsState {
  // State
  reportType: ReportType
  reportData: ReportData | null
  loading: boolean
  reportStartDate: string
  reportEndDate: string
  reportGroupBy: string

  // Actions
  setReportType: (type: ReportType) => void
  setReportData: (data: ReportData | null) => void
  setLoading: (loading: boolean) => void
  setReportStartDate: (date: string) => void
  setReportEndDate: (date: string) => void
  setReportGroupBy: (groupBy: string) => void

  // Async actions
  fetchReport: () => Promise<void>
  exportReport: (format: 'csv' | 'pdf' | 'excel') => Promise<void>
}

export const useReportsStore = create<ReportsState>()((set, get) => ({
  // Initial state
  reportType: 'sales',
  reportData: null,
  loading: false,
  reportStartDate: '',
  reportEndDate: '',
  reportGroupBy: 'day',

  // Setters
  setReportType: (type) => set({ reportType: type }),
  setReportData: (data) => set({ reportData: data }),
  setLoading: (loading) => set({ loading }),
  setReportStartDate: (date) => set({ reportStartDate: date }),
  setReportEndDate: (date) => set({ reportEndDate: date }),
  setReportGroupBy: (groupBy) => set({ reportGroupBy: groupBy }),

  // Async actions
  fetchReport: async () => {
    const { reportType, reportStartDate, reportEndDate, reportGroupBy } = get()
    set({ loading: true })

    try {
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          startDate: reportStartDate,
          endDate: reportEndDate,
          groupBy: reportGroupBy,
        }),
      })

      if (!response.ok) throw new Error('Failed to fetch report')
      const data = await response.json()
      set({ reportData: data, loading: false })
    } catch (error) {
      console.error('Error fetching report:', error)
      set({ loading: false })
    }
  },

  exportReport: async (format) => {
    const { reportType, reportStartDate, reportEndDate } = get()
    set({ loading: true })

    try {
      const response = await fetch('/api/reports/gst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          startDate: reportStartDate,
          endDate: reportEndDate,
          format,
        }),
      })

      if (!response.ok) throw new Error('Failed to export report')

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportType}-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      set({ loading: false })
    } catch (error) {
      console.error('Error exporting report:', error)
      set({ loading: false })
    }
  },
}))
