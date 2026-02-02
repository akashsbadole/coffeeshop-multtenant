import { create } from 'zustand'
import type { MenuItem } from './types'

interface BarcodeState {
  // State
  barcodeInput: string
  barcodeProduct: MenuItem | null
  scanning: boolean

  // Actions
  setBarcodeInput: (input: string) => void
  setBarcodeProduct: (product: MenuItem | null) => void
  setScanning: (scanning: boolean) => void

  // Async actions
  scanBarcode: (barcode: string) => Promise<void>
  clearScan: () => void
}

export const useBarcodeStore = create<BarcodeState>()((set, get) => ({
  // Initial state
  barcodeInput: '',
  barcodeProduct: null,
  scanning: false,

  // Setters
  setBarcodeInput: (input) => set({ barcodeInput: input }),
  setBarcodeProduct: (product) => set({ barcodeProduct: product }),
  setScanning: (scanning) => set({ scanning }),

  // Async actions
  scanBarcode: async (barcode) => {
    set({ scanning: true, barcodeInput: barcode })
    try {
      const response = await fetch('/api/pos/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
      })

      if (!response.ok) throw new Error('Product not found')
      const data = await response.json()
      set({ barcodeProduct: data, scanning: false })
    } catch (error) {
      console.error('Error scanning barcode:', error)
      set({ barcodeProduct: null, scanning: false })
      throw error
    }
  },

  clearScan: () => {
    set({
      barcodeInput: '',
      barcodeProduct: null,
      scanning: false,
    })
  },
}))
