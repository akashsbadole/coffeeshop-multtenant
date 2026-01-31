import { NextRequest, NextResponse } from 'next/server'

/**
 * POS Configuration API
 * Returns POS type and active features based on environment variables
 */
export async function GET(request: NextRequest) {
  try {
    const posType = process.env.NEXT_PUBLIC_POS_TYPE || 'GENERAL'

    // Define feature sets for each POS type
    const posConfigs = {
      FOOD: {
        posType: 'FOOD',
        name: 'Food & Restaurant POS',
        features: {
          tableManagement: true,
          kitchenDisplay: true,
          modifiers: true,
          sizeVariants: false,
          colorVariants: false,
          barcodes: false,
          serialNumbers: false,
          returns: false,
          exchanges: false,
          loyaltyProgram: true,
          discounts: true,
          refunds: true,
          cashDrawer: true,
          staffPerformance: true,
          giftCards: true,
          orders: true,
          inventory: true,
          reservations: true,
          waitlist: true,
        },
        capabilities: [
          'Table Management',
          'Kitchen Display System (KDS)',
          'Order Modifiers & Customizations',
          'Waitlist Management',
          'Table Reservations',
          'Table Splitting & Merging',
        ],
      },
      GARMENT: {
        posType: 'GARMENT',
        name: 'Garment & Fashion POS',
        features: {
          tableManagement: false,
          kitchenDisplay: false,
          modifiers: false,
          sizeVariants: true,
          colorVariants: true,
          barcodes: true,
          serialNumbers: false,
          returns: true,
          exchanges: true,
          loyaltyProgram: true,
          discounts: true,
          refunds: true,
          cashDrawer: true,
          staffPerformance: true,
          giftCards: true,
          orders: true,
          inventory: true,
          reservations: false,
          waitlist: false,
        },
        capabilities: [
          'Size & Color Variants',
          'Returns & Exchanges',
          'Barcode Scanning',
          'SKU Management',
          'Product Bundles',
          'Size Charts',
        ],
      },
      RETAIL: {
        posType: 'RETAIL',
        name: 'Retail Store POS',
        features: {
          tableManagement: false,
          kitchenDisplay: false,
          modifiers: false,
          sizeVariants: false,
          colorVariants: false,
          barcodes: true,
          serialNumbers: true,
          returns: true,
          exchanges: false,
          loyaltyProgram: true,
          discounts: true,
          refunds: true,
          cashDrawer: true,
          staffPerformance: true,
          giftCards: true,
          orders: true,
          inventory: true,
          reservations: false,
          waitlist: false,
        },
        capabilities: [
          'Barcode Scanning',
          'Serial Number Tracking',
          'Inventory Management',
          'Supplier Management',
          'Purchase Orders',
          'Stock Reorder Alerts',
        ],
      },
      GENERAL: {
        posType: 'GENERAL',
        name: 'Universal POS',
        features: {
          tableManagement: true,
          kitchenDisplay: true,
          modifiers: true,
          sizeVariants: true,
          colorVariants: true,
          barcodes: true,
          serialNumbers: true,
          returns: true,
          exchanges: true,
          loyaltyProgram: true,
          discounts: true,
          refunds: true,
          cashDrawer: true,
          staffPerformance: true,
          giftCards: true,
          orders: true,
          inventory: true,
          reservations: true,
          waitlist: true,
        },
        capabilities: [
          'All Food POS Features',
          'All Garment POS Features',
          'All Retail POS Features',
          'Multi-Store Support',
          'Advanced Analytics',
        ],
      },
    }

    // Get config for the specified POS type, default to GENERAL if unknown
    const config = posConfigs[posType as keyof typeof posConfigs] || posConfigs.GENERAL

    // Override with individual feature flags if they exist in env
    const enableTableManagement = process.env.NEXT_PUBLIC_ENABLE_TABLE_MANAGEMENT === 'true'
    const enableKDS = process.env.NEXT_PUBLIC_ENABLE_KITCHEN_DISPLAY === 'true'
    const enableModifiers = process.env.NEXT_PUBLIC_ENABLE_MODIFIERS === 'true'
    const enableSizeVariants = process.env.NEXT_PUBLIC_ENABLE_SIZE_VARIANTS === 'true'
    const enableColorVariants = process.env.NEXT_PUBLIC_ENABLE_COLOR_VARIANTS === 'true'
    const enableBarcodes = process.env.NEXT_PUBLIC_ENABLE_BARCODES === 'true'
    const enableSerialNumbers = process.env.NEXT_PUBLIC_ENABLE_SERIAL_NUMBERS === 'true'
    const enableReturnsExchanges = process.env.NEXT_PUBLIC_ENABLE_RETURNS_EXCHANGES === 'true'
    const enableLoyaltyProgram = process.env.NEXT_PUBLIC_ENABLE_LOYALTY_PROGRAM === 'true'
    const enableDiscounts = process.env.NEXT_PUBLIC_ENABLE_DISCOUNTS === 'true'
    const enableRefunds = process.env.NEXT_PUBLIC_ENABLE_REFUNDS === 'true'
    const enableCashDrawer = process.env.NEXT_PUBLIC_ENABLE_CASH_DRAWER === 'true'
    const enableStaffPerformance = process.env.NEXT_PUBLIC_ENABLE_STAFF_PERFORMANCE === 'true'
    const enableGiftcards = process.env.NEXT_PUBLIC_ENABLE_GIFTCARDS === 'true'

    // Apply overrides if environment variables are set (they take precedence)
    if (process.env.NEXT_PUBLIC_ENABLE_TABLE_MANAGEMENT !== undefined) {
      config.features.tableManagement = enableTableManagement
    }
    if (process.env.NEXT_PUBLIC_ENABLE_KITCHEN_DISPLAY !== undefined) {
      config.features.kitchenDisplay = enableKDS
    }
    if (process.env.NEXT_PUBLIC_ENABLE_MODIFIERS !== undefined) {
      config.features.modifiers = enableModifiers
    }
    if (process.env.NEXT_PUBLIC_ENABLE_SIZE_VARIANTS !== undefined) {
      config.features.sizeVariants = enableSizeVariants
    }
    if (process.env.NEXT_PUBLIC_ENABLE_COLOR_VARIANTS !== undefined) {
      config.features.colorVariants = enableColorVariants
    }
    if (process.env.NEXT_PUBLIC_ENABLE_BARCODES !== undefined) {
      config.features.barcodes = enableBarcodes
    }
    if (process.env.NEXT_PUBLIC_ENABLE_SERIAL_NUMBERS !== undefined) {
      config.features.serialNumbers = enableSerialNumbers
    }
    if (process.env.NEXT_PUBLIC_ENABLE_RETURNS_EXCHANGES !== undefined) {
      config.features.returns = enableReturnsExchanges
      config.features.exchanges = enableReturnsExchanges
    }
    if (process.env.NEXT_PUBLIC_ENABLE_LOYALTY_PROGRAM !== undefined) {
      config.features.loyaltyProgram = enableLoyaltyProgram
    }
    if (process.env.NEXT_PUBLIC_ENABLE_DISCOUNTS !== undefined) {
      config.features.discounts = enableDiscounts
    }
    if (process.env.NEXT_PUBLIC_ENABLE_REFUNDS !== undefined) {
      config.features.refunds = enableRefunds
    }
    if (process.env.NEXT_PUBLIC_ENABLE_CASH_DRAWER !== undefined) {
      config.features.cashDrawer = enableCashDrawer
    }
    if (process.env.NEXT_PUBLIC_ENABLE_STAFF_PERFORMANCE !== undefined) {
      config.features.staffPerformance = enableStaffPerformance
    }
    if (process.env.NEXT_PUBLIC_ENABLE_GIFTCARDS !== undefined) {
      config.features.giftCards = enableGiftcards
    }

    return NextResponse.json({
      success: true,
      data: config,
    })
  } catch (error) {
    console.error('Error fetching POS config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch POS configuration' },
      { status: 500 }
    )
  }
}
