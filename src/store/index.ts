// Modular Zustand Store Architecture for Coffee Shop POS
// This file exports all domain-specific stores and shared types

// Export all stores
export { useAuthStore } from './auth'
export { useMenuStore } from './menu'
export { useCartStore } from './cart'
export { useOrdersStore } from './orders'
export { useCheckoutStore } from './checkout'
export { useUIStore } from './ui'
export { usePOSConfigStore } from './pos-config'
export { useReportsStore } from './reports'
export { useReceiptsStore } from './receipts'
export { useTablesStore } from './tables'
export { useVariantsStore } from './variants'
export { useBarcodeStore } from './barcode'
export { useReturnsStore } from './returns'
export { useCashDrawerStore } from './cash-drawer'
export { useGiftCardsStore } from './gift-cards'
export { useProfileStore } from './profile'
export { useAdminStore } from './admin'
export { useAIInsightsStore } from './ai-insights'
export { useLoyaltyStore } from './loyalty'
export { useDiscountsStore } from './discounts'
export { useKDSStore } from './kds'
export { useStaffStore } from './staff'
export { useTenantStore } from './tenant'

// Re-export all types from types.ts
export type {
  POSConfig,
  User,
  MenuItem,
  Category,
  CartItem,
  Order,
  HeldOrder,
  Table,
  Variant,
  GiftCard,
  InventoryItem,
  ReturnItem,
  CashDrawer,
  ReportData,
  AIInsight,
  AIInsightsData,
  ReceiptData,
  LoginData,
  SmsLoginData,
  ProfileData,
  PasswordData,
  ReportType,
  PaymentMethod,
  LoginTab,
  GstRate,
  TableStatus,
  VariantType,
  GiftCardStatus,
  ReturnStatus,
  CashDrawerStatus,
  AIInsightType,
  AIInsightPriority,
  LoyaltyTier,
  Customer,
  LoyaltyHistory,
  LoyaltyRegistration,
  LoyaltyRedemption,
  DiscountType,
  DiscountStatus,
  Discount,
  DiscountApplication,
  DiscountResult,
  KDSStatus,
  KDSOrder,
  KDSStatusUpdate,
  StaffPerformance,
  StaffPerformanceFilters,
} from './types'

// Export multi-tenancy types
export type {
  Organization,
  SubscriptionPlan,
  TenantSubscription,
  SubscriptionStatus,
  BillingCycle,
  PlanType,
  CreateOrganizationData,
  UpdateOrganizationData,
  CreateSubscriptionData,
  UpdateSubscriptionData,
} from './types'
