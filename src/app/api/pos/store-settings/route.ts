import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Fetch store settings (create default if not exists)
export async function GET() {
  try {
    let settings = await db.storeSettings.findFirst()
    
    if (!settings) {
      // Create default settings if none exist
      settings = await db.storeSettings.create({
        data: {
          posType: 'GENERAL',
          storeName: 'Universal POS',
          address: '',
          phone: '',
          email: '',
          logoUrl: null,
          gstin: '',
          state: '',
          stateCode: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          invoicePrefix: 'INV',
          startingInvoice: 1,
          currency: 'INR',
          footerText: '',
          termsConditions: '',
          defaultGstRate: 'EIGHTEEN',
          gstInclusivePricing: false,
          enableTableManagement: false,
          enableKDS: false,
          enableSizeVariants: false,
          enableColorVariants: false,
          enableBarcodes: false,
          enableSerialNumbers: false,
          enableReturns: false,
          enableExchanges: false,
          enableGiftCards: false,
          enableLoyaltyProgram: false,
          enableMultiStore: false,
          enableDelivery: false,
          enableVoiceCommands: false,
          enableStaffManagement: false,
          showImages: false,
          autoLogout: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        storeId: settings.storeId,
        posType: settings.posType,
        storeName: settings.storeName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        logoUrl: settings.logoUrl,
        gstin: settings.gstin,
        state: settings.state,
        stateCode: settings.stateCode,
        bankName: settings.bankName,
        accountNumber: settings.accountNumber,
        ifscCode: settings.ifscCode,
        invoicePrefix: settings.invoicePrefix,
        startingInvoice: settings.startingInvoice,
        currency: settings.currency,
        footerText: settings.footerText,
        termsConditions: settings.termsConditions,
        defaultGstRate: settings.defaultGstRate,
        gstInclusivePricing: settings.gstInclusivePricing,
        enableTableManagement: settings.enableTableManagement,
        enableKDS: settings.enableKDS,
        enableSizeVariants: settings.enableSizeVariants,
        enableColorVariants: settings.enableColorVariants,
        enableBarcodes: settings.enableBarcodes,
        enableSerialNumbers: settings.enableSerialNumbers,
        enableReturns: settings.enableReturns,
        enableExchanges: settings.enableExchanges,
        enableGiftCards: settings.enableGiftCards,
        enableLoyaltyProgram: settings.enableLoyaltyProgram,
        enableMultiStore: settings.enableMultiStore,
        enableDelivery: settings.enableDelivery,
        enableVoiceCommands: settings.enableVoiceCommands,
        enableStaffManagement: settings.enableStaffManagement,
        showImages: settings.showImages,
        autoLogout: settings.autoLogout,
      },
    })
  } catch (error) {
    console.error('Error fetching store settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch store settings' },
      { status: 500 }
    )
  }
}

// PUT: Update store settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if settings exist, create if not
    const existingSettings = await db.storeSettings.findFirst()

    if (!existingSettings) {
      // Create new settings with provided data
      const settings = await db.storeSettings.create({
        data: {
          posType: body.posType || 'GENERAL',
          storeName: body.storeName,
          address: body.address,
          phone: body.phone,
          email: body.email,
          logoUrl: body.logoUrl,
          gstin: body.gstin,
          state: body.state,
          stateCode: body.stateCode,
          bankName: body.bankName,
          accountNumber: body.accountNumber,
          ifscCode: body.ifscCode,
          invoicePrefix: body.invoicePrefix || 'INV',
          startingInvoice: body.startingInvoice || 1,
          currency: body.currency || 'INR',
          footerText: body.footerText,
          termsConditions: body.termsConditions,
          defaultGstRate: body.defaultGstRate || 'EIGHTEEN',
          gstInclusivePricing: body.gstInclusivePricing ?? false,
          enableTableManagement: body.enableTableManagement ?? false,
          enableKDS: body.enableKDS ?? false,
          enableSizeVariants: body.enableSizeVariants ?? false,
          enableColorVariants: body.enableColorVariants ?? false,
          enableBarcodes: body.enableBarcodes ?? false,
          enableSerialNumbers: body.enableSerialNumbers ?? false,
          enableReturns: body.enableReturns ?? false,
          enableExchanges: body.enableExchanges ?? false,
          enableGiftCards: body.enableGiftCards ?? false,
          enableLoyaltyProgram: body.enableLoyaltyProgram ?? false,
          enableMultiStore: body.enableMultiStore ?? false,
          enableDelivery: body.enableDelivery ?? false,
          enableVoiceCommands: body.enableVoiceCommands ?? false,
          enableStaffManagement: body.enableStaffManagement ?? false,
          showImages: body.showImages ?? false,
          autoLogout: body.autoLogout ?? true,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          id: settings.id,
          storeId: settings.storeId,
          posType: settings.posType,
          storeName: settings.storeName,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          logoUrl: settings.logoUrl,
          gstin: settings.gstin,
          state: settings.state,
          stateCode: settings.stateCode,
          bankName: settings.bankName,
          accountNumber: settings.accountNumber,
          ifscCode: settings.ifscCode,
          invoicePrefix: settings.invoicePrefix,
          startingInvoice: settings.startingInvoice,
          currency: settings.currency,
          footerText: settings.footerText,
          termsConditions: settings.termsConditions,
          defaultGstRate: settings.defaultGstRate,
          gstInclusivePricing: settings.gstInclusivePricing,
          enableTableManagement: settings.enableTableManagement,
          enableKDS: settings.enableKDS,
          enableSizeVariants: settings.enableSizeVariants,
          enableColorVariants: settings.enableColorVariants,
          enableBarcodes: settings.enableBarcodes,
          enableSerialNumbers: settings.enableSerialNumbers,
          enableReturns: settings.enableReturns,
          enableExchanges: settings.enableExchanges,
          enableGiftCards: settings.enableGiftCards,
          enableLoyaltyProgram: settings.enableLoyaltyProgram,
          enableMultiStore: settings.enableMultiStore,
          enableDelivery: settings.enableDelivery,
          enableVoiceCommands: settings.enableVoiceCommands,
          enableStaffManagement: settings.enableStaffManagement,
          showImages: settings.showImages,
          autoLogout: settings.autoLogout,
        },
      })
    }

    // Update existing settings
    const settings = await db.storeSettings.update({
      where: { id: existingSettings.id },
      data: {
        posType: body.posType,
        storeName: body.storeName,
        address: body.address,
        phone: body.phone,
        email: body.email,
        logoUrl: body.logoUrl,
        gstin: body.gstin,
        state: body.state,
        stateCode: body.stateCode,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode,
        invoicePrefix: body.invoicePrefix,
        startingInvoice: body.startingInvoice,
        currency: body.currency,
        footerText: body.footerText,
        termsConditions: body.termsConditions,
        defaultGstRate: body.defaultGstRate,
        gstInclusivePricing: body.gstInclusivePricing,
        enableTableManagement: body.enableTableManagement,
        enableKDS: body.enableKDS,
        enableSizeVariants: body.enableSizeVariants,
        enableColorVariants: body.enableColorVariants,
        enableBarcodes: body.enableBarcodes,
        enableSerialNumbers: body.enableSerialNumbers,
        enableReturns: body.enableReturns,
        enableExchanges: body.enableExchanges,
        enableGiftCards: body.enableGiftCards,
        enableLoyaltyProgram: body.enableLoyaltyProgram,
        enableMultiStore: body.enableMultiStore,
        enableDelivery: body.enableDelivery,
        enableVoiceCommands: body.enableVoiceCommands,
        enableStaffManagement: body.enableStaffManagement,
        showImages: body.showImages,
        autoLogout: body.autoLogout,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        storeId: settings.storeId,
        posType: settings.posType,
        storeName: settings.storeName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        logoUrl: settings.logoUrl,
        gstin: settings.gstin,
        state: settings.state,
        stateCode: settings.stateCode,
        bankName: settings.bankName,
        accountNumber: settings.accountNumber,
        ifscCode: settings.ifscCode,
        invoicePrefix: settings.invoicePrefix,
        startingInvoice: settings.startingInvoice,
        currency: settings.currency,
        footerText: settings.footerText,
        termsConditions: settings.termsConditions,
        defaultGstRate: settings.defaultGstRate,
        gstInclusivePricing: settings.gstInclusivePricing,
        enableTableManagement: settings.enableTableManagement,
        enableKDS: settings.enableKDS,
        enableSizeVariants: settings.enableSizeVariants,
        enableColorVariants: settings.enableColorVariants,
        enableBarcodes: settings.enableBarcodes,
        enableSerialNumbers: settings.enableSerialNumbers,
        enableReturns: settings.enableReturns,
        enableExchanges: settings.enableExchanges,
        enableGiftCards: settings.enableGiftCards,
        enableLoyaltyProgram: settings.enableLoyaltyProgram,
        enableMultiStore: settings.enableMultiStore,
        enableDelivery: settings.enableDelivery,
        enableVoiceCommands: settings.enableVoiceCommands,
        enableStaffManagement: settings.enableStaffManagement,
        showImages: settings.showImages,
        autoLogout: settings.autoLogout,
      },
    })
  } catch (error) {
    console.error('Error updating store settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update store settings' },
      { status: 500 }
    )
  }
}
