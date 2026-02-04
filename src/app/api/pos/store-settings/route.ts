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
          invoicePrefix: 'INV',
          startingInvoice: 1,
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
          enableLoyaltyProgram: false,
          enableMultiStore: false,
          enableDelivery: false,
          enableVoiceCommands: false,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
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
          bankName: body.bankName,
          accountNumber: body.accountNumber,
          ifscCode: body.ifscCode,
          invoicePrefix: body.invoicePrefix || 'INV',
          startingInvoice: body.startingInvoice || 1,
          enableTableManagement: body.enableTableManagement ?? false,
          enableKDS: body.enableKDS ?? false,
          enableSizeVariants: body.enableSizeVariants ?? false,
          enableColorVariants: body.enableColorVariants ?? false,
          enableBarcodes: body.enableBarcodes ?? false,
          enableSerialNumbers: body.enableSerialNumbers ?? false,
          enableReturns: body.enableReturns ?? false,
          enableExchanges: body.enableExchanges ?? false,
          enableLoyaltyProgram: body.enableLoyaltyProgram ?? false,
          enableMultiStore: body.enableMultiStore ?? false,
          enableDelivery: body.enableDelivery ?? false,
          enableVoiceCommands: body.enableVoiceCommands ?? false,
          defaultGstRate: body.defaultGstRate || 'EIGHTEEN',
          gstInclusivePricing: body.gstInclusivePricing ?? false,
          footerText: body.footerText,
          termsConditions: body.termsConditions,
        },
      })

      return NextResponse.json({
        success: true,
        data: settings,
      })
    }

    // Update existing settings
    const settings = await db.storeSettings.update({
      where: { id: existingSettings.id },
      data: {
        posType: body.posType,
        storeName: body.storeName,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode,
        invoicePrefix: body.invoicePrefix,
        startingInvoice: body.startingInvoice,
        enableTableManagement: body.enableTableManagement,
        enableKDS: body.enableKDS,
        enableSizeVariants: body.enableSizeVariants,
        enableColorVariants: body.enableColorVariants,
        enableBarcodes: body.enableBarcodes,
        enableSerialNumbers: body.enableSerialNumbers,
        enableReturns: body.enableReturns,
        enableExchanges: body.enableExchanges,
        enableLoyaltyProgram: body.enableLoyaltyProgram,
        enableMultiStore: body.enableMultiStore,
        enableDelivery: body.enableDelivery,
        enableVoiceCommands: body.enableVoiceCommands,
        defaultGstRate: body.defaultGstRate,
        gstInclusivePricing: body.gstInclusivePricing,
        footerText: body.footerText,
        termsConditions: body.termsConditions,
      },
    })

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Error updating store settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update store settings' },
      { status: 500 }
    )
  }
}
