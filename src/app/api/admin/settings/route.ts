import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/admin/settings
 * Get system settings
 */
export async function GET() {
  try {
    let settings = await db.systemSettings.findFirst()

    if (!settings) {
      // Create default settings if they don't exist
      settings = await db.systemSettings.create({
        data: {},
      })
    }

    return NextResponse.json({
      settings: {
        id: settings.id,
        subscriptionEnabled: settings.subscription_enabled,
        trialDays: settings.trial_days,
        freePlanEnabled: settings.free_plan_enabled,
        paymentGateway: settings.payment_gateway,
        invoicePrefix: settings.invoice_prefix,
      },
    })
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/settings
 * Update system settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionEnabled, trialDays, freePlanEnabled, paymentGateway, invoicePrefix } = body

    let settings = await db.systemSettings.findFirst()

    if (!settings) {
      // Create settings if they don't exist
      settings = await db.systemSettings.create({
        data: {},
      })
    }

    const updatedSettings = await db.systemSettings.update({
      where: { id: settings.id },
      data: {
        subscription_enabled: subscriptionEnabled ?? settings.subscription_enabled,
        trial_days: trialDays ?? settings.trial_days,
        free_plan_enabled: freePlanEnabled ?? settings.free_plan_enabled,
        payment_gateway: paymentGateway ?? settings.payment_gateway,
        invoice_prefix: invoicePrefix ?? settings.invoice_prefix,
      },
    })

    return NextResponse.json({
      success: true,
      settings: {
        id: updatedSettings.id,
        subscriptionEnabled: updatedSettings.subscription_enabled,
        trialDays: updatedSettings.trial_days,
        freePlanEnabled: updatedSettings.free_plan_enabled,
        paymentGateway: updatedSettings.payment_gateway,
        invoicePrefix: updatedSettings.invoice_prefix,
      },
    })
  } catch (error) {
    console.error('Error updating system settings:', error)
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    )
  }
}
