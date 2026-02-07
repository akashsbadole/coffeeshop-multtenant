import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Register new user with organization and optional subscription
 * POST /api/auth/register
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      password, 
      role,
      organizationName,
      planId,
      billingCycle = 'MONTHLY'
    } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      )
    }

    // Clean phone number (remove non-numeric characters)
    const cleanedPhone = phone.replace(/\D/g, '')

    if (cleanedPhone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    // Check if user with this phone already exists
    const existingUserByPhone = await db.user.findFirst({
      where: { phone: cleanedPhone }
    })

    if (existingUserByPhone) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 409 }
      )
    }

    // If organization name is provided, create organization with subscription
    let organization: Awaited<ReturnType<typeof db.organization.create>> | null = null
    let subscription: Awaited<ReturnType<typeof db.tenantSubscription.create>> | null = null
    let checkoutUrl: string | null = null

    if (organizationName) {
      // Generate slug from organization name
      const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

      // Create organization
      organization = await db.organization.create({
        data: {
          name: organizationName,
          slug,
          email: email || `${slug}@example.com`,
          phone: cleanedPhone,
        }
      })

      // Check if user with this email already exists in this organization
      if (email) {
        const existingUserByEmail = await db.user.findFirst({
          where: { 
            organizationId: organization.id,
            email: email
          }
        })

        if (existingUserByEmail) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 409 }
          )
        }
      }

      // If plan is selected, create subscription
      if (planId) {
        const plan = await db.subscriptionPlan.findUnique({
          where: { id: planId }
        })

        if (!plan) {
          return NextResponse.json(
            { error: 'Invalid subscription plan' },
            { status: 400 }
          )
        }

        // Calculate dates based on billing cycle
        const startDate = new Date()
        const endDate = new Date()
        
        if (plan.type === 'FREE') {
          endDate.setFullYear(endDate.getFullYear() + 1)
        } else if (billingCycle === 'MONTHLY') {
          endDate.setMonth(endDate.getMonth() + 1)
        } else if (billingCycle === 'QUARTERLY') {
          endDate.setMonth(endDate.getMonth() + 3)
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1)
        }

        // For free plans, activate immediately
        if (plan.type === 'FREE') {
          subscription = await db.tenantSubscription.create({
            data: {
              organizationId: organization.id,
              planId: plan.id,
              status: 'ACTIVE',
              billingCycle: 'YEARLY',
              startDate,
              endDate,
              autoRenew: true,
            }
          })
        } else {
          // For paid plans, create pending subscription
          subscription = await db.tenantSubscription.create({
            data: {
              organizationId: organization.id,
              planId: plan.id,
              status: 'PENDING',
              billingCycle,
              startDate,
              endDate,
              autoRenew: true,
              paymentStatus: 'pending',
            }
          })

          // Create payment record
          const price = billingCycle === 'YEARLY' && plan.yearlyPrice 
            ? plan.yearlyPrice 
            : plan.price

          await db.subscriptionPayment.create({
            data: {
              subscriptionId: subscription.id,
              organizationId: organization.id,
              amount: price,
              currency: plan.currency,
              paymentMethod: 'razorpay',
              paymentStatus: 'pending',
            }
          })

          // Generate checkout URL
          checkoutUrl = `/checkout/${subscription.id}?amount=${price}&currency=${plan.currency}`
        }

        // Update organization limits based on plan
        await db.organization.update({
          where: { id: organization.id },
          data: {
            maxUsers: plan.maxUsers,
            maxStores: plan.maxStores,
          }
        })
      }
    }

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email: email || `${cleanedPhone}@example.com`,
        phone: cleanedPhone,
        password: password || 'password123',
        role: role || 'ADMIN',
        isActive: true,
        organizationId: organization?.id || '',
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      organization: organization ? {
        id: organization.id,
        name: organization.name,
      } : null,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        planId: subscription.planId,
      } : null,
      checkoutUrl,
      message: organization 
        ? 'Registration successful. ' + (planId ? 'Complete payment to activate subscription.' : 'Organization created with free plan.')
        : 'Registration successful'
    }, { status: 201 })
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
