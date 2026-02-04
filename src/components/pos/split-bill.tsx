'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Split, 
  Plus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone,
  CheckCircle,
  Calculator,
  ArrowRight,
  Users
} from 'lucide-react'

interface SplitPayment {
  id: string
  method: 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING'
  amount: number
  reference?: string
  paid: boolean
}

interface SplitBillModalProps {
  isOpen: boolean
  onClose: () => void
  totalAmount: number
  orderId?: string
  onComplete: (splits: SplitPayment[]) => void
}

const paymentMethodIcons = {
  CASH: Banknote,
  UPI: Smartphone,
  CARD: CreditCard,
  NET_BANKING: CreditCard
}

const paymentMethodColors = {
  CASH: 'text-green-600',
  UPI: 'text-purple-600',
  CARD: 'text-blue-600',
  NET_BANKING: 'text-orange-600'
}

export function SplitBillModal({ 
  isOpen, 
  onClose, 
  totalAmount, 
  orderId,
  onComplete 
}: SplitBillModalProps) {
  const [splits, setSplits] = useState<SplitPayment[]>([])
  const [splitBy, setSplitBy] = useState<'amount' | 'people'>('amount')
  const [numberOfPeople, setNumberOfPeople] = useState(2)
  const [currentTab, setCurrentTab] = useState<'equal' | 'custom'>('equal')

  // Function to generate equal splits
  const generateEqualSplits = (count: number) => {
    const equalAmount = totalAmount / count
    return Array.from({ length: count }, (_, i) => ({
      id: `split-${i}`,
      method: 'CASH' as const,
      amount: i === count - 1 
        ? totalAmount - (equalAmount * (count - 1)) // Last person gets remainder
        : equalAmount,
      reference: '',
      paid: false
    }))
  }

  const handleEqualSplit = () => {
    const newSplits = generateEqualSplits(numberOfPeople)
    setSplits(newSplits)
    setCurrentTab('equal')
  }

  const handleCustomSplit = () => {
    setSplits([{
      id: 'split-0',
      method: 'CASH',
      amount: totalAmount,
      reference: '',
      paid: false
    }])
    setCurrentTab('custom')
  }

  const addSplit = () => {
    setSplits([...splits, {
      id: `split-${splits.length}`,
      method: 'CASH',
      amount: 0,
      reference: '',
      paid: false
    }])
  }

  const removeSplit = (id: string) => {
    if (splits.length <= 1) {
      toast.error('Must have at least one payment')
      return
    }
    setSplits(splits.filter(s => s.id !== id))
  }

  const updateSplit = (id: string, updates: Partial<SplitPayment>) => {
    setSplits(splits.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0)
  const remaining = totalAmount - totalSplit
  const allPaid = splits.every(s => s.paid)

  const handleComplete = () => {
    if (Math.abs(remaining) > 0.01) {
      toast.error(`Amounts don't match. Remaining: ₹${remaining.toFixed(2)}`)
      return
    }
    
    if (!allPaid) {
      toast.warning('Some payments are not marked as paid')
      return
    }

    onComplete(splits)
    toast.success('Split payment completed!')
    onClose()
  }

  const markPaid = (id: string) => {
    const split = splits.find(s => s.id === id)
    if (split) {
      updateSplit(id, { paid: !split.paid })
      toast.success(split.paid ? 'Payment marked as unpaid' : 'Payment marked as paid!')
    }
  }

  // Initialize splits when modal opens
  useEffect(() => {
    if (isOpen && splits.length === 0) {
      // Initialize with equal splits
      const initialSplits = generateEqualSplits(numberOfPeople)
      setSplits(initialSplits)
      setCurrentTab('equal')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-lg">
                <Split className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>Split Bill Payment</CardTitle>
                <CardDescription>
                  Total Amount: <strong className="text-lg">₹{totalAmount.toFixed(2)}</strong>
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Trash2 className="h-4 w-4" color="#fff" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Split Options */}
          <div className="flex gap-4 mb-6">
            <Button 
              variant={currentTab === 'equal' ? 'default' : 'outline'}
              onClick={() => {
                setCurrentTab('equal')
                handleEqualSplit()
              }}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Equal Split
            </Button>
            <Button 
              variant={currentTab === 'custom' ? 'default' : 'outline'}
              onClick={handleCustomSplit}
              className="flex-1"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Custom Amounts
            </Button>
          </div>

          {/* Number of People (for equal split) */}
          {currentTab === 'equal' && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Label>Number of People</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  type="number"
                  min={2}
                  max={20}
                  value={numberOfPeople}
                  onChange={(e) => {
                    setNumberOfPeople(parseInt(e.target.value) || 2)
                    handleEqualSplit()
                  }}
                  className="w-32"
                />
                <span className="text-gray-500">
                  Each pays: <strong>₹{(totalAmount / numberOfPeople).toFixed(2)}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Split Details */}
          <div className="space-y-3 max-h-[40vh] overflow-y-auto">
            {splits.map((split, index) => {
              const Icon = paymentMethodIcons[split.method]
              return (
                <div 
                  key={split.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    split.paid 
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 w-16">
                      Person {index + 1}
                    </span>
                    
                    {/* Amount Input */}
                    <div className="flex-1">
                      <Label className="text-xs">Amount (₹)</Label>
                      <Input
                        type="number"
                        value={split.amount}
                        onChange={(e) => updateSplit(split.id, { amount: parseFloat(e.target.value) || 0 })}
                        disabled={split.paid}
                        className="mt-1"
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="w-40">
                      <Label className="text-xs">Method</Label>
                      <select
                        value={split.method}
                        onChange={(e) => updateSplit(split.id, { method: e.target.value as any })}
                        disabled={split.paid}
                        className="w-full mt-1 p-2 border rounded-md text-sm bg-white dark:bg-gray-900"
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="NET_BANKING">Net Banking</option>
                      </select>
                    </div>

                    {/* Reference */}
                    <div className="flex-1">
                      <Label className="text-xs">Reference (Optional)</Label>
                      <Input
                        placeholder="Transaction ID"
                        value={split.reference}
                        onChange={(e) => updateSplit(split.id, { reference: e.target.value })}
                        disabled={split.paid}
                        className="mt-1"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={split.paid ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => markPaid(split.id)}
                        className={split.paid ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {split.paid ? 'Paid' : 'Mark Paid'}
                      </Button>
                      
                      {currentTab === 'custom' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSplit(split.id)}
                          disabled={splits.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Split Button (for custom mode) */}
          {currentTab === 'custom' && (
            <Button 
              variant="outline" 
              onClick={addSplit}
              className="w-full mt-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Payment
            </Button>
          )}

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span>Total Bill:</span>
              <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span>Total Split:</span>
              <span className="font-bold">₹{totalSplit.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
              <span>Remaining:</span>
              <span className={`font-bold ${Math.abs(remaining) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{remaining.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span>Payments Completed:</span>
              <Badge variant={allPaid ? 'default' : 'secondary'} className={allPaid ? 'bg-green-600' : ''}>
                {splits.filter(s => s.paid).length} / {splits.length}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={Math.abs(remaining) > 0.01 || !allPaid}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              Complete Split Payment
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
