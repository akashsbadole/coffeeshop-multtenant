import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const organization = await db.organization.findUnique({
      where: { id: organizationId },
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
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const subscription = organization.subscriptions[0]
    const plan = subscription?.plan

    const [userCount, storeCount, menuItemCount, orderCount, customerCount] = await Promise.all([
      db.user.count({ where: { organizationId } }),
      db.store.count({ where: { organizationId } }),
      db.menuItem.count({ where: { organizationId } }),
      db.order.count({ 
        where: { 
          organizationId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      db.customer.count({ where: { organizationId } })
    ])

    const usage = {
      users: {
        current: userCount,
        limit: plan?.maxUsers || 0,
        percentage: plan?.maxUsers ? (userCount / plan.maxUsers) * 100 : 0
      },
      stores: {
        current: storeCount,
        limit: plan?.maxStores || 0,
        percentage: plan?.maxStores ? (storeCount / plan.maxStores) * 100 : 0
      },
      menuItems: {
        current: menuItemCount,
        limit: plan?.maxMenuItems || 0,
        percentage: plan?.maxMenuItems ? (menuItemCount / plan.maxMenuItems) * 100 : 0
      },
      orders: {
        current: orderCount,
        limit: plan?.maxOrdersPerMonth || 0,
        percentage: plan?.maxOrdersPerMonth ? (orderCount / plan.maxOrdersPerMonth) * 100 : 0
      },
      customers: {
        current: customerCount,
        limit: null
      }
    }

    const warnings: string[] = []
    if (usage.users.percentage >= 80) {
      warnings.push(`User limit is ${usage.users.percentage.toFixed(0)}% full`)
    }
    if (usage.stores.percentage >= 80) {
      warnings.push(`Store limit is ${usage.stores.percentage.toFixed(0)}% full`)
    }
    if (usage.menuItems.percentage >= 80) {
      warnings.push(`Menu item limit is ${usage.menuItems.percentage.toFixed(0)}% full`)
    }
    if (usage.orders.percentage >= 80) {
      warnings.push(`Monthly order limit is ${usage.orders.percentage.toFixed(0)}% full`)
    }

    return NextResponse.json({
      usage,
      warnings,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        plan: plan?.name,
        planType: plan?.type,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        autoRenew: subscription.autoRenew
      } : null,
      plan: plan ? {
        id: plan.id,
        name: plan.name,
        type: plan.type,
        features: JSON.parse(plan.features),
        limits: {
          maxUsers: plan.maxUsers,
          maxStores: plan.maxStores,
          maxMenuItems: plan.maxMenuItems,
          maxOrdersPerMonth: plan.maxOrdersPerMonth
        }
      } : null
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}
