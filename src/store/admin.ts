import { create } from 'zustand'
import type { MenuItem, Category, InventoryItem, User } from './types'

interface AdminState {
  // State
  menuItems: MenuItem[]
  categories: Category[]
  menuLoading: boolean
  inventory: InventoryItem[]
  inventoryLoading: boolean
  users: User[]
  usersLoading: boolean
  menuDialogOpen: boolean
  inventoryDialogOpen: boolean
  userDialogOpen: boolean

  // Actions
  setMenuItems: (items: MenuItem[]) => void
  setCategories: (categories: Category[]) => void
  setMenuLoading: (loading: boolean) => void
  setInventory: (inventory: InventoryItem[]) => void
  setInventoryLoading: (loading: boolean) => void
  setUsers: (users: User[]) => void
  setUsersLoading: (loading: boolean) => void
  setMenuDialogOpen: (open: boolean) => void
  setInventoryDialogOpen: (open: boolean) => void
  setUserDialogOpen: (open: boolean) => void

  // Async actions - Menu
  fetchMenuItems: () => Promise<void>
  fetchCategories: () => Promise<void>
  createMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>
  updateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<void>
  deleteMenuItem: (id: string) => Promise<void>
  toggleMenuItemAvailability: (id: string) => Promise<void>

  // Async actions - Inventory
  fetchInventory: () => Promise<void>
  updateInventory: (id: string, data: Partial<InventoryItem>) => Promise<void>
  quickAdjustment: (id: string, quantity: number, reason: string) => Promise<void>

  // Async actions - Users
  fetchUsers: () => Promise<void>
  createUser: (user: Omit<User, 'id'>) => Promise<void>
  updateUser: (id: string, user: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  // Initial state
  menuItems: [],
  categories: [],
  menuLoading: false,
  inventory: [],
  inventoryLoading: false,
  users: [],
  usersLoading: false,
  menuDialogOpen: false,
  inventoryDialogOpen: false,
  userDialogOpen: false,

  // Setters
  setMenuItems: (items) => set({ menuItems: items }),
  setCategories: (categories) => set({ categories }),
  setMenuLoading: (loading) => set({ menuLoading: loading }),
  setInventory: (inventory) => set({ inventory }),
  setInventoryLoading: (loading) => set({ inventoryLoading: loading }),
  setUsers: (users) => set({ users }),
  setUsersLoading: (loading) => set({ usersLoading: loading }),
  setMenuDialogOpen: (open) => set({ menuDialogOpen: open }),
  setInventoryDialogOpen: (open) => set({ inventoryDialogOpen: open }),
  setUserDialogOpen: (open) => set({ userDialogOpen: open }),

  // Async actions - Menu
  fetchMenuItems: async () => {
    set({ menuLoading: true })
    try {
      const response = await fetch('/api/pos/menu-items')
      if (!response.ok) throw new Error('Failed to fetch menu items')
      const data = await response.json()
      set({ menuItems: data, menuLoading: false })
    } catch (error) {
      console.error('Error fetching menu items:', error)
      set({ menuLoading: false })
    }
  },

  fetchCategories: async () => {
    set({ menuLoading: true })
    try {
      const response = await fetch('/api/pos/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      set({ categories: data, menuLoading: false })
    } catch (error) {
      console.error('Error fetching categories:', error)
      set({ menuLoading: false })
    }
  },

  createMenuItem: async (item) => {
    set({ menuLoading: true })
    try {
      const response = await fetch('/api/pos/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })

      if (!response.ok) throw new Error('Failed to create menu item')
      const data = await response.json()
      set({ menuItems: [...get().menuItems, data], menuLoading: false })
    } catch (error) {
      console.error('Error creating menu item:', error)
      set({ menuLoading: false })
      throw error
    }
  },

  updateMenuItem: async (id, item) => {
    set({ menuLoading: true })
    try {
      const response = await fetch(`/api/pos/menu-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })

      if (!response.ok) throw new Error('Failed to update menu item')
      const data = await response.json()
      set({
        menuItems: get().menuItems.map(i => i.id === id ? data : i),
        menuLoading: false,
      })
    } catch (error) {
      console.error('Error updating menu item:', error)
      set({ menuLoading: false })
      throw error
    }
  },

  deleteMenuItem: async (id) => {
    set({ menuLoading: true })
    try {
      const response = await fetch(`/api/pos/menu-items/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete menu item')
      set({
        menuItems: get().menuItems.filter(i => i.id !== id),
        menuLoading: false,
      })
    } catch (error) {
      console.error('Error deleting menu item:', error)
      set({ menuLoading: false })
      throw error
    }
  },

  toggleMenuItemAvailability: async (id) => {
    const item = get().menuItems.find(i => i.id === id)
    if (!item) return

    set({ menuLoading: true })
    try {
      const response = await fetch(`/api/pos/menu-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      })

      if (!response.ok) throw new Error('Failed to toggle availability')
      const data = await response.json()
      set({
        menuItems: get().menuItems.map(i => i.id === id ? data : i),
        menuLoading: false,
      })
    } catch (error) {
      console.error('Error toggling availability:', error)
      set({ menuLoading: false })
      throw error
    }
  },

  // Async actions - Inventory
  fetchInventory: async () => {
    set({ inventoryLoading: true })
    try {
      const response = await fetch('/api/inventory')
      if (!response.ok) throw new Error('Failed to fetch inventory')
      const data = await response.json()
      set({ inventory: data, inventoryLoading: false })
    } catch (error) {
      console.error('Error fetching inventory:', error)
      set({ inventoryLoading: false })
    }
  },

  updateInventory: async (id, data) => {
    set({ inventoryLoading: true })
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to update inventory')
      const updatedData = await response.json()
      set({
        inventory: get().inventory.map(i => i.id === id ? updatedData : i),
        inventoryLoading: false,
      })
    } catch (error) {
      console.error('Error updating inventory:', error)
      set({ inventoryLoading: false })
      throw error
    }
  },

  quickAdjustment: async (id, quantity, reason) => {
    set({ inventoryLoading: true })
    try {
      const response = await fetch(`/api/inventory/${id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, reason }),
      })

      if (!response.ok) throw new Error('Failed to adjust inventory')
      const data = await response.json()
      set({
        inventory: get().inventory.map(i => i.id === id ? data : i),
        inventoryLoading: false,
      })
    } catch (error) {
      console.error('Error adjusting inventory:', error)
      set({ inventoryLoading: false })
      throw error
    }
  },

  // Async actions - Users
  fetchUsers: async () => {
    set({ usersLoading: true })
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      set({ users: data, usersLoading: false })
    } catch (error) {
      console.error('Error fetching users:', error)
      set({ usersLoading: false })
    }
  },

  createUser: async (user) => {
    set({ usersLoading: true })
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })

      if (!response.ok) throw new Error('Failed to create user')
      const data = await response.json()
      set({ users: [...get().users, data], usersLoading: false })
    } catch (error) {
      console.error('Error creating user:', error)
      set({ usersLoading: false })
      throw error
    }
  },

  updateUser: async (id, user) => {
    set({ usersLoading: true })
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })

      if (!response.ok) throw new Error('Failed to update user')
      const data = await response.json()
      set({
        users: get().users.map(u => u.id === id ? data : u),
        usersLoading: false,
      })
    } catch (error) {
      console.error('Error updating user:', error)
      set({ usersLoading: false })
      throw error
    }
  },

  deleteUser: async (id) => {
    set({ usersLoading: true })
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete user')
      set({
        users: get().users.filter(u => u.id !== id),
        usersLoading: false,
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      set({ usersLoading: false })
      throw error
    }
  },
}))
