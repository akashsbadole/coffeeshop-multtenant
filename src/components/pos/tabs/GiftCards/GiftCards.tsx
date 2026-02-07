'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Gift, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle, 
  CreditCard,
  RefreshCw,
  Trash2,
  Edit
} from 'lucide-react'

interface GiftCard {
  id: string
  cardNumber: string
  initialBalance: number
  currentBalance: number
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'USED'
  issuedAt: string
  expiresAt: string | null
  customerId: string | null
  customer: {
    name: string
    email: string
    phone: string
  } | null
  notes: string | null
}

export function GiftCards() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchNumber, setSearchNumber] = useState('')
  const [createDialog, setCreateDialog] = useState(false)
  const [checkBalanceDialog, setCheckBalanceDialog] = useState(false)
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  
  // Form states
  const [cardNumber, setCardNumber] = useState('')
  const [pin, setPin] = useState('')
  const [initialBalance, setInitialBalance] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [checkPin, setCheckPin] = useState('')
  const [deductAmount, setDeductAmount] = useState('')
  const [addAmount, setAddAmount] = useState('')

  useEffect(() => {
    fetchGiftCards()
  }, [])

  const fetchGiftCards = async () => {
    try {
      const response = await fetch('/api/pos/giftcards')
      if (response.ok) {
        const data = await response.json()
        setGiftCards(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching gift cards:', error)
      toast.error('Failed to load gift cards')
    }
  }

  const generateCardNumber = () => {
    // Generate a random 16-digit number
    const num = Math.floor(Math.random() * 9000000000000000) + 1000000000000000
    setCardNumber(num.toString())
  }

  const generatePin = () => {
    // Generate a random 4-digit PIN
    const pin = Math.floor(Math.random() * 9000) + 1000
    setPin(pin.toString())
  }

  const createGiftCard = async () => {
    if (!cardNumber || !pin || !initialBalance) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/pos/giftcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber,
          pin,
          initialBalance: parseFloat(initialBalance),
          expiryDate: expiryDate || null,
          notes: notes || null
        })
      })

      if (response.ok) {
        toast.success('Gift card created successfully')
        setCreateDialog(false)
        resetForm()
        fetchGiftCards()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create gift card')
      }
    } catch (error) {
      console.error('Error creating gift card:', error)
      toast.error('Failed to create gift card')
    } finally {
      setIsLoading(false)
    }
  }

  const checkBalance = async () => {
    if (!searchNumber) {
      toast.error('Please enter a card number')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/pos/giftcards?cardNumber=${searchNumber}`)
      const data = await response.json()

      if (data.found) {
        setSelectedCard(data.data)
        setCheckBalanceDialog(true)
      } else {
        toast.error('Gift card not found')
      }
    } catch (error) {
      console.error('Error checking gift card:', error)
      toast.error('Failed to check gift card')
    } finally {
      setIsLoading(false)
    }
  }

  const deductBalance = async () => {
    if (!selectedCard || !deductAmount || !checkPin) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/pos/giftcards/${selectedCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: checkPin,
          amount: parseFloat(deductAmount),
          action: 'deduct'
        })
      })

      if (response.ok) {
        toast.success(`₹${deductAmount} deducted from gift card`)
        setDeductAmount('')
        setCheckPin('')
        checkBalance()
        fetchGiftCards()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to deduct balance')
      }
    } catch (error) {
      console.error('Error deducting balance:', error)
      toast.error('Failed to deduct balance')
    } finally {
      setIsLoading(false)
    }
  }

  const addBalance = async () => {
    if (!selectedCard || !addAmount || !checkPin) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/pos/giftcards/${selectedCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: checkPin,
          amount: parseFloat(addAmount),
          action: 'add'
        })
      })

      if (response.ok) {
        toast.success(`₹${addAmount} added to gift card`)
        setAddAmount('')
        setCheckPin('')
        checkBalance()
        fetchGiftCards()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add balance')
      }
    } catch (error) {
      console.error('Error adding balance:', error)
      toast.error('Failed to add balance')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteGiftCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this gift card?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/pos/giftcards/${cardId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Gift card deleted')
        fetchGiftCards()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete gift card')
      }
    } catch (error) {
      console.error('Error deleting gift card:', error)
      toast.error('Failed to delete gift card')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setCardNumber('')
    setPin('')
    setInitialBalance('')
    setExpiryDate('')
    setNotes('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500'
      case 'INACTIVE': return 'bg-gray-500'
      case 'EXPIRED': return 'bg-red-500'
      case 'USED': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gift Cards</h2>
          <p className="text-black">Manage gift cards and check balances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchGiftCards}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialog(true)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Gift Card
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Check Gift Card Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter card number..."
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              className="flex-1"
            />
            <Button onClick={checkBalance} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Check
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gift Cards List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            All Gift Cards ({giftCards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {giftCards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No gift cards found</p>
              <p className="text-sm">Create a new gift card to get started</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {giftCards.map((card) => (
                <div 
                  key={card.id} 
                  className="p-4 border rounded-lg hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                        <span className="font-mono font-medium">{card.cardNumber}</span>
                        <Badge className={getStatusColor(card.status)}>
                          {card.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900">₹{card.currentBalance.toFixed(2)}</span>
                        {' / '}
                        <span>₹{card.initialBalance.toFixed(2)} initial</span>
                      </div>
                      {card.customer && (
                        <div className="text-sm text-gray-500">
                          Customer: {card.customer.name}
                        </div>
                      )}
                      {card.expiresAt && (
                        <div className="text-sm text-gray-500">
                          Expires: {new Date(card.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSearchNumber(card.cardNumber)
                          checkBalance()
                        }}
                      >
                        <Edit className="h-4 w-4" color="#fff" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteGiftCard(card.id)}
                        disabled={card.status === 'ACTIVE' && card.currentBalance > 0}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Gift Card Dialog */}
      {createDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Gift Card</CardTitle>
              <CardDescription>Enter gift card details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Card Number</Label>
                <div className="flex gap-2">
                  <Input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="16-digit number"
                  />
                  <Button variant="outline" onClick={generateCardNumber} type="button">
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label>PIN</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="4-digit PIN"
                  />
                  <Button variant="outline" onClick={generatePin} type="button">
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label>Initial Balance (₹)</Label>
                <Input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => {
                  setCreateDialog(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={createGiftCard}
                  disabled={isLoading}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isLoading ? 'Creating...' : 'Create Gift Card'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Check Balance / Manage Dialog */}
      {checkBalanceDialog && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Gift Card Details
              </CardTitle>
              <CardDescription>
                Card: {selectedCard.cardNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <div className="text-sm text-gray-500 mb-1">Current Balance</div>
                <div className="text-3xl font-bold text-amber-700">
                  ₹{selectedCard.currentBalance.toFixed(2)}
                </div>
                <Badge className={getStatusColor(selectedCard.status)}>
                  {selectedCard.status}
                </Badge>
              </div>

              {selectedCard.status === 'ACTIVE' && (
                <>
                  <div className="space-y-2">
                    <Label>Enter PIN to make changes</Label>
                    <Input
                      type="password"
                      value={checkPin}
                      onChange={(e) => setCheckPin(e.target.value)}
                      placeholder="4-digit PIN"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Add Balance (₹)</Label>
                      <Input
                        type="number"
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        placeholder="Amount"
                      />
                      <Button 
                        onClick={addBalance}
                        disabled={isLoading || !addAmount || !checkPin}
                        className="w-full"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Deduct (₹)</Label>
                      <Input
                        type="number"
                        value={deductAmount}
                        onChange={(e) => setDeductAmount(e.target.value)}
                        placeholder="Amount"
                      />
                      <Button 
                        onClick={deductBalance}
                        disabled={isLoading || !deductAmount || !checkPin}
                        variant="outline"
                        className="w-full"
                      >
                        Deduct
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => {
                  setCheckBalanceDialog(false)
                  setSelectedCard(null)
                  setCheckPin('')
                  setDeductAmount('')
                  setAddAmount('')
                }}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
