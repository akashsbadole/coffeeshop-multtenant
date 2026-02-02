import { create } from 'zustand'
import type { MenuItem, Category } from './types'

interface MenuState {
  // State
  menuItems: MenuItem[]
  categories: Category[]
  selectedCategory: string
  searchQuery: string
  loading: boolean

  // Actions
  setMenuItems: (items: MenuItem[]) => void
  setCategories: (categories: Category[]) => void
  setSelectedCategory: (category: string) => void
  setSearchQuery: (query: string) => void
  setLoading: (loading: boolean) => void

  // Async actions
  fetchMenuItems: () => Promise<void>
  fetchCategories: () => Promise<void>

  // Computed
  getFilteredItems: () => MenuItem[]
}

export const useMenuStore = create<MenuState>()((set, get) => ({
  // Initial state
  menuItems: [],
  categories: [],
  selectedCategory: 'all',
  searchQuery: '',
  loading: false,

  // Setters
  setMenuItems: (items) => set({ menuItems: items }),
  setCategories: (categories) => set({ categories }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLoading: (loading) => set({ loading }),

  // Async actions
  fetchMenuItems: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/menu-items')
      if (!response.ok) throw new Error('Failed to fetch menu items')
      const data = await response.json()
      set({ menuItems: data, loading: false })
    } catch (error) {
      console.error('Error fetching menu items:', error)
      set({ loading: false })
    }
  },

  fetchCategories: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/pos/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      set({ categories: data, loading: false })
    } catch (error) {
      console.error('Error fetching categories:', error)
      set({ loading: false })
    }
  },

  // Computed
  getFilteredItems: () => {
    const { menuItems, selectedCategory, searchQuery } = get()

    return menuItems.filter((item) => {
      // Filter by category
      const categoryMatch =
        selectedCategory === 'all' || item.categoryId === selectedCategory

      // Filter by search query
      const searchMatch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()))

      return categoryMatch && searchMatch
    })
  },
}))
