import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantFromRequest } from '@/lib/tenant'

/**
 * Payment API Keys Management API
 * Handles customers adding/editing their payment gateway API keys
 */

// GET - Fetch payment API keys
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const keys = await db.paymentApiKey.findMany({
      where: { organizationId: tenant.organizationId },
      orderBy: { createdAt: 'desc' }
    })

    // Don't expose secrets
    const sanitizedKeys = keys.map(key => ({
      id: key.id,
      provider: key.provider,
      apiKeyId: key.apiKeyId,
      isActive: key.isActive,
      isTestMode: key.isTestMode,
      webhookUrl: key.webhookUrl,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt
    }))

    return NextResponse.json(sanitizedKeys)
  } catch (error) {
    console.error('Error fetching payment keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment API keys' },
      { status: 500 }
    )
  }
}

// POST - Add or update payment API key
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { provider, apiKeyId, apiKeySecret, isTestMode, webhookUrl, webhookSecret, metadata } = body

    if (!provider || !apiKeyId || !apiKeySecret) {
      return NextResponse.json(
        { error: 'Provider, API key ID, and secret are required' },
        { status: 400 }
      )
    }

    // Validate provider
    const validProviders = ['razorpay', 'stripe', 'paytm', 'cashfree', 'payu', 'instamojo', 'ccavenue']
    if (!validProviders.includes(provider.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid provider. Valid providers: ${validProviders.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if key already exists for this provider
    const existing = await db.paymentApiKey.findUnique({
      where: {
        organizationId_provider: {
          organizationId: tenant.organizationId,
          provider: provider.toLowerCase()
        }
      }
    })

    let key
    if (existing) {
      // Update existing key
      key = await db.paymentApiKey.update({
        where: { id: existing.id },
        data: {
          apiKeyId,
          apiKeySecret,
          isActive: true,
          isTestMode: isTestMode ?? true,
          webhookUrl,
          webhookSecret,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      })
    } else {
      // Create new key
      key = await db.paymentApiKey.create({
        data: {
          organizationId: tenant.organizationId,
          provider: provider.toLowerCase(),
          apiKeyId,
          apiKeySecret,
          isActive: true,
          isTestMode: isTestMode ?? true,
          webhookUrl,
          webhookSecret,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      })
    }

    return NextResponse.json({
      success: true,
      key: {
        id: key.id,
        provider: key.provider,
        apiKeyId: key.apiKeyId,
        isActive: key.isActive,
        isTestMode: key.isTestMode,
        webhookUrl: key.webhookUrl,
        createdAt: key.createdAt
      },
      message: existing ? 'Payment API key updated successfully' : 'Payment API key added successfully'
    }, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error('Error saving payment key:', error)
    return NextResponse.json(
      { error: 'Failed to save payment API key' },
      { status: 500 }
    )
  }
}

// PUT - Toggle key active status or update settings
export async function PUT(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { id, isActive, isTestMode, webhookUrl, webhookSecret } = body

    if (!id) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      )
    }

    const key = await db.paymentApiKey.findFirst({
      where: {
        id,
        organizationId: tenant.organizationId
      }
    })

    if (!key) {
      return NextResponse.json(
        { error: 'Payment API key not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (isTestMode !== undefined) updateData.isTestMode = isTestMode
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl
    if (webhookSecret !== undefined) updateData.webhookSecret = webhookSecret

    const updated = await db.paymentApiKey.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      key: {
        id: updated.id,
        provider: updated.provider,
        apiKeyId: updated.apiKeyId,
        isActive: updated.isActive,
        isTestMode: updated.isTestMode,
        webhookUrl: updated.webhookUrl
      },
      message: 'Payment API key updated successfully'
    })
  } catch (error) {
    console.error('Error updating payment key:', error)
    return NextResponse.json(
      { error: 'Failed to update payment API key' },
      { status: 500 }
    )
  }
}

// DELETE - Remove payment API key
export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const provider = searchParams.get('provider')

    if (!id && !provider) {
      return NextResponse.json(
        { error: 'Either API key ID or provider is required' },
        { status: 400 }
      )
    }

    let deleted
    if (id) {
      deleted = await db.paymentApiKey.delete({
        where: {
          id,
          organizationId: tenant.organizationId
        }
      })
    } else {
      deleted = await db.paymentApiKey.delete({
        where: {
          organizationId_provider: {
            organizationId: tenant.organizationId,
            provider: provider!.toLowerCase()
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment API key deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting payment key:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment API key' },
      { status: 500 }
    )
  }
}

// Test API key connection
export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { provider } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    const key = await db.paymentApiKey.findFirst({
      where: {
        provider: provider.toLowerCase(),
        organizationId: tenant.organizationId,
        isActive: true
      }
    })

    if (!key) {
      return NextResponse.json(
        { error: 'No active API key found for this provider' },
        { status: 404 }
      )
    }

    // In production, you would test the actual connection here
    // For now, we just validate that the key exists
    return NextResponse.json({
      success: true,
      message: 'API key is configured',
      details: {
        provider: key.provider,
        isTestMode: key.isTestMode,
        hasWebhook: !!key.webhookUrl
      }
    })
  } catch (error) {
    console.error('Error testing payment key:', error)
    return NextResponse.json(
      { error: 'Failed to test payment API key' },
      { status: 500 }
    )
  }
}
