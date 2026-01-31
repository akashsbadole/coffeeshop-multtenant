import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'all' // all, users, products, categories, orders

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Fetch data based on type
    let exportData: any = {}

    if (type === 'all' || type === 'users') {
      const usersRes = await fetch(`${baseUrl}/api/users`)
      if (usersRes.ok) {
        const users = await usersRes.json()
        exportData.users = users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }))
      }
    }

    if (type === 'all' || type === 'products') {
      const productsRes = await fetch(`${baseUrl}/api/pos/menu-items`)
      if (productsRes.ok) {
        const products = await productsRes.json()
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
    }

    if (type === 'all' || type === 'categories') {
      const categoriesRes = await fetch(`${baseUrl}/api/pos/categories`)
      if (categoriesRes.ok) {
        const categories = await categoriesRes.json()
        exportData.categories = categories
      }
    }

    if (type === 'all' || type === 'orders') {
      const ordersRes = await fetch(`${baseUrl}/api/pos/orders?limit=1000`)
      if (ordersRes.ok) {
        const orders = await ordersRes.json()
        exportData.orders = orders.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          paymentMethod: order.paymentMethod,
          status: order.status,
          subtotal: order.subtotal,
          cgst: order.cgst,
          sgst: order.sgst,
          totalGst: order.totalGst,
          totalAmount: order.totalAmount,
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
    }

    exportData.exportedAt = new Date().toISOString()
    exportData.version = '1.0.0'

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="coffee-shop-export-${type}-${new Date().toISOString().split('T')[0]}.json"`
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
