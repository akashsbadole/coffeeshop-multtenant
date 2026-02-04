import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export interface ReceiptTemplate {
  id: string
  name: string
  isDefault: boolean
  header: {
    showLogo: boolean
    logoUrl?: string
    title: string
    subtitle?: string
    address?: string
    phone?: string
    email?: string
    gstin?: string
  }
  body: {
    showOrderNumber: boolean
    showDate: boolean
    showCustomerDetails: boolean
    showItemizedList: boolean
    showGSTBreakdown: boolean
    showHSNCode: boolean
    fontSize: 'small' | 'medium' | 'large'
    fontFamily: string
  }
  footer: {
    showThankYouMessage: boolean
    thankYouMessage: string
    showTerms: boolean
    termsText?: string
    showQrCode: boolean
    upiId?: string
    additionalNotes?: string
  }
  styling: {
    primaryColor: string
    backgroundColor: string
    textColor: string
    borderStyle: 'solid' | 'dashed' | 'dotted' | 'none'
    padding: number
    width: number // in mm
  }
}

// GET - Fetch all receipt templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const defaultOnly = searchParams.get('default') === 'true'

    if (id) {
      // Get specific template
      const template = await db.storeSettings.findFirst({
        where: { id }
      })

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        template: JSON.parse(template.footerText || '{}')
      })
    }

    // Get all templates from store settings
    const settings = await db.storeSettings.findMany()
    
    // For now, we'll use store settings as templates
    // In production, you'd have a separate ReceiptTemplate table
    const templates = settings.map(setting => ({
      id: setting.id,
      name: setting.storeName,
      isDefault: setting.invoicePrefix === 'INV',
      header: {
        showLogo: !!setting.logoUrl,
        logoUrl: setting.logoUrl,
        title: setting.storeName,
        subtitle: setting.footerText,
        address: setting.address,
        phone: setting.phone,
        email: setting.email,
        gstin: setting.gstin,
      },
      body: {
        showOrderNumber: true,
        showDate: true,
        showCustomerDetails: true,
        showItemizedList: true,
        showGSTBreakdown: true,
        showHSNCode: true,
        fontSize: 'medium',
        fontFamily: 'Arial, sans-serif',
      },
      footer: {
        showThankYouMessage: true,
        thankYouMessage: 'Thank you for your business!',
        showTerms: !!setting.termsConditions,
        termsText: setting.termsConditions,
        showQrCode: false,
        upiId: '',
        additionalNotes: setting.footerText,
      },
      styling: {
        primaryColor: '#f97316',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderStyle: 'solid',
        padding: 16,
        width: 80,
      }
    }))

    if (defaultOnly) {
      const defaultTemplate = templates.find(t => t.isDefault) || templates[0]
      return NextResponse.json({
        success: true,
        template: defaultTemplate
      })
    }

    return NextResponse.json({
      success: true,
      templates
    })
  } catch (error) {
    console.error('Error fetching receipt templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receipt templates' },
      { status: 500 }
    )
  }
}

// POST - Create new receipt template
export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { name, header, body: templateBody, footer, styling, isDefault = false } = requestBody

    if (!name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
    }

    // Create template in store settings (simplified for now)
    const template = await db.storeSettings.create({
      data: {
        posType: 'GENERAL',
        storeName: name,
        invoicePrefix: isDefault ? 'INV' : 'CUST',
        logoUrl: header?.logoUrl,
        address: header?.address,
        phone: header?.phone,
        email: header?.email,
        gstin: header?.gstin,
        footerText: footer?.thankYouMessage,
        termsConditions: footer?.termsText,
      }
    })

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.storeName,
        isDefault: template.invoicePrefix === 'INV',
        header,
        body: templateBody,
        footer,
        styling
      },
      message: 'Receipt template created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating receipt template:', error)
    return NextResponse.json(
      { error: 'Failed to create receipt template' },
      { status: 500 }
    )
  }
}

// PUT - Update receipt template
export async function PUT(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { id, name, header, body: templateBody, footer, styling, isDefault } = requestBody

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name) updateData.storeName = name
    if (header?.logoUrl !== undefined) updateData.logoUrl = header.logoUrl
    if (header?.address !== undefined) updateData.address = header.address
    if (header?.phone !== undefined) updateData.phone = header.phone
    if (header?.email !== undefined) updateData.email = header.email
    if (header?.gstin !== undefined) updateData.gstin = header.gstin
    if (footer?.thankYouMessage !== undefined) updateData.footerText = footer.thankYouMessage
    if (footer?.termsText !== undefined) updateData.termsConditions = footer.termsText
    if (isDefault !== undefined) updateData.invoicePrefix = isDefault ? 'INV' : 'CUST'

    const template = await db.storeSettings.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.storeName,
        isDefault: template.invoicePrefix === 'INV',
        header,
        body: templateBody,
        footer,
        styling
      },
      message: 'Receipt template updated successfully'
    })
  } catch (error) {
    console.error('Error updating receipt template:', error)
    return NextResponse.json(
      { error: 'Failed to update receipt template' },
      { status: 500 }
    )
  }
}

// DELETE - Delete receipt template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    await db.storeSettings.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Receipt template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting receipt template:', error)
    return NextResponse.json(
      { error: 'Failed to delete receipt template' },
      { status: 500 }
    )
  }
}
