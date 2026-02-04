import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('x-session-token')
    const userId = request.headers.get('x-user-id')
    
    if (!sessionToken || !userId) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      )
    }

    const user = await db.user.findFirst({
      where: { id: userId },
      include: { organization: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    const { password: _, organization, ...safeUser } = user
    const organizationWithoutSensitive = organization ? {
      id: organization.id,
      name: organization.name,
      email: organization.email,
      phone: organization.phone,
      gstin: organization.gstin,
      address: organization.address,
      city: organization.city,
      state: organization.state,
      pincode: organization.pincode,
      country: organization.country,
      timezone: organization.timezone,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt
    } : null

    return NextResponse.json({
      ...safeUser,
      organization: organizationWithoutSensitive
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    )
  }
}
