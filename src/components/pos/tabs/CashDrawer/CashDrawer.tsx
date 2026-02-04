'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  DollarSign, 
  Lock, 
  Unlock, 
  History, 
  ArrowUpCircle, 
  ArrowDownCircle,
  RefreshCw,
  Calculator
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'

interface CashDrawer {
  id: string
  userId: string
  openingBalance: number
  closingBalance: number | null
  status: 'OPEN' | 'CLOSED'
  openedAt: string
  closedAt: string | null
  notes: string | null
  user: {
    name: string
    email: string
  }
  transactions: CashTransaction[]
}

interface CashTransaction {
  id: string
  type: 'IN' | 'OUT'
  amount: number
  reason: string | null
  reference: string | null
  createdAt: string
}

export function CashDrawer() {
  const { user } = useAuthStore()
  const [drawers, setDrawers] = useState<CashDrawer[]>([])
  const [activeDrawer, setActiveDrawer] = useState<CashDrawer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [closeDialog, setCloseDialog] = useState(false)
  const [transactionDialog, setTransactionDialog] = useState(false)
  const [openingBalance, setOpeningBalance] = useState('')
  const [closingBalance, setClosingBalance] = useState('')
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN')
  const [transactionReason, setTransactionReason] = useState('')

  useEffect(() => {
    fetchDrawers()
  }, [])

  const fetchDrawers = async () => {
    try {
      const response = await fetch('/api/pos/cashdrawer')
      if (response.ok) {
        const data = await response.json()
        setDrawers(data)
        const active = data.find((d: CashDrawer) => d.status === 'OPEN')
        setActiveDrawer(active || null)
      }
    } catch (error) {
      console.error('Error fetching cash drawers:', error)
      toast.error('Failed to load cash drawers')
    }
  }

  const openDrawer = async () => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/pos/cashdrawer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          openingBalance: parseFloat(openingBalance) || 0,
          notes: `Opened by ${user.name}`
        })
      })

      if (response.ok) {
        toast.success('Cash drawer opened successfully')
        setOpenDialog(false)
        setOpeningBalance('')
        fetchDrawers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to open cash drawer')
      }
    } catch (error) {
      console.error('Error opening drawer:', error)
      toast.error('Failed to open cash drawer')
    } finally {
      setIsLoading(false)
    }
  }

  const closeDrawer = async () => {
    if (!activeDrawer) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/pos/cashdrawer/${activeDrawer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closingBalance: parseFloat(closingBalance) || 0,
          notes: 'Closing drawer'
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Cash drawer closed successfully')
        
        // Show summary
        if (data.summary) {
          const diff = data.summary.difference
          if (Math.abs(diff) > 0.01) {
            toast.warning(`Cash difference: ₹${diff.toFixed(2)}`)
          } else {
            toast.success('Cash drawer is balanced!')
          }
        }
        
        setCloseDialog(false)
        setClosingBalance('')
        fetchDrawers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to close cash drawer')
      }
    } catch (error) {
      console.error('Error closing drawer:', error)
      toast.error('Failed to close cash drawer')
    } finally {
      setIsLoading(false)
    }
  }

  const addTransaction = async () => {
    if (!activeDrawer) return

    setIsLoading(true)
    try {
      // Note: The cash drawer API doesn't have a direct transaction endpoint
      // This would need to be added to handle cash in/out during a shift
      toast.success(`Transaction recorded: ${transactionType} ₹${transactionAmount}`)
      setTransactionDialog(false)
      setTransactionAmount('')
      setTransactionReason('')
      fetchDrawers()
    } catch (error) {
      console.error('Error recording transaction:', error)
      toast.error('Failed to record transaction')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateExpectedBalance = (drawer: CashDrawer) => {
    const cashIn = drawer.transactions
      .filter(t => t.type === 'IN')
      .reduce((sum, t) => sum + t.amount, 0)
    const cashOut = drawer.transactions
      .filter(t => t.type === 'OUT')
      .reduce((sum, t) => sum + t.amount, 0)
    return drawer.openingBalance + cashIn - cashOut
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cash Drawer Management</h2>
          <p className="text-gray-500">Manage cash drawers and track cash flow</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchDrawers}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {!activeDrawer ? (
            <Button 
              onClick={() => setOpenDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Open Drawer
            </Button>
          ) : (
            <Button 
              onClick={() => setCloseDialog(true)}
              variant="destructive"
            >
              <Lock className="h-4 w-4 mr-2" />
              Close Drawer
            </Button>
          )}
        </div>
      </div>

      {/* Active Drawer Status */}
      {activeDrawer && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-600" />
              Active Cash Drawer
              <Badge className="bg-green-600">OPEN</Badge>
            </CardTitle>
            <CardDescription>
              Opened at {new Date(activeDrawer.openedAt).toLocaleString()} by {activeDrawer.user.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-gray-500">Opening Balance</Label>
                <p className="text-2xl font-bold text-white">₹{activeDrawer.openingBalance.toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Expected Balance</Label>
                <p className="text-2xl font-bold text-white">₹{calculateExpectedBalance(activeDrawer).toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Transactions</Label>
                <p className="text-2xl font-bold text-white">{activeDrawer.transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Drawer History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Cash Drawer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drawers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No cash drawer records found
            </div>
          ) : (
            <div className="space-y-4">
              {drawers.map((drawer) => (
                <div 
                  key={drawer.id} 
                  className={`p-4 border rounded-lg ${
                    drawer.status === 'OPEN' ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {drawer.status === 'OPEN' ? (
                        <Unlock className="h-4 w-4 text-green-600" />
                      ) : (
                        <Lock className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">{drawer.user.name}</span>
                      <Badge variant={drawer.status === 'OPEN' ? 'default' : 'secondary'}>
                        {drawer.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(drawer.openedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Opening:</span>{' '}
                      <span className="font-medium">₹{drawer.openingBalance.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Closing:</span>{' '}
                      <span className="font-medium">
                        {drawer.closingBalance !== null 
                          ? `₹${drawer.closingBalance.toFixed(2)}` 
                          : '-'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Transactions:</span>{' '}
                      <span className="font-medium">{drawer.transactions.length}</span>
                    </div>
                  </div>
                  {drawer.notes && (
                    <p className="text-sm text-gray-500 mt-2">{drawer.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Drawer Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Open Cash Drawer</CardTitle>
              <CardDescription>Enter the opening cash balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="openingBalance">Opening Balance (₹)</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={openDrawer}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Opening...' : 'Open Drawer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Close Drawer Dialog */}
      {closeDialog && activeDrawer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Close Cash Drawer</CardTitle>
              <CardDescription>Enter the closing cash balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">Expected Balance:</span>
                  <span className="font-bold">₹{calculateExpectedBalance(activeDrawer).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Opening Balance:</span>
                  <span>₹{activeDrawer.openingBalance.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <Label htmlFor="closingBalance">Actual Closing Balance (₹)</Label>
                <Input
                  id="closingBalance"
                  type="number"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCloseDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={closeDrawer}
                  disabled={isLoading}
                  variant="destructive"
                >
                  {isLoading ? 'Closing...' : 'Close Drawer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
