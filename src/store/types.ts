// Shared TypeScript types for all Zustand stores

export interface POSConfig {
  posType: string
  name: string
  features: {
    tableManagement: boolean
    kitchenDisplay: boolean
    modifiers: boolean
    sizeVariants: boolean
    colorVariants: boolean
    barcodes: boolean
    serialNumbers: boolean
    returns: boolean
    exchanges: boolean
    loyaltyProgram: boolean
    discounts: boolean
    refunds: boolean
    cashDrawer: boolean
    staffPerformance: boolean
    giftCards: boolean
    orders: boolean
    inventory: boolean
    reservations: boolean
    waitlist: boolean
  }
  capabilities: string[]
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  phone?: string | null
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  gstRate: string
  hsnCode: string | null
  categoryId: string
  isAvailable: boolean
  category: {
    name: string
  }
}

export interface Category {
  id: string
  name: string
  description?: string | null
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  subtotal: number
  gstAmount: number
}

export interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  paymentMethod: string
  createdAt: string
  items: Array<{
    menuItem: {
      name: string
      price: number
    }
    quantity: number
  }>
  customerPhone?: string
  customerName?: string
  notes?: string
}

export interface HeldOrder {
  id: string
  items: CartItem[]
  customerName?: string
  customerPhone?: string
  notes?: string
  subtotal: number
  totalGst: number
  sgst: number
  cgst: number
  total: number
  heldAt: string
  heldBy: string
}

export interface Table {
  id: string
  name: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved'
  currentOrderId?: string | null
}

export interface Variant {
  id: string
  menuItemId: string
  type: 'size' | 'color'
  name: string
  priceAdjustment: number
  isAvailable: boolean
}

export interface GiftCard {
  id: string
  cardNumber: string
  balance: number
  initialBalance: number
  status: 'active' | 'inactive' | 'expired'
  issuedAt: string
  expiresAt?: string | null
}

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  unit: string
  minStockLevel: number
  lastRestocked?: string | null
}

export interface ReturnItem {
  id: string
  orderId: string
  items: Array<{
    menuItemId: string
    quantity: number
    reason: string
  }>
  refundAmount: number
  refundMethod: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface CashDrawer {
  id: string
  openingBalance: number
  currentBalance: number
  cashIn: number
  cashOut: number
  status: 'open' | 'closed'
  openedAt?: string | null
  closedAt?: string | null
  openedBy?: string | null
  closedBy?: string | null
}

export interface ReportData {
  type: string
  startDate: string
  endDate: string
  groupBy: string
  data: any
  summary?: {
    totalSales?: number
    totalOrders?: number
    averageOrderValue?: number
    gstCollected?: number
  }
}

export interface AIInsight {
  id: string
  type: 'positive' | 'warning' | 'neutral'
  title: string
  message: string
  recommendation: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  data?: any
}

export interface AIInsightsData {
  period: string
  summary: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
  }
  insights: AIInsight[]
  topItems: Array<{
    name: string
    quantity: number
    revenue: number
  }>
}

export interface ReceiptData {
  orderId: string
  orderNumber: string
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
  }>
  subtotal: number
  gstAmount: number
  total: number
  paymentMethod: string
  customerName?: string
  customerPhone?: string
  createdAt: string
}

// Login data types
export interface LoginData {
  email: string
  password: string
}

export interface SmsLoginData {
  phone: string
  otp: string
}

// Profile data types
export interface ProfileData {
  name: string
  email: string
  phone: string
}

export interface PasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Report types
export type ReportType = 'sales' | 'inventory' | 'items' | 'payments' | 'customers' | 'comprehensive'

// Payment methods
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'GIFT_CARD'

// Login tab types
export type LoginTab = 'email' | 'sms'

// GST Rate enum values
export type GstRate = 'ZERO' | 'FIVE' | 'TWELVE' | 'EIGHTEEN' | 'TWENTY_EIGHT'

// Table status types
export type TableStatus = 'available' | 'occupied' | 'reserved'

// Variant types
export type VariantType = 'size' | 'color'

// Gift card status types
export type GiftCardStatus = 'active' | 'inactive' | 'expired'

// Return status types
export type ReturnStatus = 'pending' | 'approved' | 'rejected'

// Cash drawer status types
export type CashDrawerStatus = 'open' | 'closed'

// AI insight types
export type AIInsightType = 'trend' | 'recommendation' | 'alert'

// AI insight priority types
export type AIInsightPriority = 'low' | 'medium' | 'high'

// Loyalty types
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string | null
  points: number
  tier: LoyaltyTier
  totalSpent: number
  ordersCount: number
  createdAt: string
  updatedAt: string
}

export interface LoyaltyHistory {
  id: string
  customerId: string
  type: 'earned' | 'redeemed' | 'bonus'
  points: number
  description: string
  orderId?: string | null
  createdAt: string
}

export interface LoyaltyRegistration {
  name: string
  phone: string
  email?: string
}

export interface LoyaltyRedemption {
  customerId: string
  points: number
  description: string
}

// Discount types
export type DiscountType = 'PERCENTAGE' | 'FIXED' | 'BOGO' | 'BUNDLE'

export type DiscountStatus = 'active' | 'inactive' | 'expired'

export interface Discount {
  id: string
  code: string
  type: DiscountType
  value: number
  description?: string | null
  minOrderValue?: number | null
  maxUsage?: number | null
  currentUsage: number
  validFrom: string
  validUntil: string
  categoryIds?: string[] | null
  status: DiscountStatus
  createdAt: string
  updatedAt: string
}

export interface DiscountApplication {
  code: string
  orderId?: string | null
  totalAmount: number
}

export interface DiscountResult {
  success: boolean
  discountAmount: number
  message?: string
  discount?: Discount
}

// KDS types
export type KDSStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED'

export interface KDSOrder {
  id: string
  orderNumber: string
  status: KDSStatus
  items: Array<{
    menuItemId: string
    name: string
    quantity: number
    notes?: string | null
  }>
  customerName?: string | null
  tableNumber?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface KDSStatusUpdate {
  orderId: string
  status: KDSStatus
}

// Staff types
export interface StaffPerformance {
  staffId: string
  staffName: string
  date: string
  ordersProcessed: number
  totalRevenue: number
  averageOrderValue: number
  itemsSold: number
  refundsIssued: number
  customerRating?: number | null
  efficiencyScore: number
  teamAverageOrders?: number | null
  teamAverageRevenue?: number | null
}

export interface StaffPerformanceFilters {
  startDate?: string
  endDate?: string
  staffId?: string
}
