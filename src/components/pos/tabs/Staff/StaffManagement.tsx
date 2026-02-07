'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Calendar,
  Clock,
  IndianRupee,
  BarChart3,
  Award,
  MapPin,
  Phone,
  Mail,
  Key,
  Shield,
  Loader2,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  History,
  LogIn,
  LogOut,
  Calculator,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'

interface Staff {
  id: string
  name: string
  email: string
  phone?: string
  role: 'CASHIER' | 'MANAGER' | 'ADMIN'
  isActive: boolean
  createdAt: string
}

interface StaffPerformance {
  id: string
  userId: string
  userName: string
  date: string
  ordersProcessed: number
  totalSales: number
  averageOrderValue: number
  customerRating?: number
}

interface Shift {
  id: string
  userId: string
  userName: string
  name: string
  startTime: string
  endTime?: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  openingBalance?: number
  closingBalance?: number
  totalSales?: number
  cashSales?: number
  cardSales?: number
  upiSales?: number
}

interface Attendance {
  id: string
  userId: string
  userName: string
  date: string
  clockIn?: string
  clockOut?: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE'
  regularHours: number
  overtimeHours: number
}

interface StaffSalary {
  id: string
  userId: string
  userName: string
  basicSalary: number
  hourlyRate: number
  overtimeRate: number
  da: number
  hra: number
  transportAllowance: number
  medicalAllowance: number
  otherAllowances: number
  pfContribution: number
  esiContribution: number
  taxDeduction: number
  isActive: boolean
}

interface SalaryPayment {
  id: string
  userId: string
  userName: string
  periodStart: string
  periodEnd: string
  regularHours: number
  overtimeHours: number
  basicSalary: number
  allowances: number
  grossSalary: number
  deductions: number
  netSalary: number
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED'
  paymentDate?: string
}

interface PaymentApiKey {
  id: string
  provider: string
  apiKeyId: string
  isActive: boolean
  isTestMode: boolean
  webhookUrl?: string
  createdAt: string
}

interface AttendanceSummary {
  totalDays: number
  present: number
  absent: number
  late: number
  halfDay: number
  onLeave: number
  totalRegularHours: number
  totalOvertimeHours: number
}

export function StaffManagement() {
  const [isLoading, setIsLoading] = useState(true)
  const [staff, setStaff] = useState<Staff[]>([])
  const [performance, setPerformance] = useState<StaffPerformance[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [salaryProfiles, setSalaryProfiles] = useState<StaffSalary[]>([])
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([])
  const [paymentKeys, setPaymentKeys] = useState<PaymentApiKey[]>([])
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null)
  
  const [activeTab, setActiveTab] = useState('staff')
  
  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [editStaffOpen, setEditStaffOpen] = useState(false)
  const [addShiftOpen, setAddShiftOpen] = useState(false)
  const [attendanceOpen, setAttendanceOpen] = useState(false)
  const [salaryProfileOpen, setSalaryProfileOpen] = useState(false)
  const [salaryPaymentOpen, setSalaryPaymentOpen] = useState(false)
  const [paymentKeyOpen, setPaymentKeyOpen] = useState(false)
  const [calculateSalaryOpen, setCalculateSalaryOpen] = useState(false)
  
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedSalaryProfile, setSelectedSalaryProfile] = useState<StaffSalary | null>(null)
  
  const [showApiSecret, setShowApiSecret] = useState<string | null>(null)
  
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CASHIER' as 'CASHIER' | 'MANAGER' | 'ADMIN',
    password: ''
  })
  
  const [shiftForm, setShiftForm] = useState({
    userId: '',
    name: '',
    startTime: '',
    openingBalance: 0
  })
  
  const [salaryForm, setSalaryForm] = useState({
    userId: '',
    basicSalary: 0,
    hourlyRate: 0,
    overtimeRate: 0,
    da: 0,
    hra: 0,
    transportAllowance: 0,
    medicalAllowance: 0,
    otherAllowances: 0,
    pfContribution: 0,
    esiContribution: 0,
    taxDeduction: 0
  })
  
  const [salaryCalculation, setSalaryCalculation] = useState({
    periodStart: '',
    periodEnd: ''
  })
  
  const [salaryPaymentForm, setSalaryPaymentForm] = useState({
    userId: '',
    periodStart: '',
    periodEnd: '',
    paymentMethod: 'BANK_TRANSFER'
  })
  
  const [paymentKeyForm, setPaymentKeyForm] = useState({
    provider: '',
    apiKeyId: '',
    apiKeySecret: '',
    isTestMode: true,
    webhookUrl: ''
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setIsLoading(true)
      const [staffRes, performanceRes, shiftsRes, attendanceRes, salaryRes, paymentsRes, keysRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/staff/performance'),
        fetch('/api/shifts'),
        fetch('/api/attendance'),
        fetch('/api/salary?type=profile'),
        fetch('/api/salary?type=payments'),
        fetch('/api/payment-keys')
      ])

      if (staffRes.ok) setStaff(await staffRes.json())
      if (performanceRes.ok) {
        const data = await performanceRes.json()
        setPerformance(data.records || [])
      }
      if (shiftsRes.ok) setShifts(await shiftsRes.json())
      if (attendanceRes.ok) {
        const data = await attendanceRes.json()
        setAttendance(data.records || [])
        setAttendanceSummary(data.summary || null)
      }
      if (salaryRes.ok) {
        const data = await salaryRes.json()
        setSalaryProfiles(data.profiles || data || [])
      }
      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        setSalaryPayments(data || [])
      }
      if (keysRes.ok) setPaymentKeys(await keysRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddStaff = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm)
      })

      if (response.ok) {
        toast.success('Staff member added successfully')
        setAddStaffOpen(false)
        setStaffForm({ name: '', email: '', phone: '', role: 'CASHIER', password: '' })
        fetchAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add staff')
      }
    } catch (error) {
      console.error('Error adding staff:', error)
      toast.error('Failed to add staff')
    }
  }

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return
    try {
      const response = await fetch(`/api/users/${selectedStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm)
      })

      if (response.ok) {
        toast.success('Staff member updated successfully')
        setEditStaffOpen(false)
        setSelectedStaff(null)
        setStaffForm({ name: '', email: '', phone: '', role: 'CASHIER', password: '' })
        fetchAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update staff')
      }
    } catch (error) {
      console.error('Error updating staff:', error)
      toast.error('Failed to update staff')
    }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Staff member deleted successfully')
        fetchAllData()
      } else {
        toast.error('Failed to delete staff')
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast.error('Failed to delete staff')
    }
  }

  const handleAddShift = async () => {
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftForm)
      })

      if (response.ok) {
        toast.success('Shift created successfully')
        setAddShiftOpen(false)
        setShiftForm({ userId: '', name: '', startTime: '', openingBalance: 0 })
        fetchAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create shift')
      }
    } catch (error) {
      console.error('Error creating shift:', error)
      toast.error('Failed to create shift')
    }
  }

  const handleClockIn = async (userId: string) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'clockIn' })
      })
      const data = await response.json()
      if (response.ok) {
        toast.success(data.message)
        fetchAllData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Failed to clock in')
    }
  }

  const handleClockOut = async (userId: string) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'clockOut' })
      })
      const data = await response.json()
      if (response.ok) {
        toast.success(`Clocked out! Regular: ${data.hoursWorked?.regular}h, Overtime: ${data.hoursWorked?.overtime}h`)
        fetchAllData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Failed to clock out')
    }
  }

  const handleSaveSalaryProfile = async () => {
    try {
      const response = await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createProfile', ...salaryForm })
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Salary profile created successfully')
        setSalaryProfileOpen(false)
        setSalaryForm({ userId: '', basicSalary: 0, hourlyRate: 0, overtimeRate: 0, da: 0, hra: 0, transportAllowance: 0, medicalAllowance: 0, otherAllowances: 0, pfContribution: 0, esiContribution: 0, taxDeduction: 0 })
        fetchAllData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Failed to save salary profile')
    }
  }

  const handleUpdateSalaryProfile = async () => {
    if (!selectedSalaryProfile) return
    try {
      const response = await fetch('/api/salary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'profile', ...salaryForm })
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Salary profile updated successfully')
        setSalaryProfileOpen(false)
        setSelectedSalaryProfile(null)
        fetchAllData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Failed to update salary profile')
    }
  }

  const handleCalculateSalary = async () => {
    try {
      const response = await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calculate', ...salaryCalculation })
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Salary calculated successfully')
        return data.calculations
      } else {
        toast.error(data.error)
        return []
      }
    } catch (error) {
      toast.error('Failed to calculate salary')
      return []
    }
  }

  const handleProcessPayment = async () => {
    try {
      const response = await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'processPayment', ...salaryPaymentForm })
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Salary payment processed successfully')
        setSalaryPaymentOpen(false)
        setSalaryPaymentForm({ userId: '', periodStart: '', periodEnd: '', paymentMethod: 'BANK_TRANSFER' })
        fetchAllData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Failed to process payment')
    }
  }

  const handleSavePaymentKey = async () => {
    try {
      const response = await fetch('/api/payment-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentKeyForm)
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Payment API key saved successfully')
        setPaymentKeyOpen(false)
        setPaymentKeyForm({ provider: '', apiKeyId: '', apiKeySecret: '', isTestMode: true, webhookUrl: '' })
        fetchAllData()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Failed to save payment key')
    }
  }

  const handleTogglePaymentKey = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/payment-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive })
      })
      toast.success(`Payment key ${!isActive ? 'enabled' : 'disabled'}`)
      fetchAllData()
    } catch (error) {
      toast.error('Failed to update payment key')
    }
  }

  const handleDeletePaymentKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment API key?')) return
    try {
      await fetch(`/api/payment-keys?id=${id}`, { method: 'DELETE' })
      toast.success('Payment API key deleted')
      fetchAllData()
    } catch (error) {
      toast.error('Failed to delete payment key')
    }
  }

  const openEditDialog = (member: Staff) => {
    setSelectedStaff(member)
    setStaffForm({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      password: ''
    })
    setEditStaffOpen(true)
  }

  const openSalaryDialog = (profile?: StaffSalary) => {
    if (profile) {
      setSelectedSalaryProfile(profile)
      setSalaryForm({
        userId: profile.userId,
        basicSalary: profile.basicSalary,
        hourlyRate: profile.hourlyRate,
        overtimeRate: profile.overtimeRate,
        da: profile.da,
        hra: profile.hra,
        transportAllowance: profile.transportAllowance,
        medicalAllowance: profile.medicalAllowance,
        otherAllowances: profile.otherAllowances,
        pfContribution: profile.pfContribution,
        esiContribution: profile.esiContribution,
        taxDeduction: profile.taxDeduction
      })
    } else {
      setSelectedSalaryProfile(null)
      setSalaryForm({
        userId: '',
        basicSalary: 0,
        hourlyRate: 0,
        overtimeRate: 0,
        da: 0,
        hra: 0,
        transportAllowance: 0,
        medicalAllowance: 0,
        otherAllowances: 0,
        pfContribution: 0,
        esiContribution: 0,
        taxDeduction: 0
      })
    }
    setSalaryProfileOpen(true)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge className="bg-purple-600">ADMIN</Badge>
      case 'MANAGER': return <Badge className="bg-blue-600">MANAGER</Badge>
      default: return <Badge className="bg-green-600">CASHIER</Badge>
    }
  }

  const getShiftStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge className="bg-green-600">COMPLETED</Badge>
      case 'IN_PROGRESS': return <Badge className="bg-blue-600">IN PROGRESS</Badge>
      case 'CANCELLED': return <Badge className="bg-red-600">CANCELLED</Badge>
      default: return <Badge className="bg-amber-600">SCHEDULED</Badge>
    }
  }

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT': return <Badge className="bg-green-600">PRESENT</Badge>
      case 'ABSENT': return <Badge className="bg-red-600">ABSENT</Badge>
      case 'LATE': return <Badge className="bg-orange-500">LATE</Badge>
      case 'HALF_DAY': return <Badge className="bg-yellow-500">HALF DAY</Badge>
      case 'ON_LEAVE': return <Badge className="bg-blue-600">ON LEAVE</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge className="bg-green-600">PAID</Badge>
      case 'PROCESSING': return <Badge className="bg-blue-600">PROCESSING</Badge>
      case 'PENDING': return <Badge className="bg-yellow-500">PENDING</Badge>
      case 'FAILED': return <Badge className="bg-red-600">FAILED</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      razorpay: 'bg-blue-600',
      stripe: 'bg-purple-600',
      paytm: 'bg-orange-500',
      cashfree: 'bg-green-600',
      payu: 'bg-red-600',
      instamojo: 'bg-pink-600',
      ccavenue: 'bg-indigo-600'
    }
    return <Badge className={colors[provider] || 'bg-gray-600'}>{provider.toUpperCase()}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="ml-2 text-gray-500">Loading staff data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          <p className="text-gray-500 mt-1">Manage staff, attendance, shifts, salaries, and payment keys</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPaymentKeyOpen(true)} className="bg-linear-to-r from-green-500 to-green-600">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Keys
          </Button>
          <Button onClick={() => setCalculateSalaryOpen(true)} className="bg-linear-to-r from-purple-500 to-purple-600">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Salary
          </Button>
          <Button onClick={() => setSalaryPaymentOpen(true)} className="bg-linear-to-r from-indigo-500 to-indigo-600">
            <DollarSign className="h-4 w-4 mr-2" />
            Pay Salary
          </Button>
          <Button onClick={() => setAddShiftOpen(true)} className="bg-linear-to-r from-blue-500 to-blue-600">
            <Calendar className="h-4 w-4 mr-2" />
            New Shift
          </Button>
          <Button onClick={() => setAddStaffOpen(true)} className="bg-card">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-white shadow-lg p-1 rounded-xl border border-amber-200">
          <TabsTrigger value="staff" className="data-[state=active]:bg-linear-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-linear-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white">
            <Clock className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="shifts" className="data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Shifts
          </TabsTrigger>
          <TabsTrigger value="salary" className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <IndianRupee className="h-4 w-4 mr-2" />
            Salary
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-linear-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
            <DollarSign className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-linear-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Staff Members Tab */}
        <TabsContent value="staff">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-card text-white">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Staff Members ({staff.length})
              </CardTitle>
              <CardDescription className="text-amber-100">View and manage all staff members</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader className="bg-amber-50 sticky top-0">
                    <TableRow>
                      <TableHead className="font-semibold text-black">Name</TableHead>
                      <TableHead className="font-semibold text-black">Role</TableHead>
                      <TableHead className="font-semibold text-black">Contact</TableHead>
                      <TableHead className="font-semibold text-black">Status</TableHead>
                      <TableHead className="font-semibold text-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                          <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                          <p className="font-medium">No staff members yet</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      staff.map((member) => (
                        <TableRow key={member.id} className="hover:bg-amber-50/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="bg-amber-100 p-2 rounded-full">
                                <Users className="h-4 w-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(member.role)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {member.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-3 w-3 text-gray-400" />{member.phone}</div>}
                              <div className="flex items-center gap-2 text-sm"><Mail className="h-3 w-3 text-gray-400" />{member.email}</div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant={member.isActive ? 'default' : 'secondary'}>{member.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(member)} className="h-8 px-2 hover:bg-amber-50"><Edit className="h-3 w-3" /></Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteStaff(member.id)} className="h-8 px-2 hover:bg-red-50 text-red-600"><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-green-500 to-green-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Attendance Tracking
              </CardTitle>
              <CardDescription className="text-green-100">Track staff clock-in/clock-out and attendance</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {attendanceSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                  <Card className="border-2 border-green-200"><CardContent className="p-4 text-center">
                    <p className="text-[12px] text-gray-600">Present</p>
                    <p className="text-2xl font-bold text-green-600">{attendanceSummary.present}</p>
                  </CardContent></Card>
                  <Card className="border-2 border-red-200"><CardContent className="p-4 text-center">
                    <p className="text-[12px] text-gray-600">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{attendanceSummary.absent}</p>
                  </CardContent></Card>
                  <Card className="border-2 border-orange-200"><CardContent className="p-4 text-center">
                    <p className="text-[12px] text-gray-600">Late</p>
                    <p className="text-2xl font-bold text-orange-600">{attendanceSummary.late}</p>
                  </CardContent></Card>
                  <Card className="border-2 border-yellow-200"><CardContent className="p-4 text-center">
                    <p className="text-[12px] text-gray-600">Half Day</p>
                    <p className="text-2xl font-bold text-yellow-600">{attendanceSummary.halfDay}</p>
                  </CardContent></Card>
                  <Card className="border-2 border-blue-200"><CardContent className="p-4 text-center">
                    <p className="text-[12px] text-gray-600">On Leave</p>
                    <p className="text-2xl font-bold text-blue-600">{attendanceSummary.onLeave}</p>
                  </CardContent></Card>
                  <Card className="border-2 border-purple-200"><CardContent className="p-4 text-center">
                    <p className="text-[12px] text-gray-600">Regular Hours</p>
                    <p className="text-2xl font-bold text-purple-600">{attendanceSummary.totalRegularHours.toFixed(1)}</p>
                  </CardContent></Card>
                  <Card className="border-2 border-indigo-200"><CardContent className="p-4 text-center">
                    <p className="text-[12px] text-gray-600">Overtime</p>
                    <p className="text-2xl font-bold text-indigo-600">{attendanceSummary.totalOvertimeHours.toFixed(1)}</p>
                  </CardContent></Card>
                </div>
              )}
              
              <div className="flex gap-2 mb-4">
                {staff.map(member => (
                  <Button key={member.id} size="sm" variant="outline" className="flex items-center gap-2" onClick={() => handleClockIn(member.id)}>
                    <LogIn className="h-4 w-4" color="#fff" />{member.name}
                  </Button>
                ))}
              </div>

              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader className="bg-green-50 sticky top-0">
                    <TableRow>
                      <TableHead className="font-semibold text-black">Staff</TableHead>
                      <TableHead className="font-semibold text-black">Date</TableHead>
                      <TableHead className="font-semibold text-black">Clock In</TableHead>
                      <TableHead className="font-semibold text-black">Clock Out</TableHead>
                      <TableHead className="font-semibold text-black">Status</TableHead>
                      <TableHead className="font-semibold text-black">Regular Hrs</TableHead>
                      <TableHead className="font-semibold text-black">Overtime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-12 text-gray-500"><Clock className="h-16 w-16 mx-auto mb-4 opacity-20" /><p>No attendance records</p></TableCell></TableRow>
                    ) : (
                      attendance.map((record) => (
                        <TableRow key={record.id} className="hover:bg-green-50/50">
                          <TableCell className="font-medium">{record.userName}</TableCell>
                          <TableCell>{new Date(record.date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell>{record.clockIn ? new Date(record.clockIn).toLocaleTimeString('en-IN') : '-'}</TableCell>
                          <TableCell>{record.clockOut ? new Date(record.clockOut).toLocaleTimeString('en-IN') : '-'}</TableCell>
                          <TableCell>{getAttendanceStatusBadge(record.status)}</TableCell>
                          <TableCell>{record.regularHours.toFixed(2)}</TableCell>
                          <TableCell>{record.overtimeHours.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="flex items-center gap-2"><Clock className="h-6 w-6" />Shift Management ({shifts.length})</CardTitle>
              <CardDescription className="text-blue-100">Manage staff shifts and track opening/closing balances</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {shifts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No shifts scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shifts.map((shift) => (
                    <Card key={shift.id} className="border-2 border-blue-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="bg-blue-100 p-3 rounded-full"><Clock className="h-6 w-6 text-blue-600" /></div>
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">{shift.name}</h4>
                              <p className="text-sm text-gray-600 flex items-center gap-2"><Users className="h-4 w-4" color="#fff" />{shift.userName}</p>
                            </div>
                          </div>
                          {getShiftStatusBadge(shift.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-[12px] text-gray-600">Start Time</p>
                            <p className="font-semibold text-sm">{new Date(shift.startTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-[12px] text-gray-600">Opening</p>
                            <p className="font-bold text-green-600">₹{shift.openingBalance?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-[12px] text-gray-600">Total Sales</p>
                            <p className="font-bold text-purple-600">₹{shift.totalSales?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div className="bg-amber-50 p-3 rounded-lg">
                            <p className="text-[12px] text-gray-600">Closing</p>
                            <p className="font-bold text-amber-600">₹{shift.closingBalance?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-purple-500 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2"><IndianRupee className="h-6 w-6" />Salary Management</CardTitle>
              <CardDescription className="text-purple-100">Configure staff salary profiles and allowances</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-end mb-4">
                <Button onClick={() => openSalaryDialog()} className="bg-linear-to-r from-purple-500 to-purple-600"><Plus className="h-4 w-4 mr-2" />Add Salary Profile</Button>
              </div>
              <ScrollArea className="h-[500px]">
                {salaryProfiles.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <IndianRupee className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No salary profiles configured</p>
                    <p className="text-sm">Add salary profiles to enable salary calculations</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-purple-50 sticky top-0">
                      <TableRow>
                        <TableHead className="font-semibold text-black">Staff</TableHead>
                        <TableHead className="font-semibold text-black">Basic Salary</TableHead>
                        <TableHead className="font-semibold text-black">Hourly Rate</TableHead>
                        <TableHead className="font-semibold text-black">HRA</TableHead>
                        <TableHead className="font-semibold text-black">DA</TableHead>
                        <TableHead className="font-semibold text-black">PF %</TableHead>
                        <TableHead className="font-semibold text-black">ESI %</TableHead>
                        <TableHead className="font-semibold text-black">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryProfiles.map((profile) => (
                        <TableRow key={profile.id} className="hover:bg-purple-50/50">
                          <TableCell className="font-medium">{profile.userName}</TableCell>
                          <TableCell className="font-bold text-purple-600">₹{profile.basicSalary.toLocaleString()}</TableCell>
                          <TableCell>₹{profile.hourlyRate.toFixed(2)}</TableCell>
                          <TableCell>₹{profile.hra.toLocaleString()}</TableCell>
                          <TableCell>₹{profile.da.toLocaleString()}</TableCell>
                          <TableCell>{profile.pfContribution}%</TableCell>
                          <TableCell>{profile.esiContribution}%</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => openSalaryDialog(profile)} className="h-8 px-2"><Edit className="h-3 w-3" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-indigo-500 to-indigo-600 text-white">
              <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6" />Salary Payments</CardTitle>
              <CardDescription className="text-indigo-100">View and track salary payment history</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ScrollArea className="h-[500px]">
                {salaryPayments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No salary payments processed yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-indigo-50 sticky top-0">
                      <TableRow>
                        <TableHead className="font-semibold text-black">Staff</TableHead>
                        <TableHead className="font-semibold text-black">Period</TableHead>
                        <TableHead className="font-semibold text-black">Hours</TableHead>
                        <TableHead className="font-semibold text-black">Gross</TableHead>
                        <TableHead className="font-semibold text-black">Deductions</TableHead>
                        <TableHead className="font-semibold text-black">Net Salary</TableHead>
                        <TableHead className="font-semibold text-black">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryPayments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-indigo-50/50">
                          <TableCell className="font-medium">{payment.userName}</TableCell>
                          <TableCell className="text-sm">{new Date(payment.periodStart).toLocaleDateString('en-IN')} - {new Date(payment.periodEnd).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell><Badge className="bg-blue-100 text-blue-700">{payment.regularHours.toFixed(0)}/{payment.overtimeHours.toFixed(1)}</Badge></TableCell>
                          <TableCell className="font-bold text-green-600">₹{payment.grossSalary.toLocaleString()}</TableCell>
                          <TableCell className="text-red-600">-₹{payment.deductions.toLocaleString()}</TableCell>
                          <TableCell className="font-bold text-purple-600">₹{payment.netSalary.toLocaleString()}</TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-linear-to-r from-red-500 to-red-600 text-white">
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-6 w-6" />Staff Performance</CardTitle>
              <CardDescription className="text-red-100">Track sales, orders, and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="border-2 border-purple-200"><CardContent className="p-4 text-center">
                  <IndianRupee className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-[12px] text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-purple-600">₹{performance.reduce((sum, p) => sum + p.totalSales, 0).toLocaleString()}</p>
                </CardContent></Card>
                <Card className="border-2 border-blue-200"><CardContent className="p-4 text-center">
                  <BarChart3 className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                  <p className="text-[12px] text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600">{performance.reduce((sum, p) => sum + p.ordersProcessed, 0)}</p>
                </CardContent></Card>
                <Card className="border-2 border-green-200"><CardContent className="p-4 text-center">
                  <Award className="h-6 w-6 mx-auto text-green-600 mb-2" />
                  <p className="text-[12px] text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-green-600">₹{performance.length > 0 ? (performance.reduce((sum, p) => sum + p.totalSales, 0) / Math.max(performance.reduce((sum, p) => sum + p.ordersProcessed, 1))).toFixed(2) : '0'}</p>
                </CardContent></Card>
              </div>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader className="bg-red-50 sticky top-0">
                    <TableRow>
                      <TableHead className="font-semibold text-black">Staff Member</TableHead>
                      <TableHead className="font-semibold text-black">Date</TableHead>
                      <TableHead className="font-semibold text-black">Orders</TableHead>
                      <TableHead className="font-semibold text-black">Sales</TableHead>
                      <TableHead className="font-semibold text-black">Avg Order</TableHead>
                      <TableHead className="font-semibold text-black">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performance.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-500"><BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" /><p>No performance data</p></TableCell></TableRow>
                    ) : (
                      performance.map((perf) => (
                        <TableRow key={perf.id} className="hover:bg-red-50/50">
                          <TableCell className="font-medium">{perf.userName}</TableCell>
                          <TableCell className="text-sm">{new Date(perf.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</TableCell>
                          <TableCell><Badge className="bg-blue-100 text-blue-700">{perf.ordersProcessed}</Badge></TableCell>
                          <TableCell className="font-bold text-purple-600">₹{perf.totalSales.toFixed(2)}</TableCell>
                          <TableCell>₹{perf.averageOrderValue.toFixed(2)}</TableCell>
                          <TableCell>{perf.customerRating ? <div className="flex items-center gap-1"><Award className="h-4 w-4 text-amber-500" />{perf.customerRating}/5</div> : <span className="text-gray-400 text-sm">No rating</span>}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Staff Dialog */}
      <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-md">
          <DialogHeader className="bg-card text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2"><UserPlus className="h-6 w-6" />Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Full Name *</Label><Input placeholder="Enter full name" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" placeholder="Enter email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input placeholder="Enter phone" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Role *</Label><Select value={staffForm.role} onValueChange={(value: any) => setStaffForm({ ...staffForm, role: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CASHIER">CASHIER</SelectItem><SelectItem value="MANAGER">MANAGER</SelectItem><SelectItem value="ADMIN">ADMIN</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Password *</Label><Input type="password" placeholder="Enter password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} /></div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setAddStaffOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStaff} className="bg-card"><UserPlus className="h-4 w-4 mr-2" />Add Staff</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={editStaffOpen} onOpenChange={setEditStaffOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-md">
          <DialogHeader className="bg-card text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2"><Edit className="h-6 w-6" />Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Full Name *</Label><Input value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Role *</Label><Select value={staffForm.role} onValueChange={(value: any) => setStaffForm({ ...staffForm, role: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CASHIER">CASHIER</SelectItem><SelectItem value="MANAGER">MANAGER</SelectItem><SelectItem value="ADMIN">ADMIN</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditStaffOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStaff} className="bg-card"><Edit className="h-4 w-4 mr-2" />Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Shift Dialog */}
      <Dialog open={addShiftOpen} onOpenChange={setAddShiftOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-md">
          <DialogHeader className="bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6" />Create New Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Shift Name *</Label><Input placeholder="e.g., Morning Shift" value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Staff Member *</Label><Select value={shiftForm.userId} onValueChange={(value) => setShiftForm({ ...shiftForm, userId: value })}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staff.map(m => <SelectItem key={m.id} value={m.id}>{m.name} ({m.role})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Start Time *</Label><Input type="datetime-local" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })} /></div>
            <div className="space-y-2"><Label>Opening Balance (₹)</Label><Input type="number" step="0.01" value={shiftForm.openingBalance} onChange={(e) => setShiftForm({ ...shiftForm, openingBalance: parseFloat(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setAddShiftOpen(false)}>Cancel</Button>
            <Button onClick={handleAddShift} className="bg-linear-to-r from-blue-500 to-blue-600"><Calendar className="h-4 w-4 mr-2" />Create Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Profile Dialog */}
      <Dialog open={salaryProfileOpen} onOpenChange={setSalaryProfileOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2"><IndianRupee className="h-6 w-6" />{selectedSalaryProfile ? 'Edit' : 'Add'} Salary Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Staff Member *</Label><Select value={salaryForm.userId} onValueChange={(value) => setSalaryForm({ ...salaryForm, userId: value })} disabled={!!selectedSalaryProfile}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staff.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Basic Salary (₹)</Label><Input type="number" value={salaryForm.basicSalary} onChange={(e) => setSalaryForm({ ...salaryForm, basicSalary: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Hourly Rate (₹)</Label><Input type="number" step="0.01" value={salaryForm.hourlyRate} onChange={(e) => setSalaryForm({ ...salaryForm, hourlyRate: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Overtime Rate (₹)</Label><Input type="number" step="0.01" value={salaryForm.overtimeRate} onChange={(e) => setSalaryForm({ ...salaryForm, overtimeRate: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>HRA (₹)</Label><Input type="number" value={salaryForm.hra} onChange={(e) => setSalaryForm({ ...salaryForm, hra: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>DA (₹)</Label><Input type="number" value={salaryForm.da} onChange={(e) => setSalaryForm({ ...salaryForm, da: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Transport Allowance (₹)</Label><Input type="number" value={salaryForm.transportAllowance} onChange={(e) => setSalaryForm({ ...salaryForm, transportAllowance: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Medical Allowance (₹)</Label><Input type="number" value={salaryForm.medicalAllowance} onChange={(e) => setSalaryForm({ ...salaryForm, medicalAllowance: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Other Allowances (₹)</Label><Input type="number" value={salaryForm.otherAllowances} onChange={(e) => setSalaryForm({ ...salaryForm, otherAllowances: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>PF Contribution (%)</Label><Input type="number" step="0.1" value={salaryForm.pfContribution} onChange={(e) => setSalaryForm({ ...salaryForm, pfContribution: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>ESI Contribution (%)</Label><Input type="number" step="0.1" value={salaryForm.esiContribution} onChange={(e) => setSalaryForm({ ...salaryForm, esiContribution: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Tax Deduction (%)</Label><Input type="number" step="0.1" value={salaryForm.taxDeduction} onChange={(e) => setSalaryForm({ ...salaryForm, taxDeduction: parseFloat(e.target.value) || 0 })} /></div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setSalaryProfileOpen(false)}>Cancel</Button>
            <Button onClick={selectedSalaryProfile ? handleUpdateSalaryProfile : handleSaveSalaryProfile} className="bg-linear-to-r from-purple-500 to-purple-600"><IndianRupee className="h-4 w-4 mr-2" />{selectedSalaryProfile ? 'Update' : 'Save'} Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Payment Dialog */}
      <Dialog open={salaryPaymentOpen} onOpenChange={setSalaryPaymentOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-md">
          <DialogHeader className="bg-linear-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6" />Process Salary Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Staff Member *</Label><Select value={salaryPaymentForm.userId} onValueChange={(value) => setSalaryPaymentForm({ ...salaryPaymentForm, userId: value })}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staff.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Period Start *</Label><Input type="date" value={salaryPaymentForm.periodStart} onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, periodStart: e.target.value })} /></div>
            <div className="space-y-2"><Label>Period End *</Label><Input type="date" value={salaryPaymentForm.periodEnd} onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, periodEnd: e.target.value })} /></div>
            <div className="space-y-2"><Label>Payment Method *</Label><Select value={salaryPaymentForm.paymentMethod} onValueChange={(value) => setSalaryPaymentForm({ ...salaryPaymentForm, paymentMethod: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CASH">Cash</SelectItem><SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem><SelectItem value="CHEQUE">Cheque</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setSalaryPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handleProcessPayment} className="bg-linear-to-r from-indigo-500 to-indigo-600"><DollarSign className="h-4 w-4 mr-2" />Process Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment API Keys Dialog */}
      <Dialog open={paymentKeyOpen} onOpenChange={setPaymentKeyOpen}>
        <DialogContent className="border-0 shadow-2xl max-w-lg">
          <DialogHeader className="bg-linear-to-r from-green-500 to-green-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6" />Add Payment API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Payment Provider *</Label><Select value={paymentKeyForm.provider} onValueChange={(value) => setPaymentKeyForm({ ...paymentKeyForm, provider: value })}><SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger><SelectContent><SelectItem value="razorpay">Razorpay</SelectItem><SelectItem value="stripe">Stripe</SelectItem><SelectItem value="paytm">Paytm</SelectItem><SelectItem value="cashfree">Cashfree</SelectItem><SelectItem value="payu">PayU</SelectItem><SelectItem value="instamojo">Instamojo</SelectItem><SelectItem value="ccavenue">CCAvenue</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>API Key ID *</Label><Input placeholder="Enter API key ID" value={paymentKeyForm.apiKeyId} onChange={(e) => setPaymentKeyForm({ ...paymentKeyForm, apiKeyId: e.target.value })} /></div>
            <div className="space-y-2"><Label>API Secret Key *</Label><Input type="password" placeholder="Enter API secret" value={paymentKeyForm.apiKeySecret} onChange={(e) => setPaymentKeyForm({ ...paymentKeyForm, apiKeySecret: e.target.value })} /></div>
            <div className="space-y-2"><Label>Webhook URL (optional)</Label><Input placeholder="https://..." value={paymentKeyForm.webhookUrl} onChange={(e) => setPaymentKeyForm({ ...paymentKeyForm, webhookUrl: e.target.value })} /></div>
            <div className="flex items-center space-x-2"><Switch id="test-mode" checked={paymentKeyForm.isTestMode} onCheckedChange={(checked) => setPaymentKeyForm({ ...paymentKeyForm, isTestMode: checked })} /><Label htmlFor="test-mode">Test Mode</Label></div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setPaymentKeyOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePaymentKey} className="bg-linear-to-r from-green-500 to-green-600"><CreditCard className="h-4 w-4 mr-2" />Save API Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Keys List */}
      {paymentKeys.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="bg-linear-to-r from-green-500 to-green-600 text-white">
            <CardTitle className="flex items-center gap-2"><Key className="h-6 w-6" />Configured Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {paymentKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getProviderBadge(key.provider)}
                    <div>
                      <p className="font-medium">{key.apiKeyId}</p>
                      <p className="text-sm text-gray-500">{key.isTestMode ? 'Test Mode' : 'Live Mode'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={key.isActive ? 'default' : 'secondary'}>{key.isActive ? 'Active' : 'Inactive'}</Badge>
                    <Button size="sm" variant="outline" onClick={() => handleTogglePaymentKey(key.id, key.isActive)}>{key.isActive ? <XCircle className="h-4 w-4" color="#fff" /> : <CheckCircle className="h-4 w-4" color="#fff" />}</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeletePaymentKey(key.id)} className="text-red-600"><Trash2 className="h-4 w-4" color="#fff" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
