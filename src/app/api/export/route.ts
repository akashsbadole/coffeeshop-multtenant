import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'all'
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const exportData: any = {
      organizationId,
      exportedAt: new Date().toISOString(),
      version: '2.0.0'
    }

    if (type === 'all' || type === 'users') {
      const users = await db.user.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true
        }
      })
      exportData.users = users
    }

    if (type === 'all' || type === 'products') {
      const products = await db.menuItem.findMany({
        where: { organizationId },
        include: {
          category: {
            select: { name: true }
          }
        }
      })
      exportData.products = products.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        gstRate: product.gstRate,
        hsnCode: product.hsnCode,
        categoryId: product.categoryId,
        categoryName: product.category?.name,
        isAvailable: product.isAvailable,
        createdAt: product.createdAt
      }))
    }

    if (type === 'all' || type === 'categories') {
      const categories = await db.category.findMany({
        where: { organizationId }
      })
      exportData.categories = categories
    }

    if (type === 'all' || type === 'orders') {
      const orders = await db.order.findMany({
        where: { organizationId },
        include: {
          items: {
            include: {
              menuItem: {
                select: { name: true }
              }
            }
          }
        },
        take: 1000,
        orderBy: { createdAt: 'desc' }
      })
      exportData.orders = orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        subtotal: order.subtotal,
        cgst: order.cgst,
        sgst: order.sgst,
        totalGst: order.totalGst,
        notes: order.notes,
        createdAt: order.createdAt,
        items: order.items?.map((item: any) => ({
          menuItemId: item.menuItemId,
          menuItemName: item.menuItem?.name,
          quantity: item.quantity,
          price: item.price,
          gstRate: item.gstRate,
          gstAmount: item.gstAmount,
          subtotal: item.subtotal
        }))
      }))
    }

    if (type === 'all' || type === 'stores') {
      const stores = await db.store.findMany({
        where: { organizationId }
      })
      exportData.stores = stores
    }

    if (type === 'all' || type === 'customers') {
      const customers = await db.customer.findMany({
        where: { organizationId }
      })
      exportData.customers = customers
    }

    if (type === 'all' || type === 'inventory') {
      const inventory = await db.inventoryItem.findMany({
        where: {
          menuItem: {
            organizationId
          }
        },
        include: {
          menuItem: {
            select: { name: true }
          }
        }
      })
      exportData.inventory = inventory
    }

    if (type === 'all' || type === 'discounts') {
      const discounts = await db.discount.findMany()
      exportData.discounts = discounts
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="tenant-export-${organizationId}-${type}-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
