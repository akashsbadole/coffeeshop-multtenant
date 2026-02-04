'use client'

import { useEffect, useCallback, useState } from 'react'
import { toast } from 'sonner'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  description: string
  action: () => void
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const [showHelp, setShowHelp] = useState(false)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in input fields
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      return
    }

    // Check for help shortcut (Ctrl + /)
    if (event.ctrlKey && event.key === '/') {
      event.preventDefault()
      setShowHelp(true)
      return
    }

    // Find matching shortcut
    const shortcut = shortcuts.find(s => {
      const keyMatch = event.key.toLowerCase() === s.key.toLowerCase()
      const ctrlMatch = !!s.ctrl === event.ctrlKey
      const altMatch = !!s.alt === event.altKey
      const shiftMatch = !!s.shift === event.shiftKey
      
      return keyMatch && ctrlMatch && altMatch && shiftMatch
    })

    if (shortcut) {
      event.preventDefault()
      shortcut.action()
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])

  return { showHelp, setShowHelp }
}

// Common POS shortcuts
export const posShortcuts = {
  addToCart: (callback: () => void): KeyboardShortcut => ({
    key: '+',
    description: 'Add item to cart',
    action: callback
  }),
  
  removeFromCart: (callback: () => void): KeyboardShortcut => ({
    key: '-',
    description: 'Remove item from cart',
    action: callback
  }),
  
  clearCart: (callback: () => void): KeyboardShortcut => ({
    key: 'Delete',
    ctrl: true,
    description: 'Clear cart',
    action: () => {
      if (confirm('Clear all items from cart?')) {
        callback()
      }
    }
  }),
  
  checkout: (callback: () => void): KeyboardShortcut => ({
    key: 'Enter',
    ctrl: true,
    description: 'Proceed to checkout',
    action: callback
  }),
  
  holdOrder: (callback: () => void): KeyboardShortcut => ({
    key: 'h',
    ctrl: true,
    description: 'Hold/Park order',
    action: callback
  }),
  
  recallOrder: (callback: () => void): KeyboardShortcut => ({
    key: 'r',
    ctrl: true,
    description: 'Recall held order',
    action: callback
  }),
  
  applyDiscount: (callback: () => void): KeyboardShortcut => ({
    key: 'd',
    ctrl: true,
    description: 'Apply discount',
    action: callback
  }),
  
  searchProduct: (callback: () => void): KeyboardShortcut => ({
    key: 'f',
    ctrl: true,
    description: 'Search product',
    action: callback
  }),
  
  printReceipt: (callback: () => void): KeyboardShortcut => ({
    key: 'p',
    ctrl: true,
    description: 'Print receipt',
    action: callback
  }),
  
  openCashDrawer: (callback: () => void): KeyboardShortcut => ({
    key: 'c',
    ctrl: true,
    alt: true,
    description: 'Open cash drawer',
    action: callback
  }),
  
  logout: (callback: () => void): KeyboardShortcut => ({
    key: 'l',
    ctrl: true,
    shift: true,
    description: 'Logout',
    action: () => {
      if (confirm('Are you sure you want to logout?')) {
        callback()
      }
    }
  }),
  
  toggleHelp: (): KeyboardShortcut => ({
    key: '/',
    ctrl: true,
    description: 'Show keyboard shortcuts',
    action: () => {}
  }),

  // Number pad shortcuts
  numpad1: (callback: () => void) => ({ key: '1', description: 'Quick add item 1', action: callback }),
  numpad2: (callback: () => void) => ({ key: '2', description: 'Quick add item 2', action: callback }),
  numpad3: (callback: () => void) => ({ key: '3', description: 'Quick add item 3', action: callback }),
  numpad4: (callback: () => void) => ({ key: '4', description: 'Quick add item 4', action: callback }),
  numpad5: (callback: () => void) => ({ key: '5', description: 'Quick add item 5', action: callback }),
}
