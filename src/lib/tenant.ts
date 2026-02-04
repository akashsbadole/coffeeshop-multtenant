import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export interface TenantContext {
  organizationId: string
  organization?: any
}

export async function getTenantContextFromEmail(email: string): Promise<TenantContext | null> {
  try {
    const users = await db.user.findMany({
      where: { email },
      include: {
        organization: true
      },
      take: 1
    })

    const user = users[0]
    if (!user) {
      return null
    }

    return {
      organizationId: user.organizationId,
      organization: user.organization
    }
  } catch (error) {
    console.error('Error getting tenant context:', error)
    return null
  }
}

export async function getTenantFromRequest(req: NextRequest): Promise<TenantContext | null> {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return null
    }

    const email = req.headers.get('x-user-email')
    if (!email) {
      return null
    }

    return await getTenantContextFromEmail(email)
  } catch (error) {
    console.error('Error getting tenant from request:', error)
    return null
  }
}

export function tenantResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}

export function tenantError(message: string, status: number = 400, details?: any) {
  const error: any = { error: message }
  if (details) {
    error.details = details
  }
  return NextResponse.json(error, { status })
}

export async function checkSubscriptionLimits(organizationId: string): Promise<{
  allowed: boolean
  reason?: string
  current: any
  limits: any
}> {
  try {
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['ACTIVE', 'TRIAL']
            }
          },
          include: {
            plan: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!organization) {
      return { allowed: false, reason: 'Organization not found', current: null, limits: null }
    }

    if (!organization.subscriptions || organization.subscriptions.length === 0) {
      return { allowed: false, reason: 'No active subscription', current: null, limits: null }
    }

    const subscription = organization.subscriptions[0]
    const plan = subscription.plan

    const currentUsers = await db.user.count({
      where: { organizationId }
    })

    const currentStores = await db.store.count({
      where: { organizationId }
    })

    const currentMenuItems = await db.menuItem.count({
      where: { organizationId }
    })

    const current = {
      users: currentUsers,
      stores: currentStores,
      menuItems: currentMenuItems
    }

    const limits = {
      users: plan.maxUsers,
      stores: plan.maxStores,
      menuItems: plan.maxMenuItems || Infinity,
      ordersPerMonth: plan.maxOrdersPerMonth || Infinity
    }

    if (currentUsers >= plan.maxUsers) {
      return { allowed: false, reason: 'User limit reached', current, limits }
    }

    if (currentStores >= plan.maxStores) {
      return { allowed: false, reason: 'Store limit reached', current, limits }
    }

    if (currentMenuItems >= (plan.maxMenuItems || Infinity)) {
      return { allowed: false, reason: 'Menu item limit reached', current, limits }
    }

    return { allowed: true, current, limits }
  } catch (error) {
    console.error('Error checking subscription limits:', error)
    return { allowed: false, reason: 'Error checking limits', current: null, limits: null }
  }
}

export async function withTenantContext(
  handler: (req: NextRequest, tenant: TenantContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const email = req.headers.get('x-user-email')
    if (!email) {
      return tenantError('Unauthorized - missing user email', 401)
    }

    const tenant = await getTenantContextFromEmail(email)
    if (!tenant) {
      return tenantError('Tenant not found', 404)
    }

    return handler(req, tenant)
  }
}
