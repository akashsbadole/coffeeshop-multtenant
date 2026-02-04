'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  FileText,
  Download,
  Printer,
  Loader2,
  Building2,
  User,
  Calendar,
  IndianRupee
} from 'lucide-react'

interface SalarySlip {
  slipId: string
  organization: {
    name: string
    address: string
    gstin: string
  }
  employee: {
    name: string
    email: string
    role: string
  }
  salaryPeriod: {
    start: string
    end: string
  }
  earnings: {
    basicSalary: { label: string; amount: number }
    regularHours: { label: string; amount: number; isHours?: boolean }
    overtime: { label: string; amount: number; isHours?: boolean }
    allowances: {
      label: string
      breakdown: Record<string, string>
      total: number
    }
    grossSalary: { label: string; amount: number; isBold?: boolean }
  }
  deductions: {
    providentFund: { label: string; amount: number }
    esi: { label: string; amount: number }
    tax: { label: string; amount: number }
    total: { label: string; amount: number; isBold?: boolean }
  }
  netSalary: {
    label: string
    amount: number
    inWords: string
  }
  paymentDetails: {
    paymentDate: string
    paymentMethod: string
    transactionId: string
  }
  generatedAt: string
  footer: string
}

interface SalarySlipViewerProps {
  paymentId?: string
  userId?: string
  onClose?: () => void
}

export function SalarySlipViewer({ paymentId, userId, onClose }: SalarySlipViewerProps) {
  const [slips, setSlips] = useState<SalarySlip[]>([])
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPrint, setShowPrint] = useState(false)

  useEffect(() => {
    fetchSalarySlips()
  }, [paymentId, userId])

  const fetchSalarySlips = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (paymentId) params.append('paymentId', paymentId)
      if (userId) params.append('userId', userId)

      const response = await fetch(`/api/salary/slip?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (Array.isArray(data)) {
          setSlips(data)
          if (data.length > 0) {
            setSelectedSlip(data[0])
          }
        } else {
          setSlips([data])
          setSelectedSlip(data)
        }
      } else {
        toast.error(data.error || 'Failed to load salary slips')
      }
    } catch (error) {
      toast.error('Failed to load salary slips')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    setShowPrint(true)
    setTimeout(() => {
      window.print()
      setShowPrint(false)
    }, 100)
  }

  const handleDownload = () => {
    if (!selectedSlip) return

    const content = `
SALARY SLIP
============

Slip ID: ${selectedSlip.slipId}
Generated: ${new Date(selectedSlip.generatedAt).toLocaleDateString()}

${'='.repeat(50)}
${selectedSlip.organization.name}
${selectedSlip.organization.address}
GSTIN: ${selectedSlip.organization.gstin}
${'='.repeat(50)}

Employee: ${selectedSlip.employee.name}
Email: ${selectedSlip.employee.email}
Role: ${selectedSlip.employee.role}

Period: ${selectedSlip.salaryPeriod.start} to ${selectedSlip.salaryPeriod.end}

${'='.repeat(50)}
EARNINGS
${'='.repeat(50)}
Basic Salary:    Rs. ${selectedSlip.earnings.basicSalary.amount.toFixed(2)}
Regular Hours:   ${selectedSlip.earnings.regularHours.amount} hrs
Overtime Hours: ${selectedSlip.earnings.overtime.amount} hrs
Allowances:      Rs. ${selectedSlip.earnings.allowances.total.toFixed(2)}
----------------------------------------
Gross Salary:    Rs. ${selectedSlip.earnings.grossSalary.amount.toFixed(2)}

${'='.repeat(50)}
DEDUCTIONS
${'='.repeat(50)}
Provident Fund:  Rs. ${selectedSlip.deductions.providentFund.amount.toFixed(2)}
ESI:             Rs. ${selectedSlip.deductions.esi.amount.toFixed(2)}
Tax Deduction:   Rs. ${selectedSlip.deductions.tax.amount.toFixed(2)}
----------------------------------------
Total Deductions: Rs. ${selectedSlip.deductions.total.amount.toFixed(2)}

${'='.repeat(50)}
NET SALARY: Rs. ${selectedSlip.netSalary.amount.toFixed(2)}
(In Words: ${selectedSlip.netSalary.inWords})

${'='.repeat(50)}
PAYMENT DETAILS
${'='.repeat(50)}
Payment Date:   ${selectedSlip.paymentDetails.paymentDate}
Payment Method: ${selectedSlip.paymentDetails.paymentMethod}
Transaction ID: ${selectedSlip.paymentDetails.transactionId}

${selectedSlip.footer}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Salary_Slip_${selectedSlip.slipId}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Salary slip downloaded')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-2 text-gray-500">Loading salary slips...</span>
      </div>
    )
  }

  if (slips.length === 0) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No salary slips found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select
          value={selectedSlip?.slipId || ''}
          onValueChange={(value) => setSelectedSlip(slips.find(s => s.slipId === value) || null)}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select salary slip" />
          </SelectTrigger>
          <SelectContent>
            {slips.map((slip) => (
              <SelectItem key={slip.slipId} value={slip.slipId}>
                {slip.salaryPeriod.start} - {slip.salaryPeriod.end}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {selectedSlip && (
        <div id="salary-slip" className="bg-white border rounded-lg p-8 max-w-3xl mx-auto print:border-0">
          <div className="text-center border-b pb-4 mb-4">
            <h1 className="text-xl font-bold text-gray-800">{selectedSlip.organization.name}</h1>
            <p className="text-sm text-gray-500">{selectedSlip.organization.address}</p>
            <p className="text-sm text-gray-500">GSTIN: {selectedSlip.organization.gstin}</p>
          </div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-700">SALARY SLIP</h2>
              <p className="text-sm text-gray-500">Slip ID: {selectedSlip.slipId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm"><span className="text-gray-500">Period:</span> {selectedSlip.salaryPeriod.start} - {selectedSlip.salaryPeriod.end}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Employee</p>
                <p className="font-medium">{selectedSlip.employee.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="font-medium">{selectedSlip.employee.role}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">EARNINGS</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{selectedSlip.earnings.basicSalary.label}</span>
                  <span>{selectedSlip.earnings.basicSalary.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{selectedSlip.earnings.regularHours.label} ({selectedSlip.earnings.regularHours.amount} hrs)</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{selectedSlip.earnings.overtime.label} ({selectedSlip.earnings.overtime.amount} hrs)</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span>{selectedSlip.earnings.allowances.label}</span>
                  <span>{selectedSlip.earnings.allowances.total.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>{selectedSlip.earnings.grossSalary.label}</span>
                  <span>{selectedSlip.earnings.grossSalary.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">DEDUCTIONS</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{selectedSlip.deductions.providentFund.label}</span>
                  <span>({selectedSlip.deductions.providentFund.amount.toFixed(2)})</span>
                </div>
                <div className="flex justify-between">
                  <span>{selectedSlip.deductions.esi.label}</span>
                  <span>({selectedSlip.deductions.esi.amount.toFixed(2)})</span>
                </div>
                <div className="flex justify-between">
                  <span>{selectedSlip.deductions.tax.label}</span>
                  <span>({selectedSlip.deductions.tax.amount.toFixed(2)})</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>{selectedSlip.deductions.total.label}</span>
                  <span>({selectedSlip.deductions.total.amount.toFixed(2)})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">{selectedSlip.netSalary.label}</p>
                <p className="text-2xl font-bold text-green-600">{selectedSlip.netSalary.amount.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedSlip.netSalary.inWords}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-gray-500">Payment Date</p>
                <p className="font-medium">{selectedSlip.paymentDetails.paymentDate}</p>
                <p className="text-gray-500 mt-2">Transaction ID</p>
                <p className="font-medium">{selectedSlip.paymentDetails.transactionId}</p>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 pt-4 border-t">
            <p>{selectedSlip.footer}</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface SalarySlipDialogProps {
  paymentId?: string
  userId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SalarySlipDialog({ paymentId, userId, open, onOpenChange }: SalarySlipDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Salary Slip
          </DialogTitle>
        </DialogHeader>
        <SalarySlipViewer paymentId={paymentId} userId={userId} />
      </DialogContent>
    </Dialog>
  )
}
