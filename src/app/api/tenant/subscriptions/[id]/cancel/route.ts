import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscription = await db.tenantSubscription.findUnique({
      where: { id: params.id }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const updatedSubscription = await db.tenantSubscription.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        autoRenew: false
      },
      include: {
        organization: true,
        plan: true
      }
    })

    return NextResponse.json(updatedSubscription)
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
