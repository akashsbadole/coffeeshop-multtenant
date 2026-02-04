'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Receipt,
  Calendar,
  Search,
  Plus,
  MoreVertical,
  Download,
  FileText
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DueAmount {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  orderId: string
  orderNumber: string
  originalAmount: number
  paidAmount: number
  dueAmount: number
  partialPayments: Array<{
    id: string
    amount: number
    paymentMethod: string
    paidAt: string
    paidBy: string
    notes?: string
  }>
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WRITE_OFF'
  dueDate: string
  createdAt: string
  paidAt?: string
  writeOffReason?: string
}

interface PayLaterConfig {
  enabled: boolean
  maxDueAmount: number
  autoPaymentReminder: boolean
  reminderDays: number
  allowPartialPayments: boolean
  minPartialPayment: number
  requireApprovalForPartial: boolean
}

export function PayLaterTracking() {
  const [dueAmounts, setDueAmounts] = useState<DueAmount[]>([])
  const [filteredDueAmounts, setFilteredDueAmounts] = useState<DueAmount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDue, setSelectedDue] = useState<DueAmount | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [writeOffDialogOpen, setWriteOffDialogOpen] = useState(false)
  const [config, setConfig] = useState<PayLaterConfig>({
    enabled: true,
    maxDueAmount: 50000,
    autoPaymentReminder: true,
    reminderDays: 7,
    allowPartialPayments: true,
    minPartialPayment: 100,
    requireApprovalForPartial: false
  })

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [customerFilter, setCustomerFilter] = useState('')

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [paymentNotes, setPaymentNotes] = useState('')

  // Write off form
  const [writeOffReason, setWriteOffReason] = useState('')

  // Stats
  const [stats, setStats] = useState({
    totalDue: 0,
    totalPaid: 0,
    pendingCount: 0,
    overdueCount: 0,
    totalCustomers: 0
  })

  useEffect(() => {
    fetchDueAmounts()
    fetchConfig()
  }, [])

  useEffect(() => {
    filterDueAmounts()
  }, [dueAmounts, searchQuery, statusFilter, customerFilter])

  const fetchDueAmounts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/pay-later')
      if (response.ok) {
        const data = await response.json()
        setDueAmounts(data.dueAmounts || [])
        calculateStats(data.dueAmounts || [])
      }
    } catch (error) {
      console.error('Error fetching due amounts:', error)
      toast.error('Failed to load due amounts')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/pay-later/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config || config)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    }
  }

  const calculateStats = (dueAmounts: DueAmount[]) => {
    const totalDue = dueAmounts.reduce((sum, due) => sum + due.dueAmount, 0)
    const totalPaid = dueAmounts.reduce((sum, due) => sum + due.paidAmount, 0)
    const pendingCount = dueAmounts.filter(due => due.status === 'PENDING' || due.status === 'PARTIAL').length
    const overdueCount = dueAmounts.filter(due => due.status === 'OVERDUE').length
    const totalCustomers = new Set(dueAmounts.map(due => due.customerId)).size

    setStats({
      totalDue,
      totalPaid,
      pendingCount,
      overdueCount,
      totalCustomers
    })
  }

  const filterDueAmounts = () => {
    let filtered = [...dueAmounts]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(due =>
        due.customerName.toLowerCase().includes(query) ||
        due.customerPhone.includes(query) ||
        due.orderNumber.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(due => due.status === statusFilter)
    }

    // Customer filter
    if (customerFilter) {
      filtered = filtered.filter(due => due.customerName.includes(customerFilter))
    }

    setFilteredDueAmounts(filtered)
  }

  const handleRecordPayment = async () => {
    if (!selectedDue || paymentAmount <= 0) return

    try {
      const response = await fetch('/api/pay-later/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueId: selectedDue.id,
          amount: paymentAmount,
          paymentMethod,
          notes: paymentNotes
        })
      })

      if (response.ok) {
        toast.success('Payment recorded successfully')
        setPaymentDialogOpen(false)
        setSelectedDue(null)
        setPaymentAmount(0)
        setPaymentNotes('')
        fetchDueAmounts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to record payment')
      }
    } catch (error) {
      toast.error('Failed to record payment')
    }
  }

  const handleWriteOff = async () => {
    if (!selectedDue || !writeOffReason.trim()) return

    try {
      const response = await fetch('/api/pay-later/write-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueId: selectedDue.id,
          reason: writeOffReason
        })
      })

      if (response.ok) {
        toast.success('Due amount written off')
        setWriteOffDialogOpen(false)
        setSelectedDue(null)
        setWriteOffReason('')
        fetchDueAmounts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to write off')
      }
    } catch (error) {
      toast.error('Failed to write off')
    }
  }

  const handleSendReminder = async (dueId: string) => {
    try {
      const response = await fetch('/api/pay-later/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueId })
      })

      if (response.ok) {
        toast.success('Reminder sent successfully')
      }
    } catch (error) {
      toast.error('Failed to send reminder')
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      PARTIAL: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Wallet },
      PAID: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      OVERDUE: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
      WRITE_OFF: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle }
    }
    const { color, icon: Icon } = config[status as keyof typeof config] || config.PENDING
    return (
      <Badge variant="outline" className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pay Later Tracking</h2>
          <p className="text-gray-500">Manage customer dues and partial payments</p>
        </div>
        <Button onClick={() => {
          toast.success('Feature configured successfully')
        }}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Due</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.totalDue)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalPaid)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Dues</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.overdueCount}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Customers</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalCustomers}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by customer, phone, or order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="WRITE_OFF">Written Off</option>
              </select>
            </div>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Due Amounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Due Amounts List</CardTitle>
          <CardDescription>
            {filteredDueAmounts.length} record{filteredDueAmounts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredDueAmounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No due amounts found</p>
              <p className="text-sm mt-1">Adjust your filters to see more results</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {filteredDueAmounts.map((due) => (
                  <div
                    key={due.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedDue(due)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">{due.customerName}</h4>
                          {getStatusBadge(due.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" color="#fff" />
                            {due.customerPhone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Receipt className="h-4 w-4" color="#fff" />
                            Order #{due.orderNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" color="#fff" />
                            Due: {formatDate(due.dueDate)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-gray-500">Original Amount</p>
                            <p className="font-semibold">{formatCurrency(due.originalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Paid</p>
                            <p className="font-semibold text-green-600">{formatCurrency(due.paidAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Due</p>
                            <p className={`font-bold ${due.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(Math.abs(due.dueAmount))}
                            </p>
                          </div>
                        </div>

                        {due.partialPayments.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-gray-500 mb-2">Payment History ({due.partialPayments.length})</p>
                            <ScrollArea className="max-h-[100px]">
                              <div className="space-y-1">
                                {due.partialPayments.map((payment) => (
                                  <div key={payment.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                    <span>{formatDate(payment.paidAt)} - {payment.paymentMethod}</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(payment.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

                        {due.writeOffReason && (
                          <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded">
                            <p className="text-xs text-orange-600">Written off: {due.writeOffReason}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {due.status !== 'PAID' && due.status !== 'WRITE_OFF' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDue(due)
                              setPaymentDialogOpen(true)
                              setPaymentAmount(due.dueAmount)
                            }}
                          >
                            <Wallet className="h-4 w-4 mr-1" />
                            Record Payment
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" color="#fff" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSendReminder(due.id)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Send Reminder
                            </DropdownMenuItem>
                            {due.status !== 'WRITE_OFF' && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedDue(due)
                                setWriteOffDialogOpen(true)
                              }}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Write Off
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Receipt className="h-4 w-4 mr-2" />
                              Print Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedDue?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Original Amount:</span>
                <span className="font-semibold">{formatCurrency(selectedDue?.originalAmount || 0)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Already Paid:</span>
                <span className="font-semibold text-green-600">{formatCurrency(selectedDue?.paidAmount || 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between mt-2">
                <span className="text-sm font-semibold">Remaining Due:</span>
                <span className="font-bold text-red-600">{formatCurrency(selectedDue?.dueAmount || 0)}</span>
              </div>
            </div>

            <div>
              <Label>Payment Amount</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                max={selectedDue?.dueAmount}
                min={config.minPartialPayment}
              />
            </div>

            <div>
              <Label>Payment Method</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="WALLET">Wallet</option>
              </select>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Payment reference or notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={paymentAmount <= 0 || paymentAmount > (selectedDue?.dueAmount || 0)}
            >
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Write Off Dialog */}
      <Dialog open={writeOffDialogOpen} onOpenChange={setWriteOffDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Write Off Due Amount</DialogTitle>
            <DialogDescription>
              Mark this due amount as written off for {selectedDue?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm">
                <strong>Amount to be written off:</strong>{' '}
                {formatCurrency(selectedDue?.dueAmount || 0)}
              </p>
            </div>

            <div>
              <Label>Reason for Write Off *</Label>
              <textarea
                value={writeOffReason}
                onChange={(e) => setWriteOffReason(e.target.value)}
                placeholder="Explain why this amount is being written off..."
                rows={4}
                className="w-full px-3 py-2 border rounded-lg resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWriteOffDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleWriteOff}
              disabled={!writeOffReason.trim()}
            >
              Write Off Amount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}