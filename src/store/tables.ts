import { create } from 'zustand'
import type { Table } from './types'

interface TablesState {
  // State
  tables: Table[]
  selectedTable: Table | null
  loading: boolean

  // Actions
  setTables: (tables: Table[]) => void
  setSelectedTable: (table: Table | null) => void
  setLoading: (loading: boolean) => void

  // Async actions
  fetchTables: () => Promise<void>
  createTable: (table: Omit<Table, 'id'>) => Promise<void>
  updateTable: (id: string, table: Partial<Table>) => Promise<void>
  deleteTable: (id: string) => Promise<void>
}

export const useTablesStore = create<TablesState>()((set, get) => ({
  // Initial state
  tables: [],
  selectedTable: null,
  loading: false,

  // Setters
  setTables: (tables) => set({ tables }),
  setSelectedTable: (table) => set({ selectedTable: table }),
  setLoading: (loading) => set({ loading }),

  // Async actions
  fetchTables: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/tables')
      if (!response.ok) throw new Error('Failed to fetch tables')
      const data = await response.json()
      set({ tables: data, loading: false })
    } catch (error) {
      console.error('Error fetching tables:', error)
      set({ loading: false })
    }
  },

  createTable: async (table) => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(table),
      })

      if (!response.ok) throw new Error('Failed to create table')
      const data = await response.json()
      set({ tables: [...get().tables, data], loading: false })
    } catch (error) {
      console.error('Error creating table:', error)
      set({ loading: false })
      throw error
    }
  },

  updateTable: async (id, table) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/pos/tables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(table),
      })

      if (!response.ok) throw new Error('Failed to update table')
      const data = await response.json()
      set({
        tables: get().tables.map(t => t.id === id ? data : t),
        loading: false,
      })
    } catch (error) {
      console.error('Error updating table:', error)
      set({ loading: false })
      throw error
    }
  },

  deleteTable: async (id) => {
    set({ loading: true })
    try {
      const response = await fetch(`/api/pos/tables/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete table')
      set({
        tables: get().tables.filter(t => t.id !== id),
        loading: false,
      })
    } catch (error) {
      console.error('Error deleting table:', error)
      set({ loading: false })
      throw error
    }
  },
}))
