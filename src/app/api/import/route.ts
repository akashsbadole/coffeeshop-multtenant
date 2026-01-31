import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, type } = body

    if (!data) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      )
    }

    const results: any = {
      imported: {},
      errors: []
    }

    // Import Users
    if (type === 'all' || type === 'users') {
      if (data.users && Array.isArray(data.users)) {
        let importedCount = 0
        for (const user of data.users) {
          try {
            // Check if user already exists by email
            const existingUser = await db.user.findUnique({
              where: { email: user.email }
            })

            if (!existingUser) {
              await db.user.create({
                data: {
                  name: user.name,
                  email: user.email,
                  password: user.password || 'coffee123', // Default password
                  role: user.role || 'CASHIER'
                }
              })
              importedCount++
            }
          } catch (error) {
            results.errors.push({
              entity: 'user',
              data: user.email,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
        results.imported.users = importedCount
      }
    }

    // Import Categories
    if (type === 'all' || type === 'categories') {
      if (data.categories && Array.isArray(data.categories)) {
        let importedCount = 0
        for (const category of data.categories) {
          try {
            const existingCategory = await db.category.findFirst({
              where: { name: category.name }
            })

            if (!existingCategory) {
              await db.category.create({
                data: {
                  name: category.name
                }
              })
              importedCount++
            }
          } catch (error) {
            results.errors.push({
              entity: 'category',
              data: category.name,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
        results.imported.categories = importedCount
      }
    }

    // Import Products (Menu Items)
    if (type === 'all' || type === 'products') {
      if (data.products && Array.isArray(data.products)) {
        let importedCount = 0
        for (const product of data.products) {
          try {
            // Find or create category
            let categoryId = product.categoryId
            if (!categoryId && product.categoryName) {
              const category = await db.category.findFirst({
                where: { name: product.categoryName }
              })
              if (category) {
                categoryId = category.id
              }
            }

            if (!categoryId) {
              results.errors.push({
                entity: 'product',
                data: product.name,
                error: 'No valid category found'
              })
              continue
            }

            // Check if product already exists
            const existingProduct = await db.menuItem.findFirst({
              where: { name: product.name }
            })

            if (!existingProduct) {
              await db.menuItem.create({
                data: {
                  name: product.name,
                  description: product.description || null,
                  price: parseFloat(product.price),
                  gstRate: product.gstRate || '5',
                  hsnCode: product.hsnCode || null,
                  categoryId: categoryId,
                  isAvailable: product.isAvailable !== undefined ? product.isAvailable : true
                }
              })
              importedCount++
            }
          } catch (error) {
            results.errors.push({
              entity: 'product',
              data: product.name,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
        results.imported.products = importedCount
      }
    }

    // Import Orders (Note: This is for backup restoration, not for importing new orders)
    if (type === 'all' || type === 'orders') {
      if (data.orders && Array.isArray(data.orders)) {
        let importedCount = 0
        for (const order of data.orders) {
          try {
            // Check if order already exists
            const existingOrder = await db.order.findFirst({
              where: { orderNumber: order.orderNumber }
            })

            if (!existingOrder) {
              // Create order with items
              const createdOrder = await db.order.create({
                data: {
                  orderNumber: order.orderNumber,
                  customerName: order.customerName || null,
                  customerPhone: order.customerPhone || null,
                  paymentMethod: order.paymentMethod || 'CASH',
                  status: order.status || 'COMPLETED',
                  subtotal: parseFloat(order.subtotal) || 0,
                  cgst: parseFloat(order.cgst) || 0,
                  sgst: parseFloat(order.sgst) || 0,
                  totalGst: parseFloat(order.totalGst) || 0,
                  totalAmount: parseFloat(order.totalAmount) || 0,
                  notes: order.notes || null
                }
              })

              // Create order items
              if (order.items && Array.isArray(order.items)) {
                for (const item of order.items) {
                  const menuItem = await db.menuItem.findFirst({
                    where: { name: item.menuItemName }
                  })

                  if (menuItem) {
                    await db.orderItem.create({
                      data: {
                        orderId: createdOrder.id,
                        menuItemId: menuItem.id,
                        quantity: item.quantity,
                        price: parseFloat(item.price),
                        gstRate: item.gstRate,
                        gstAmount: parseFloat(item.gstAmount),
                        subtotal: parseFloat(item.subtotal)
                      }
                    })
                  }
                }
              }

              importedCount++
            }
          } catch (error) {
            results.errors.push({
              entity: 'order',
              data: order.orderNumber,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
        results.imported.orders = importedCount
      }
    }

    results.summary = {
      totalImported: Object.values(results.imported).reduce((a: number, b: number) => a + b, 0),
      totalErrors: results.errors.length,
      importedAt: new Date().toISOString()
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
