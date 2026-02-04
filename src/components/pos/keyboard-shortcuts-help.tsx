'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { KeyboardShortcut } from '@/hooks/use-keyboard-shortcuts'
import { Keyboard } from 'lucide-react'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: KeyboardShortcut[]
}

export function KeyboardShortcutsHelp({ isOpen, onClose, shortcuts }: KeyboardShortcutsHelpProps) {
  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts: string[] = []
    if (shortcut.ctrl) parts.push('Ctrl')
    if (shortcut.alt) parts.push('Alt')
    if (shortcut.shift) parts.push('Shift')
    parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key)
    return parts.join(' + ')
  }

  function getCategory(shortcut: KeyboardShortcut): string {
    const desc = shortcut.description.toLowerCase()
    if (desc.includes('cart') || desc.includes('add') || desc.includes('remove')) return 'Cart Operations'
    if (desc.includes('checkout') || desc.includes('payment')) return 'Payment'
    if (desc.includes('order') || desc.includes('hold') || desc.includes('recall')) return 'Orders'
    if (desc.includes('search')) return 'Search'
    if (desc.includes('print') || desc.includes('receipt')) return 'Receipts'
    if (desc.includes('logout') || desc.includes('drawer')) return 'System'
    return 'General'
  }

  // Group shortcuts by category
  const groupedShortcuts: Record<string, KeyboardShortcut[]> = {}
  shortcuts.forEach(shortcut => {
    const category = getCategory(shortcut)
    if (!groupedShortcuts[category]) {
      groupedShortcuts[category] = []
    }
    groupedShortcuts[category].push(shortcut)
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to speed up your workflow
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((shortcut, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded text-xs font-mono font-medium text-gray-900 dark:text-gray-100 shadow-sm">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm text-amber-800 dark:text-amber-200">
          <strong>Tip:</strong> Press <kbd className="px-1 bg-white dark:bg-gray-800 rounded">Ctrl</kbd> + <kbd className="px-1 bg-white dark:bg-gray-800 rounded">/</kbd> anytime to show this help dialog.
        </div>
      </DialogContent>
    </Dialog>
  )
}
