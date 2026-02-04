import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'

export interface AuthenticatedUser {
  id: string
  email: string
  organizationId: string
  role: Role
  isActive: boolean
}

export interface TenantContext {
  organizationId: string
  organization: {
    id: string
    name: string
    slug: string
    isActive: boolean
    maxUsers: number
    maxStores: number
  }
  subscription: {
    id: string
    status: string
    planId: string
    plan: {
      id: string
      name: string
      type: string
      maxUsers: number
      maxStores: number
      maxMenuItems: number
      maxOrdersPerMonth: number
      features: string
    }
    endDate: Date | null
    nextBillingDate: Date | null
  } | null
  user: AuthenticatedUser
}

export async function getTenantContext(request: NextRequest): Promise<TenantContext | null> {
  const email = request.headers.get('x-user-email')
  
  if (!email) {
    return null
  }

  try {
    const users = await db.user.findMany({
      where: { email },
      include: {
        organization: {
          include: {
            subscriptions: {
              where: {
                status: { in: ['ACTIVE', 'TRIAL'] }
              },
              include: {
                plan: true
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      take: 1
    })

    const user = users[0]
    if (!user || !user.isActive) {
      return null
    }

    const subscription = user.organization?.subscriptions?.[0] || null

    return {
      organizationId: user.organizationId,
      organization: {
        id: user.organization!.id,
        name: user.organization!.name,
        slug: user.organization!.slug,
        isActive: user.organization!.isActive,
        maxUsers: user.organization!.maxUsers,
        maxStores: user.organization!.maxStores
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        planId: subscription.planId,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          type: subscription.plan.type,
          maxUsers: subscription.plan.maxUsers,
          maxStores: subscription.plan.maxStores,
          maxMenuItems: subscription.plan.maxMenuItems || 0,
          maxOrdersPerMonth: subscription.plan.maxOrdersPerMonth || 0,
          features: subscription.plan.features
        },
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate
      } : null,
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
        isActive: user.isActive
      }
    }
  } catch (error) {
    console.error('Error getting tenant context:', error)
    return null
  }
}

export function requireAuth(request: NextRequest): NextResponse | null {
  const tenant = getTenantContextSync(request)
  if (!tenant) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  return null
}

export function requireSubscription(
  request: NextRequest,
  options?: { allowTrial?: boolean; allowedPlans?: string[] }
): NextResponse | null {
  const tenant = getTenantContextSync(request)
  
  if (!tenant) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!tenant.subscription) {
    return NextResponse.json(
      { error: 'No active subscription', message: 'Please subscribe to access this feature' },
      { status: 403 }
    )
  }

  if (tenant.subscription.status === 'SUSPENDED') {
    return NextResponse.json(
      { error: 'Subscription suspended', message: 'Your subscription has been suspended. Please contact support.' },
      { status: 403 }
    )
  }

  if (tenant.subscription.status === 'CANCELLED') {
    return NextResponse.json(
      { error: 'Subscription cancelled', message: 'Your subscription has been cancelled.' },
      { status: 403 }
    )
  }

  if (tenant.subscription.status === 'EXPIRED') {
    return NextResponse.json(
      { error: 'Subscription expired', message: 'Your subscription has expired. Please renew.' },
      { status: 403 }
    )
  }

  if (!options?.allowTrial && tenant.subscription.status === 'TRIAL') {
    return NextResponse.json(
      { error: 'Trial expired', message: 'Your trial has ended. Please subscribe to continue.' },
      { status: 403 }
    )
  }

  if (options?.allowedPlans && !options.allowedPlans.includes(tenant.subscription.plan.type)) {
    return NextResponse.json(
      { error: 'Upgrade required', message: 'This feature requires a higher subscription plan.' },
      { status: 403 }
    )
  }

  return null
}

export function requireRole(request: NextRequest, allowedRoles: Role[]): NextResponse | null {
  const tenant = getTenantContextSync(request)
  
  if (!tenant) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!allowedRoles.includes(tenant.user.role)) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'You do not have permission to access this resource' },
      { status: 403 }
    )
  }

  return null
}

export async function checkFeatureAccess(
  request: NextRequest,
  feature: string
): Promise<{ allowed: boolean; reason?: string }> {
  const tenant = await getTenantContext(request)
  
  if (!tenant) {
    return { allowed: false, reason: 'Not authenticated' }
  }

  if (!tenant.organization.isActive) {
    return { allowed: false, reason: 'Organization is inactive' }
  }

  if (!tenant.subscription) {
    return { allowed: false, reason: 'No subscription' }
  }

  if (['SUSPENDED', 'CANCELLED', 'EXPIRED'].includes(tenant.subscription.status)) {
    return { allowed: false, reason: 'Subscription not active' }
  }

  const features = JSON.parse(tenant.subscription.plan.features)
  if (!features.includes(feature)) {
    return { allowed: false, reason: 'Feature not available in current plan' }
  }

  return { allowed: true }
}

export async function checkResourceLimits(
  request: NextRequest,
  resource: 'users' | 'stores' | 'menuItems'
): Promise<{ allowed: boolean; current: number; limit: number; reason?: string }> {
  const tenant = await getTenantContext(request)
  
  if (!tenant) {
    return { allowed: false, current: 0, limit: 0, reason: 'Not authenticated' }
  }

  if (!tenant.subscription) {
    return { allowed: false, current: 0, limit: 0, reason: 'No subscription' }
  }

  const limit = tenant.subscription.plan[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}`] as number || 0
  
  if (limit === 0) {
    return { allowed: true, current: 0, limit: 0 }
  }

  const current = await countResources(tenant.organizationId, resource)

  if (current >= limit) {
    return { 
      allowed: false, 
      current, 
      limit, 
      reason: `${resource.charAt(0).toUpperCase() + resource.slice(1)} limit reached (${current}/${limit}). Please upgrade your plan.` 
    }
  }

  return { allowed: true, current, limit }
}

async function countResources(
  organizationId: string,
  resource: 'users' | 'stores' | 'menuItems'
): Promise<number> {
  switch (resource) {
    case 'users':
      return db.user.count({ where: { organizationId } })
    case 'stores':
      return db.store.count({ where: { organizationId } })
    case 'menuItems':
      return db.menuItem.count({ where: { organizationId } })
    default:
      return 0
  }
}

export function getTenantContextSync(request: NextRequest): TenantContext | null {
  const email = request.headers.get('x-user-email')
  
  if (!email) {
    return null
  }

  try {
    const user = db.user.findFirst({
      where: { email },
      include: {
        organization: {
          include: {
            subscriptions: {
              where: {
                status: { in: ['ACTIVE', 'TRIAL'] }
              },
              include: {
                plan: true
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    }) as unknown as Promise<TenantContext | null>
    
    return null
  } catch {
    return null
  }
}

export function addTenantHeaders(
  response: NextResponse,
  tenant: TenantContext
): NextResponse {
  response.headers.set('x-organization-id', tenant.organizationId)
  response.headers.set('x-subscription-status', tenant.subscription?.status || 'none')
  response.headers.set('x-plan-type', tenant.subscription?.plan.type || 'none')
  
  return response
}

export const PLAN_FEATURE_GATES: Record<string, string[]> = {
  FREE: ['basic_pos', 'single_store', '3_users', '50_menu_items'],
  BASIC: ['basic_pos', 'multi_store', '10_users', '200_menu_items', 'reports', 'inventory'],
  PROFESSIONAL: [
    'basic_pos', 'multi_store', '25_users', '1000_menu_items', 
    'reports', 'inventory', 'loyalty_program', 'kds', 
    'table_management', 'voice_commands', 'ai_insights'
  ],
  ENTERPRISE: [
    'basic_pos', 'multi_store', 'unlimited_users', 'unlimited_menu_items',
    'all_features', 'priority_support', 'custom_integrations', 
    'api_access', 'white_label', 'multi_location'
  ]
}

export function hasFeature(planType: string, feature: string): boolean {
  const features = PLAN_FEATURE_GATES[planType] || []
  return features.includes(feature) || features.includes('all_features')
}
