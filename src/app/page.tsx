'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { MenuManagement } from '@/components/admin/menu-management'
import { InventoryManagement } from '@/components/admin/inventory-management'
import { Tables } from '@/components/pos/tabs/Tables/Tables'
import { KDS } from '@/components/pos/tabs/KDS/KDS'
import { ProductVariants } from '@/components/pos/tabs/Variants/Variants'
import { BarcodeScanner } from '@/components/pos/tabs/Barcode/BarcodeScanner'
import { Returns } from '@/components/pos/tabs/Returns/Returns'
import { POSInventory } from '@/components/pos/tabs/Inventory/Inventory'
import { Settings } from '@/components/pos/tabs/Settings/Settings'
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Smartphone,
  Banknote,
  Receipt,
  Coffee,
  Utensils,
  Cake,
  IceCream2,
  Settings as SettingsIcon,
  BarChart3,
  Package,
  Users,
  LogOut,
  User,
  TrendingUp,
  IndianRupee,
  Calendar,
  Printer,
  Clock,
  Pause,
  RotateCw,
  X,
  Brain,
  Mail,
  MessageSquare,
  Download,
  FileText,
  PieChart,
  Upload,
  Store,
  LayoutGrid,
  Armchair,
  ScanBarcode,
  Tag,
  RotateCcw,
  Wallet,
  Key,
  Shield
} from 'lucide-react'
import {
  useAuthStore,
  useMenuStore,
  useCartStore,
  useOrdersStore,
  useCheckoutStore,
  useUIStore,
  usePOSConfigStore,
  useReportsStore,
  useReceiptsStore,
  useTablesStore,
  useVariantsStore,
  useBarcodeStore,
  useReturnsStore,
  useCashDrawerStore,
  useGiftCardsStore,
  useProfileStore,
  useAIInsightsStore
} from '@/store'

import { selectSubtotal, selectTotalGst, selectTotal } from '@/store/cart'
import Link from 'next/link'

interface DashboardProps {
  user: any
  setUser: (user: any) => void
  onLogout: () => void
}

export function POSDashboard({ user, setUser, onLogout }: DashboardProps) {
  // Menu Store
  const {
    menuItems, setMenuItems,
    categories, setCategories,
    selectedCategory, setSelectedCategory,
    searchQuery, setSearchQuery
  } = useMenuStore()

  // Cart Store
  const {
    cart, setCart, addToCart, updateQuantity, removeFromCart, clearCart
  } = useCartStore()

  // Orders Store
  const {
    orders, setOrders,
    heldOrders, setHeldOrders,
    heldOrdersOpen, setHeldOrdersOpen
  } = useOrdersStore()

  // Checkout Store
  const {
    checkoutOpen, setCheckoutOpen,
    paymentMethod, setPaymentMethod,
    customerPhone, setCustomerPhone,
    customerName, setCustomerName,
    notes, setNotes
  } = useCheckoutStore()

  // UI Store
  const { activeTab, setActiveTab } = useUIStore()

  // POS Config Store
  const {
    posConfig, setPosConfig,
    loading: posConfigLoading,
    setLoading: setPosConfigLoading
  } = usePOSConfigStore()

  // AI Insights Store
  const {
    aiInsights, setAiInsights,
    loading: aiInsightsLoading,
    setLoading: setAiInsightsLoading
  } = useAIInsightsStore()

  // Reports Store
  const {
    reportType, setReportType,
    reportData, setReportData,
    loading: reportLoading,
    setLoading: setReportLoading,
    reportStartDate, setReportStartDate,
    reportEndDate, setReportEndDate,
    reportGroupBy, setReportGroupBy
  } = useReportsStore()

  // Receipts Store
  const {
    receiptDialogOpen, setReceiptDialogOpen,
    selectedOrderForReceipt, setSelectedOrderForReceipt,
    sendWhatsAppDialogOpen, setSendWhatsAppDialogOpen,
    sendEmailDialogOpen, setSendEmailDialogOpen,
    receiptPhone, setReceiptPhone,
    receiptEmail, setReceiptEmail
  } = useReceiptsStore()

  // Tables Store
  const {
    tables, setTables,
    selectedTable, setSelectedTable
  } = useTablesStore()

  // Variants Store
  const {
    selectedVariant, setSelectedVariant
  } = useVariantsStore()

  // Barcode Store
  const {
    barcodeInput, setBarcodeInput,
    barcodeProduct, setBarcodeProduct
  } = useBarcodeStore()

  // Returns Store
  const {
    returns, setReturns
  } = useReturnsStore()

  // Cash Drawer Store
  const {
    cashDrawer, setCashDrawer
  } = useCashDrawerStore()

  // Gift Cards Store
  const {
    giftCards, setGiftCards,
    giftCardLookup, setGiftCardLookup,
    giftCardBalance, setGiftCardBalance
  } = useGiftCardsStore()

  // Profile Store
  const {
    profileDialogOpen, setProfileDialogOpen,
    profileData, setProfileData,
    passwordDialogOpen, setPasswordDialogOpen,
    passwordData, setPasswordData,
    profileLoading, setProfileLoading,
    passwordLoading, setPasswordLoading
  } = useProfileStore()

  // Cart Store computed values (using selector functions)
  const subtotal = useCartStore(selectSubtotal)
  const totalGst = useCartStore(selectTotalGst)
  const total = useCartStore(selectTotal)

  // Fetch menu items, categories, and orders
  useEffect(() => {
    fetchData()
    fetchPOSConfig()
  }, [])

  const fetchPOSConfig = async () => {
    try {
      setPosConfigLoading(true)
      const response = await fetch('/api/pos/config')
      if (response.ok) {
        const data = await response.json()
        setPosConfig(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch POS config:', error)
    } finally {
      setPosConfigLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes, ordersRes] = await Promise.all([
        fetch('/api/pos/menu-items'),
        fetch('/api/pos/categories'),
        fetch('/api/pos/orders?limit=20')
      ])

      if (itemsRes.ok && catsRes.ok) {
        setMenuItems(await itemsRes.json())
        setCategories(await catsRes.json())
      }
      if (ordersRes.ok) {
        setOrders(await ordersRes.json())
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  // AI Insights functions
  const fetchAIInsights = async (days = 7) => {
    try {
      setAiInsightsLoading(true)
      const response = await fetch(`/api/ai/insights?days=${days}`)
      if (response.ok) {
        const data = await response.json()
        setAiInsights(data)
      }
    } catch (error) {
      console.error('Failed to fetch AI insights:', error)
      toast.error('Failed to load AI insights')
    } finally {
      setAiInsightsLoading(false)
    }
  }

  // Report functions
  const fetchReport = async (type = 'sales', startDate?: string, endDate?: string, groupBy = 'day') => {
    try {
      setReportLoading(true)
      let url = `/api/reports/custom?type=${type}&groupBy=${groupBy}`
      if (startDate) url += `&startDate=${startDate}`
      if (endDate) url += `&endDate=${endDate}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Failed to fetch report:', error)
      toast.error('Failed to load report')
    } finally {
      setReportLoading(false)
    }
  }

  // Receipt functions
  const handleGenerateReceipt = async (order: any) => {
    setSelectedOrderForReceipt(order)
    setReceiptDialogOpen(true)
  }

  const handleSendWhatsApp = async () => {
    if (!receiptPhone) {
      toast.error('Please enter a phone number')
      return
    }

    try {
      const response = await fetch('/api/receipts/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderForReceipt?.id,
          phoneNumber: receiptPhone,
          orderData: selectedOrderForReceipt
        })
      })

      if (response.ok) {
        const data = await response.json()
        window.open(data.data.whatsappURL, '_blank')
        toast.success('Receipt link opened in WhatsApp')
        setSendWhatsAppDialogOpen(false)
        setReceiptPhone('')
      }
    } catch (error) {
      console.error('WhatsApp error:', error)
      toast.error('Failed to send WhatsApp receipt')
    }
  }

  const handleSendEmail = async () => {
    if (!receiptEmail) {
      toast.error('Please enter an email address')
      return
    }

    try {
      const response = await fetch('/api/receipts/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderForReceipt?.id,
          email: receiptEmail,
          orderData: selectedOrderForReceipt
        })
      })

      if (response.ok) {
        toast.success('Receipt email prepared (configure email service for auto-send)')
        setSendEmailDialogOpen(false)
        setReceiptEmail('')
      }
    } catch (error) {
      console.error('Email error:', error)
      toast.error('Failed to send email receipt')
    }
  }

  const handlePrintReceipt = () => {
    if (!selectedOrderForReceipt) return

    fetch('/api/receipts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: selectedOrderForReceipt.id,
        orderData: selectedOrderForReceipt
      })
    })
      .then(res => res.json())
      .then(data => {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(data.receiptHTML)
          printWindow.document.close()
          printWindow.print()
        }
      })
      .catch(err => {
        console.error('Print error:', err)
        toast.error('Failed to print receipt')
      })
  }

  const handleExportReport = (format: 'json' | 'csv') => {
    if (!reportData) {
      toast.error('No report data to export')
      return
    }

    let content: string
    let filename: string
    let type: string

    if (format === 'json') {
      content = JSON.stringify(reportData, null, 2)
      filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`
      type = 'application/json'
    } else {
      // CSV export (simple implementation)
      const flatData = JSON.stringify(reportData)
      content = flatData
      filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`
      type = 'text/csv'
    }

    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Report exported as ${format.toUpperCase()}`)
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    const importType = (document.getElementById('importType') as HTMLSelectElement)?.value || 'all'

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, type: importType })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Import successful! ${result.summary.totalImported} records imported`)
        
        // Refresh data
        if (importType === 'all' || importType === 'users' || importType === 'products' || importType === 'categories') {
          fetchData()
        }
      } else {
        const error = await response.json()
        toast.error(`Import failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import data. Please check the file format.')
    }
  }

  // Profile handlers
  const handleOpenProfile = () => {
    setProfileData({
      name: user.name,
      email: user.email,
      phone: user.phone || ''
    })
    setProfileDialogOpen(true)
  }

  const handleUpdateProfile = async () => {
    try {
      setProfileLoading(true)
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...profileData
        })
      })

      if (response.ok) {
        const result = await response.json()
        setUser({ ...user, ...result.user })
        toast.success('Profile updated successfully!')
        setProfileDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      setPasswordLoading(true)

      // Validate passwords match
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('New passwords do not match')
        return
      }

      // Validate password strength
      if (passwordData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }

      const response = await fetch(`/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
      })

      if (response.ok) {
        toast.success('Password changed successfully!')
        setPasswordDialogOpen(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast.error('Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Load AI insights when tab changes to insights
  useEffect(() => {
    if (activeTab === 'insights' && !aiInsights) {
      fetchAIInsights(7)
    }
  }, [activeTab])

  // Load initial report when tab changes to reports
  useEffect(() => {
    if (activeTab === 'reports' && !reportData) {
      fetchReport('sales')
    }
  }, [activeTab])

  // Filter menu items based on category and search
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const isAvailable = item.isAvailable
    return matchesCategory && matchesSearch && isAvailable
  })

  // Calculate totals with NaN protection (using cart store computed values)
  const sgst = totalGst / 2
  const cgst = totalGst / 2

  // Safe formatting function
  const formatCurrency = (value: number): string => {
    return isNaN(value) ? '₹0.00' : `₹${value.toFixed(2)}`
  }

  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    try {
      const orderData = {
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
        items: cart.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price,
          gstRate: item.menuItem.gstRate,
          gstAmount: item.gstAmount,
          subtotal: item.subtotal
        })),
        subtotal,
        totalGst,
        sgst,
        cgst,
        total,
        paymentMethod
      }

      const response = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const order = await response.json()
        toast.success('Order placed successfully!')
        clearCart()
        setCustomerName('')
        setCustomerPhone('')
        setNotes('')
        setCheckoutOpen(false)
        fetchData()
        toast.success(`Order #${order.orderNumber} - ${formatCurrency(total)}`)
        
        // Show receipt dialog automatically
        setSelectedOrderForReceipt(order)
        setReceiptDialogOpen(true)
      } else {
        throw new Error('Failed to place order')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to place order')
    }
  }

  // Calculate daily stats
  const today = new Date().toDateString()
  const todayOrders = orders.filter(order => 
    new Date(order.createdAt).toDateString() === today
  )
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalOrdersCount = orders.length

  // Hold/Park Order Functions
  const handleHoldOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    const heldOrder = {
      id: Date.now().toString(),
      items: cart,
      customerName,
      customerPhone,
      notes,
      subtotal,
      totalGst,
      sgst,
      cgst,
      total,
      heldAt: new Date().toISOString(),
      heldBy: user.name
    }

    try {
      const existingHeld = JSON.parse(localStorage.getItem('heldOrders') || '[]')
      existingHeld.unshift(heldOrder)
      const updatedHeld = existingHeld.slice(0, 50)
      localStorage.setItem('heldOrders', JSON.stringify(updatedHeld))

      setHeldOrders(updatedHeld)
      clearCart()
      setCustomerName('')
      setCustomerPhone('')
      setNotes('')

      toast.success(`Order held - ${updatedHeld.length} total orders`)
    } catch (error) {
      console.error('Hold order error:', error)
      toast.error('Failed to hold order')
    }
  }

  const handleRecallOrder = (heldOrderId: string) => {
    const orderToRecall = heldOrders.find(order => order.id === heldOrderId)
    if (!orderToRecall) return

    try {
      setCart(orderToRecall.items)
      setCustomerName(orderToRecall.customerName || '')
      setCustomerPhone(orderToRecall.customerPhone || '')
      setNotes(orderToRecall.notes || '')

      const updatedHeld = heldOrders.filter(order => order.id !== heldOrderId)
      setHeldOrders(updatedHeld)
      localStorage.setItem('heldOrders', JSON.stringify(updatedHeld))
      setHeldOrdersOpen(false)
      toast.success(`Recalled order from ${orderToRecall.heldBy}`)
    } catch (error) {
      console.error('Recall order error:', error)
      toast.error('Failed to recall order')
    }
  }

  const handleDeleteHeldOrder = (heldOrderId: string) => {
    try {
      const updatedHeld = heldOrders.filter(order => order.id !== heldOrderId)
      setHeldOrders(updatedHeld)
      localStorage.setItem('heldOrders', JSON.stringify(updatedHeld))
      toast.success('Held order deleted')
    } catch (error) {
      console.error('Delete held order error:', error)
      toast.error('Failed to delete held order')
    }
  }

  const handleCancelOrder = () => {
    if (cart.length === 0) return

    if (!confirm('Are you sure you want to cancel this order?')) return

    clearCart()
    setCustomerName('')
    setCustomerPhone('')
    setNotes('')
    toast.success('Order cancelled')
  }

  // Get role badge color
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-purple-600">{role}</Badge>
      case 'MANAGER':
        return <Badge className="bg-blue-600">{role}</Badge>
      default:
        return <Badge className="bg-green-600">{role}</Badge>
    }
  }

  // Get icon for category
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase()
    if (name.includes('coffee') || name.includes('beverage') || name.includes('hot')) {
      return <Coffee className="h-4 w-4" />
    }
    if (name.includes('food') || name.includes('meal') || name.includes('snack')) {
      return <Utensils className="h-4 w-4" />
    }
    if (name.includes('cake') || name.includes('pastry') || name.includes('dessert')) {
      return <Cake className="h-4 w-4" />
    }
    if (name.includes('ice') || name.includes('cool') || name.includes('cold')) {
      return <IceCream2 className="h-4 w-4" />
    }
    return <Utensils className="h-4 w-4" />
  }

  // Get payment method icon
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Banknote className="h-4 w-4 text-green-600" />
      case 'UPI':
        return <Smartphone className="h-4 w-4 text-purple-600" />
      case 'CARD':
        return <CreditCard className="h-4 w-4 text-blue-600" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-linear-to-br from-amber-600 to-orange-600 text-white shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
              <div className="bg-white/20 p-2 rounded-lg">
                <Coffee className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{posConfig?.name || 'Universal POS'}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0 text-xs">
                    {posConfig?.posType || 'GENERAL'}
                  </Badge>
                  <p className="text-amber-100 text-xs">India GST Compliant</p>
                </div>
              </div>
            </div>
            </Link>
            
            <div className="flex items-center gap-4">
              {/* Date Badge */}
              <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date().toLocaleDateString('en-IN', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </Badge>

              {/* User Info */}
              <div 
                className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all"
                onClick={handleOpenProfile}
              >
                <div className="bg-white/20 p-2 rounded-full">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{user.name}</p>
                  {getRoleBadge(user.role)}
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-1 mb-2 bg-white shadow-lg p-2 rounded-xl border-amber-200">
            <TabsTrigger value="pos" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
              <ShoppingCart className="h-4 w-4 mr-2" />
              POS
            </TabsTrigger>
            {posConfig?.features.orders && (
              <TabsTrigger value="orders" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                <Receipt className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
            )}
            {posConfig?.features.tableManagement && (
              <TabsTrigger value="tables" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Tables
              </TabsTrigger>
            )}
            {posConfig?.features.kitchenDisplay && (
              <TabsTrigger value="kds" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                <Armchair className="h-4 w-4 mr-2" />
                KDS
              </TabsTrigger>
            )}
            <TabsTrigger value="insights" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
            {posConfig?.features.inventory && (
              <TabsTrigger value="inventory" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                <Package className="h-4 w-4 mr-2" />
                Inventory
              </TabsTrigger>
            )}
            {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
              <TabsTrigger value="menu" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                <Utensils className="h-4 w-4 mr-2" />
                Menu
              </TabsTrigger>
            )}
            {/* Staff Tab - Admin only */}
            {user.role === 'ADMIN' && (
              <TabsTrigger value="staff" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <Users className="h-4 w-4 mr-2" />
                Staff
              </TabsTrigger>
            )}
            {/* Settings Tab - Admin only */}
            {user.role === 'ADMIN' && (
              <TabsTrigger value="settings" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            )}
            {posConfig?.features.returns && (
              <TabsTrigger value="returns" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
                <RotateCw className="h-4 w-4 mr-2" />
                Returns
              </TabsTrigger>
            )}
            {posConfig?.features.giftCards && (
              <TabsTrigger value="giftcards" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
                {/* <Card className="h-4 w-4 mr-2" /> */}
                Gift Cards
              </TabsTrigger>
            )}
            {posConfig?.features.cashDrawer && (
              <TabsTrigger value="cashdrawer" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white">
                <Wallet className="h-4 w-4 mr-2" />
                Cash Drawer
              </TabsTrigger>
            )}
            {posConfig?.features.barcodes && (
              <TabsTrigger value="barcode" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <ScanBarcode className="h-4 w-4 mr-2" />
                Barcode
              </TabsTrigger>
            )}
            {posConfig?.features.sizeVariants && (
              <TabsTrigger value="variants" className="data-[state=active]:bg-linear-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                <Tag className="h-4 w-4 mr-2" />
                Variants
              </TabsTrigger>
            )}
          </TabsList>

          {/* POS Tab */}
          <TabsContent value="pos" className="mt-0 h-full">
            <div className="flex h-full">
              {/* Left side - Menu/Categories */}
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto py-2">
                  <Button
                    key="all"
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory('all')}
                    className={selectedCategory === 'all'
                      ? 'bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-lg shrink-0'
                      : 'bg-white hover:bg-amber-50 border-amber-200 shrink-0'
                    }
                  >
                    All Items
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`shrink-0 flex items-center gap-2 ${
                        selectedCategory === category.id
                          ? 'bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-lg'
                          : 'bg-white hover:bg-amber-50 border-amber-200'
                      }`}
                    >
                      {getCategoryIcon(category.name)}
                      {category.name}
                    </Button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search menu items by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-white shadow-sm border-amber-200 focus:border-amber-400 text-base"
                  />
                </div>

                {/* Menu Items Grid */}
                <ScrollArea className="flex-1 pr-4 h-full overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 overflow-y-auto pb-4">
                    {filteredItems.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer hover:shadow-2xl transition-all hover:scale-105 border-2 border-transparent hover:border-amber-400 group overflow-hidden bg-white p-2"
                        onClick={() => addToCart(item)}
                      >
                        <CardHeader className="p-4 pb-2 bg-linear-to-br from-amber-50 to-orange-50 group-hover:from-amber-100 group-hover:to-orange-100 transition-colors">
                          <CardTitle className="text-base font-semibold line-clamp-1">
                            {item.name}
                          </CardTitle>
                          {item.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <span className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-br from-amber-600 to-orange-600">
                                ₹{item.price.toFixed(2)}
                              </span>
                              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">
                                GST {item.gstRate}%
                              </Badge>
                            </div>
                            </div>
                            <div className="bg-linear-to-br from-amber-500 to-orange-600 p-2 rounded-lg shadow-lg group-hover:shadow-xl transition-all mt-1">
                              <Plus className="h-5 w-5 text-white text-center" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>

                  {filteredItems.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                      <Coffee className="h-20 w-20 mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-lg">No items found</p>
                      <p className="text-sm">Try adjusting your search or category filter</p>
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Right side - Sticky Order Panel */}
              <div className="w-80 sticky top-0 h-screen flex flex-col bg-white border-l shadow-xl">
                {/* Order Summary Header */}
                <div className="bg-linear-to-br from-amber-500 to-orange-600 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-6 w-6" />
                      <h2 className="text-lg font-bold">Current Order</h2>
                    </div>
                    {cart.length > 0 && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {cart.length} {cart.length === 1 ? 'item' : 'items'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Cart Items - scrollable */}
                <div className="flex-1 overflow-auto p-4">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <div className="bg-linear-to-br from-amber-100 to-orange-100 p-6 rounded-full mb-4">
                        <ShoppingCart className="h-6 w-6 text-amber-400" />
                      </div>
                      <p className="font-medium">Your cart is empty</p>
                      <p className="text-sm">Add delicious items from menu</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div
                          key={item.menuItem.id}
                          className="flex flex-col p-4 bg-linear-to-br from-gray-50 to-amber-50 rounded-xl border border-gray-100 hover:border-amber-200 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 line-clamp-1">
                                {item.menuItem.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatCurrency(item.menuItem.price)} each
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.menuItem.id)}
                              className="hover:bg-red-50 hover:text-red-600 shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                                className="h-8 w-8 hover:bg-amber-50 hover:border-amber-300"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-bold w-10 text-center text-lg">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                                className="h-8 w-8 hover:bg-amber-50 hover:border-amber-300"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-xl text-transparent bg-clip-text bg-linear-to-br from-amber-600 to-orange-600">
                                {formatCurrency(item.subtotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals */}
                {cart.length > 0 && (
                  <div className="border-t bg-gray-50 p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-700">
                      <span>CGST ({subtotal > 0 ? ((totalGst/2)/subtotal*100).toFixed(1) : '0'}%)</span>
                      <span className="font-semibold">{formatCurrency(cgst)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-700">
                      <span>SGST ({subtotal > 0 ? ((totalGst/2)/subtotal*100).toFixed(1) : '0'}%)</span>
                      <span className="font-semibold">{formatCurrency(sgst)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-transparent bg-clip-text bg-linear-to-br from-amber-600 to-orange-600">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {cart.length > 0 && (
                  <div className="border-t p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={handleCancelOrder}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleHoldOrder}
                        className="bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Hold
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => setHeldOrdersOpen(true)}
                        className="bg-linear-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Held ({heldOrders.length})
                      </Button>
                      <Button
                        onClick={() => setCheckoutOpen(true)}
                        className="bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Pay
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="shadow-xl">
              <CardHeader className="bg-linear-to-br from-amber-500 to-orange-600 text-white">
                <div className="flex items-center gap-2">
                  <Receipt className="h-6 w-6" />
                  Order History
                </div>
                <CardDescription className="text-amber-100">
                  View and manage all orders
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-lg border border-amber-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-linear-to-br from-amber-50 to-orange-50">
                      <TableRow>
                        <TableHead className="font-semibold">Order #</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Items</TableHead>
                        <TableHead className="font-semibold">Payment</TableHead>
                        <TableHead className="font-semibold text-right">Amount</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                            <Receipt className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No orders yet</p>
                            <p className="text-sm">Start taking orders to see them here</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {orders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-amber-50/50 transition-colors">
                              <TableCell className="font-medium">
                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                                  #{order.orderNumber}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell className="text-sm">
                                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getPaymentIcon(order.paymentMethod)}
                                  <span className="text-sm">{order.paymentMethod}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                <span className="text-amber-600">{formatCurrency(order.totalAmount)}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={
                                  order.status === 'COMPLETED'
                                    ? 'bg-green-600'
                                    : 'bg-yellow-600'
                                }>
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGenerateReceipt(order)}
                                    className="h-8 px-2 hover:bg-amber-50 hover:border-amber-300"
                                    title="Generate Receipt"
                                  >
                                    <Printer className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedOrderForReceipt(order)
                                      setSendWhatsAppDialogOpen(true)
                                      setReceiptPhone(order.customerPhone || '')
                                    }}
                                    className="h-8 px-2 hover:bg-green-50 hover:border-green-300"
                                    title="Send via WhatsApp"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedOrderForReceipt(order)
                                      setSendEmailDialogOpen(true)
                                    }}
                                    className="h-8 px-2 hover:bg-blue-50 hover:border-blue-300"
                                    title="Send via Email"
                                  >
                                    <Mail className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}
                    </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-linear-to-br from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    AI-Powered Business Insights
                  </h2>
                  <p className="text-gray-600 mt-1">Smart analytics and recommendations for your coffee shop</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => fetchAIInsights(7)}
                    variant={aiInsights?.period === '7 days' ? 'default' : 'outline'}
                    className={aiInsights?.period === '7 days'
                      ? 'bg-linear-to-br from-purple-500 to-purple-600 text-white'
                      : ''
                    }
                  >
                    7 Days
                  </Button>
                  <Button
                    onClick={() => fetchAIInsights(30)}
                    variant={aiInsights?.period === '30 days' ? 'default' : 'outline'}
                    className={aiInsights?.period === '30 days'
                      ? 'bg-linear-to-br from-purple-500 to-purple-600 text-white'
                      : ''
                    }
                  >
                    30 Days
                  </Button>
                  <Button
                    onClick={() => fetchAIInsights(90)}
                    variant={aiInsights?.period === '90 days' ? 'default' : 'outline'}
                    className={aiInsights?.period === '90 days'
                      ? 'bg-linear-to-br from-purple-500 to-purple-600 text-white'
                      : ''
                    }
                  >
                    90 Days
                  </Button>
                </div>
              </div>

              {aiInsightsLoading ? (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <Brain className="h-16 w-16 mx-auto mb-4 animate-pulse" />
                    <p className="text-lg font-medium">Analyzing your business data...</p>
                    <p className="text-sm mt-2">AI is generating insights</p>
                  </CardContent>
                </Card>
              ) : aiInsights ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-lg bg-linear-to-br from-purple-500 to-purple-600 text-white">
                      <CardHeader className="p-4">
                        <CardDescription className="text-purple-100 text-sm">Total Revenue</CardDescription>
                        <CardTitle className="text-2xl font-bold text-center">{formatCurrency(aiInsights.summary.totalRevenue)}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="border-0 shadow-lg bg-linear-to-br from-blue-500 to-blue-600 text-white">
                      <CardHeader className="p-4">
                        <CardDescription className="text-blue-100 text-sm">Total Orders</CardDescription>
                        <CardTitle className="text-2xl font-bold text-center">{aiInsights.summary.totalOrders}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="border-0 shadow-lg bg-linear-to-br from-green-500 to-green-600 text-white">
                      <CardHeader className="p-4">
                        <CardDescription className="text-green-100 text-sm">Avg Order Value</CardDescription>
                        <CardTitle className="text-2xl font-bold text-center">₹{aiInsights.summary.averageOrderValue}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="border-0 shadow-lg bg-linear-to-br from-amber-500 to-orange-600 text-white">
                      <CardHeader className="p-4">
                        <CardDescription className="text-amber-100 text-sm">Analysis Period</CardDescription>
                        <CardTitle className="text-2xl font-bold text-center">{aiInsights.period}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* AI Insights Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aiInsights.insights.map((insight: any, index: number) => (
                      <Card key={index} className={`border-0 shadow-lg ${
                        insight.type === 'positive' ? 'bg-linear-to-br from-green-50 to-emerald-50 border-l-4 border-green-500' :
                        insight.type === 'warning' ? 'bg-linear-to-br from-red-50 to-orange-50 border-l-4 border-red-500' :
                        'bg-linear-to-br from-blue-50 to-purple-50 border-l-4 border-blue-500'
                      }`}>
                        <CardHeader>
                          <CardTitle className={`text-lg flex items-center gap-2 ${
                            insight.type === 'positive' ? 'text-green-700' :
                            insight.type === 'warning' ? 'text-red-700' :
                            'text-blue-700'
                          }`}>
                            {insight.type === 'positive' ? '📈' : insight.type === 'warning' ? '⚠️' : '📊'}
                            {insight.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 mb-3">{insight.message}</p>
                          <div className="bg-white/80 p-3 rounded-lg border">
                            <p className="text-sm font-semibold text-gray-800 mb-1">💡 Recommendation:</p>
                            <p className="text-[12px] text-gray-600 text-center">{insight.recommendation}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Top Items */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-linear-to-br from-purple-500 to-purple-600 text-white">
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Top Selling Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {aiInsights.topItems.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-linear-to-br from-gray-50 to-purple-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                index === 0 ? 'bg-amber-500' :
                                index === 1 ? 'bg-gray-400' :
                                index === 2 ? 'bg-orange-600' :
                                'bg-purple-300'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-500">{item.quantity} items sold</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-purple-600">₹{item.revenue.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">Total revenue</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No insights available</p>
                    <p className="text-sm mt-2">Generate some orders to see AI-powered insights</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-linear-to-br from-green-500 to-green-600 text-white p-4">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Today's Revenue
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Daily sales summary
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6 py-6">
                    <div className="flex-1 flex flex-col items-center">
                      <div className="bg-green-100 p-4 rounded-xl">
                        <IndianRupee className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-[12px] text-gray-600 text-center">Today's Revenue</p>
                        <p className="text-2xl font-bold text-center">₹{todayRevenue.toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="bg-green-100 p-4 rounded-xl">
                        <Receipt className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-[12px] text-gray-600 text-center">Today's Orders</p>
                        <p className="text-2xl font-bold text-center">{todayOrders.length}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="bg-green-100 p-4 rounded-xl">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-[12px] text-gray-600 text-center">Total Orders</p>
                        <p className="text-2xl font-bold text-center">{totalOrdersCount}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-linear-to-br from-purple-500 to-purple-600 text-white p-4">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    Total Revenue
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    All-time sales data
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6 py-6">
                    <div className="flex-1 flex flex-col items-center">
                      <div className="bg-purple-100 p-4 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-[12px] text-gray-600 text-center">Total Revenue</p>
                        <p className="text-2xl font-bold text-center">
                          ₹{orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="bg-purple-100 p-4 rounded-xl">
                        <Receipt className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-[12px] text-gray-600 text-center">Total Orders</p>
                        <p className="text-2xl font-bold text-center">{totalOrdersCount}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-linear-to-br from-blue-500 to-blue-600 text-white p-4">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-6 w-6" />
                    Average Order Value
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                      Average per order
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6 py-6">
                    <div className="flex-1 flex flex-col items-center">
                      <div className="bg-blue-100 p-4 rounded-xl">
                        <IndianRupee className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[12px] text-gray-600 text-center">Avg Order Value</p>
                        <p className="text-2xl font-bold text-center">
                          {totalOrdersCount > 0
                            ? `₹${(orders.reduce((sum, order) => sum + order.totalAmount, 0) / totalOrdersCount).toFixed(2)}`
                            : '₹0'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-linear-to-br from-amber-500 to-orange-600 text-white p-4">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-6 w-6" />
                    Inventory Status
                  </CardTitle>
                  <CardDescription className="text-amber-100">
                    Stock tracking & management
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-lg">Inventory coming soon</p>
                    <p className="text-sm mt-2">Stock tracking will be available in the next update</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          {posConfig?.features.inventory && (
            <TabsContent value="inventory">
              <POSInventory />
            </TabsContent>
          )}

          {/* Menu Tab - Manager/Admin only */}
          <TabsContent value="menu">
            <MenuManagement />
          </TabsContent>

          {/* Staff Tab - Admin only */}
          <TabsContent value="staff">
            <Card className="shadow-xl">
              <CardHeader className="bg-linear-to-br from-blue-500 to-blue-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Staff Management
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Manage staff accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium text-lg">Staff Management</p>
                  <p className="text-sm mt-2">Staff management features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - Admin only */}
          <TabsContent value="settings">
            <Settings />
          </TabsContent>

          {/* Tables Tab (Food POS) */}
          {posConfig?.features.tableManagement && (
            <TabsContent value="tables">
              <Tables />
            </TabsContent>
          )}

          {/* KDS Tab (Food POS) */}
          {posConfig?.features.kitchenDisplay && (
            <TabsContent value="kds">
              <KDS />
            </TabsContent>
          )}

          {/* Returns Tab (Garment/Retail POS) */}
          {posConfig?.features.returns && (
            <TabsContent value="returns">
              <Returns />
            </TabsContent>
          )}

          {/* Gift Cards Tab */}
          {posConfig?.features.giftCards && (
            <TabsContent value="giftcards">
              <Card className="shadow-xl">
                <CardHeader className="bg-linear-to-br from-pink-500 to-pink-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    {/* <Card className="h-6 w-6" /> */}
                    Gift Cards
                  </CardTitle>
                  <CardDescription className="text-pink-100">
                    Issue and manage gift cards
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Gift Card Lookup */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Check Gift Card Balance</h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter card number"
                        value={giftCardLookup}
                        onChange={(e) => setGiftCardLookup(e.target.value)}
                      />
                      <Button className="bg-linear-to-br from-pink-500 to-pink-600">
                        Check
                      </Button>
                    </div>
                  </div>

                  {/* Issue New Gift Card */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Issue New Gift Card</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Card Number" />
                      <Input type="password" placeholder="PIN" />
                      <Input type="number" placeholder="Initial Balance (₹)" />
                      <Input type="date" placeholder="Expiry Date" />
                    </div>
                    <Button className="w-full mt-4 bg-linear-to-br from-pink-500 to-pink-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Issue Gift Card
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Cash Drawer Tab */}
          {posConfig?.features.cashDrawer && (
            <TabsContent value="cashdrawer">
              <Card className="shadow-xl">
                <CardHeader className="bg-linear-to-br from-green-500 to-green-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-6 w-6" />
                    Cash Drawer
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Manage cash drawer and transactions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-2 border-green-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-[12px] text-gray-600 text-center">Opening Balance</p>
                        <p className="text-2xl font-bold text-green-600">₹5,000.00</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-blue-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-[12px] text-gray-600 text-center">Cash In</p>
                        <p className="text-2xl font-bold text-blue-600">₹12,500.00</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-purple-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-[12px] text-gray-600 text-center">Current Balance</p>
                        <p className="text-2xl font-bold text-purple-600">₹17,500.00</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <Button className="flex-1 bg-linear-to-br from-blue-500 to-blue-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Cash In
                    </Button>
                    <Button className="flex-1 bg-linear-to-br from-red-500 to-red-600">
                      <Minus className="h-4 w-4 mr-2" />
                      Cash Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Barcode Tab (Retail POS) */}
          {posConfig?.features.barcodes && (
            <TabsContent value="barcode">
              <BarcodeScanner />
            </TabsContent>
          )}

          {/* Variants Tab (Garment POS) */}
          {posConfig?.features.sizeVariants && (
            <TabsContent value="variants">
              <ProductVariants />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Held Orders Dialog */}
      <Dialog open={heldOrdersOpen} onOpenChange={setHeldOrdersOpen}>
        <DialogContent className="max-w-4xl border-0 shadow-2xl max-h-[85vh]">
          <DialogHeader className="bg-linear-to-br from-amber-500 to-amber-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="h-7 w-7" />
                  Held Orders
                </DialogTitle>
                <DialogDescription className="text-amber-100">
                  Saved orders ready for recall
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHeldOrdersOpen(false)}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="p-2 flex-1 overflow-hidden">
            {heldOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-2 text-gray-500 ">
                <Clock className="h-24 w-24 mx-auto mb-4 opacity-20" />
                <p className="font-medium text-lg">No held orders yet</p>
                <p className="text-sm mt-2">Use the "Hold" button to save orders for later</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-220px)]">
                {heldOrders.map((order) => (
                  <Card key={order.id} className="border-2 border-amber-200 hover:border-amber-400 transition-all hover:shadow-lg">
                    <CardHeader className="bg-linear-to-br from-amber-50 to-amber-100 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-2 rounded-lg">
                              <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <CardTitle className="text-base font-semibold">
                                {order.customerName || 'Walk-in Customer'}
                              </CardTitle>
                              <CardDescription className="text-amber-700 text-xs mt-1">
                                Held {new Date(order.heldAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })} by {order.heldBy}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRecallOrder(order.id)}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Recall
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteHeldOrder(order.id)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold">Items:</span>
                          <span>{order.items.length} items</span>
                        </div>
                        <div className="border-t border-2 border-gray-300 pt-3">
                          {order.items.map((item) => (
                            <div key={item.menuItem.id} className="flex items-center justify-between py-2">
                              <div className="flex-1 flex flex-col">
                                <span className="font-medium">{item.menuItem.name}</span>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>Qty: {item.quantity}</span>
                                  <span>x ₹{item.menuItem.price.toFixed(2)}</span>
                                </div>
                              </div>
                              <span className="font-bold">₹{item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t-2 border-gray-300 pt-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-semibold">₹{order.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-green-700">
                            <span>CGST:</span>
                            <span className="font-semibold">₹{order.sgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-green-700">
                            <span>SGST:</span>
                            <span className="font-semibold">₹{order.cgst.toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-xl font-bold">
                            <span>Total:</span>
                            <span className="font-bold text-amber-600">₹{order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-3 p-6 border-t-2 border-amber-200">
            <Button
              variant="outline"
              onClick={() => setHeldOrdersOpen(false)}
              className="flex-1 h-11 border-amber-200 hover:bg-amber-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="bg-linear-to-br from-amber-500 to-orange-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Order Receipt
            </DialogTitle>
            <DialogDescription className="text-amber-100">
              {selectedOrderForReceipt ? `Order #${selectedOrderForReceipt.orderNumber}` : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedOrderForReceipt && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order #:</span>
                  <span className="font-semibold">{selectedOrderForReceipt.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold">{new Date(selectedOrderForReceipt.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-semibold">{selectedOrderForReceipt.customerName || 'Walk-in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-semibold">{selectedOrderForReceipt.items?.length || 0} items</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-700">Total:</span>
                  <span className="text-amber-600">{formatCurrency(selectedOrderForReceipt.totalAmount)}</span>
                </div>
              </div>

              <DialogFooter className="gap-3">
                <Button
                  variant="outline"
                  onClick={() => setReceiptDialogOpen(false)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
                <Button
                  onClick={handlePrintReceipt}
                  className="flex-1 bg-linear-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* WhatsApp Receipt Dialog */}
      <Dialog open={sendWhatsAppDialogOpen} onOpenChange={setSendWhatsAppDialogOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="bg-linear-to-br from-green-500 to-green-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send via WhatsApp
            </DialogTitle>
            <DialogDescription className="text-green-100">
              Send receipt to customer's WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Phone Number</label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={receiptPhone}
                onChange={(e) => setReceiptPhone(e.target.value)}
                className="text-base"
              />
              <p className="text-xs text-gray-500 mt-1">Format: +91 followed by 10-digit number</p>
            </div>

            {selectedOrderForReceipt && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="text-gray-600 mb-1">Order #<span className="font-semibold">{selectedOrderForReceipt.orderNumber}</span></p>
                <p className="text-amber-600 font-bold">Total: {formatCurrency(selectedOrderForReceipt.totalAmount)}</p>
              </div>
            )}

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setSendWhatsAppDialogOpen(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSendWhatsApp}
                className="flex-1 bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send via WhatsApp
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Receipt Dialog */}
      <Dialog open={sendEmailDialogOpen} onOpenChange={setSendEmailDialogOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send via Email
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              Send receipt to customer's email
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Email Address</label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={receiptEmail}
                onChange={(e) => setReceiptEmail(e.target.value)}
                className="text-base"
              />
            </div>

            {selectedOrderForReceipt && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="text-gray-600 mb-1">Order #<span className="font-semibold">{selectedOrderForReceipt.orderNumber}</span></p>
                <p className="text-amber-600 font-bold">Total: {formatCurrency(selectedOrderForReceipt.totalAmount)}</p>
              </div>
            )}

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setSendEmailDialogOpen(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                className="flex-1 bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6" />
              My Profile
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              Update your personal information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Name</label>
              <Input
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Your name"
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
              <Input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="your@email.com"
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Phone</label>
              <Input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="h-11"
              />
            </div>
            <Separator className="my-4" />
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Want to change your password? Use the button below.</span>
              </p>
            </div>
          </div>
          <DialogFooter className="bg-gray-50 rounded-b-lg -mx-6 -mb-6 px-6 pb-6">
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => {
                  setProfileDialogOpen(false)
                  setPasswordDialogOpen(true)
                }}
                className="flex-1 h-11 bg-linear-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button
                onClick={handleUpdateProfile}
                disabled={profileLoading}
                className="flex-1 h-11 bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {profileLoading ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Key className="h-6 w-6" />
              Change Password
            </DialogTitle>
            <DialogDescription className="text-purple-100">
              Update your password for better security
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Current Password</label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter your current password"
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">New Password</label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Confirm New Password</label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="h-11"
              />
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-800">
                <span className="font-semibold">Password Requirements:</span>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Minimum 6 characters</li>
                  <li>Should be different from current password</li>
                  <li>New password and confirm password must match</li>
                </ul>
              </p>
            </div>
          </div>
          <DialogFooter className="bg-gray-50 rounded-b-lg -mx-6 -mb-6 px-6 pb-6">
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setPasswordDialogOpen(false)
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                }}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1 h-11 bg-linear-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="bg-linear-to-br from-green-500 to-green-600 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Checkout
            </DialogTitle>
            <DialogDescription className="text-green-100">
              Review order and select payment method
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Name (Optional)</label>
                <Input
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Phone (Optional)</label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex flex-col items-center gap-1 h-14 ${
                    paymentMethod === 'CASH' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'hover:bg-green-50 hover:border-green-300'
                  }`}
                >
                  <Banknote className="h-5 w-5" />
                  <span className="text-xs">Cash</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'UPI' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex flex-col items-center gap-1 h-14 ${
                    paymentMethod === 'UPI' 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'hover:bg-purple-50 hover:border-purple-300'
                  }`}
                >
                  <Smartphone className="h-5 w-5" />
                  <span className="text-xs">UPI</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex flex-col items-center gap-1 h-14 ${
                    paymentMethod === 'CARD' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Card</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'GIFT_CARD' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('GIFT_CARD')}
                  className={`flex flex-col items-center gap-1 h-14 ${
                    paymentMethod === 'GIFT_CARD' 
                      ? 'bg-pink-600 hover:bg-pink-700' 
                      : 'hover:bg-pink-50 hover:border-pink-300'
                  }`}
                >
                  <Wallet className="h-5 w-5" />
                  <span className="text-xs">Gift</span>
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items ({cart.length})</span>
                <span className="font-medium">{cart.length} items</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-700">
                <span>CGST</span>
                <span className="font-medium">{formatCurrency(cgst)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-700">
                <span>SGST</span>
                <span className="font-medium">{formatCurrency(sgst)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-green-600">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Order Notes (Optional)</label>
              <Input
                placeholder="Special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setCheckoutOpen(false)}
              className="flex-1 h-11"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              className="flex-1 h-11 bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Pay {formatCurrency(total)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-amber-200 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-[12px] text-gray-600">
            <div className="flex items-center gap-3">
              <div className="bg-linear-to-br from-amber-500 to-orange-600 p-2 rounded-lg">
                <Coffee className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-semibold">Coffee Shop POS</span>
                <span className="mx-2">•</span>
                <span className="text-gray-500">India GST Compliant</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <span>Support: +91 98765 43210</span>
              <span className="text-gray-400">|</span>
              <span>Version 1.0.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function Page() {
  const {
    user, setUser,
    loading, setLoading,
    loginData, setLoginData,
    loginError, setLoginError,
    loginTab, setLoginTab,
    smsLoginData, setSmsLoginData,
    otpSent, setOtpSent,
    otpLoading, setOtpLoading,
    smsLoginError, setSmsLoginError
  } = useAuthStore()

  useEffect(() => {
    // Check for existing user session
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const userData = await res.json()
          setUser(userData)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })

      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
        toast.success('Welcome back!')
      } else {
        const error = await res.json()
        setLoginError(error.message || 'Login failed')
        toast.error('Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('An error occurred')
      toast.error('Login failed')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      // Clear persisted auth state from localStorage
      localStorage.removeItem('auth-storage')
      setUser(null)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const handleSendOTP = async () => {
    setSmsLoginError('')
    setOtpLoading(true)

    try {
      const res = await fetch('/api/auth/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: smsLoginData.phone })
      })

      if (res.ok) {
        const data = await res.json()
        setOtpSent(true)
        toast.success(data.message || 'OTP sent successfully')
        if (data.development) {
          toast.info(`Development OTP: ${data.development}`)
        }
      } else {
        const error = await res.json()
        setSmsLoginError(error.error || 'Failed to send OTP')
        toast.error('Failed to send OTP')
      }
    } catch (error) {
      console.error('OTP send error:', error)
      setSmsLoginError('An error occurred')
      toast.error('Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setSmsLoginError('')

    try {
      const res = await fetch('/api/auth/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: smsLoginData.phone, otp: smsLoginData.otp })
      })

      if (res.ok) {
        const userData = await res.json()
        setUser(userData.user)
        toast.success('Login successful!')
      } else {
        const error = await res.json()
        setSmsLoginError(error.error || 'Invalid OTP')
        toast.error('Invalid OTP')
      }
    } catch (error) {
      console.error('OTP verify error:', error)
      setSmsLoginError('An error occurred')
      toast.error('Verification failed')
    }
  }

  const handleResendOTP = () => {
    setOtpSent(false)
    setSmsLoginData({ ...smsLoginData, otp: '' })
    handleSendOTP()
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border-2 border-amber-200 py-0">
          <CardHeader className="bg-linear-to-br from-amber-600 to-orange-600 text-white rounded-t-lg p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full">
                <Coffee className="h-6 w-6" />
              </div>
              <div className="text-center">
                <CardTitle className="text-2xl font-bold text-center">Coffee Shop POS</CardTitle>
                <CardDescription className="text-amber-100 mt-2">
                  Sign in to continue
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs value={loginTab} onValueChange={(v) => { setLoginTab(v as 'email' | 'sms'); setLoginError(''); setSmsLoginError('') }}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  SMS OTP
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="email">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@coffeeshop.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>
                  {loginError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {loginError}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold bg-linear-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg"
                  >
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="sms">
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  {!otpSent ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="9876543210"
                          value={smsLoginData.phone}
                          onChange={(e) => setSmsLoginData({ ...smsLoginData, phone: e.target.value })}
                          className="h-11"
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Enter your phone number to receive an OTP
                        </p>
                      </div>
                      {smsLoginError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                          {smsLoginError}
                        </div>
                      )}
                      <Button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={otpLoading || !smsLoginData.phone}
                        className="w-full h-11 text-base font-semibold bg-linear-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg"
                      >
                        {otpLoading ? 'Sending...' : 'Send OTP'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                          Enter OTP
                        </label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="123456"
                          value={smsLoginData.otp}
                          onChange={(e) => setSmsLoginData({ ...smsLoginData, otp: e.target.value })}
                          className="h-11 text-center text-2xl tracking-widest"
                          maxLength={6}
                          required
                          autoFocus
                        />
                        <p className="text-xs text-gray-500">
                          Enter the 6-digit code sent to {smsLoginData.phone}
                        </p>
                      </div>
                      {smsLoginError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                          {smsLoginError}
                        </div>
                      )}
                      <Button
                        type="submit"
                        disabled={!smsLoginData.otp || smsLoginData.otp.length !== 6}
                        className="w-full h-11 text-base font-semibold bg-linear-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg"
                      >
                        Verify & Login
                      </Button>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          className="text-sm text-amber-600 hover:text-amber-700 underline"
                        >
                          Resend OTP
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </TabsContent>
            </Tabs>
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              {loginTab === 'email' ? (
                <>
                  <p className="text-xs text-gray-600 text-center mb-2">
                    Demo Accounts:
                  </p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>Admin: admin@coffeeshop.com</p>
                    <p>Manager: manager@coffeeshop.com</p>
                    <p>Cashier: cashier@coffeeshop.com</p>
                    <p className="mt-2 italic">Password: password123</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-600 text-center mb-2">
                    Test SMS Login:
                  </p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>Phone: 9876543210</p>
                    <p className="italic">OTP will be shown in a toast for testing</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <POSDashboard user={user} setUser={setUser} onLogout={handleLogout} />
}