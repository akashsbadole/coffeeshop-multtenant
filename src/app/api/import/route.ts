import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, type, organizationId } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      )
    }

    const organization = await db.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const results: any = {
      imported: {},
      errors: [],
      organizationId
    }

    if (type === 'all' || type === 'categories') {
      if (data.categories && Array.isArray(data.categories)) {
        let importedCount = 0
        for (const category of data.categories) {
          try {
            const existingCategory = await db.category.findFirst({
              where: {
                name: category.name,
                organizationId
              }
            })

            if (!existingCategory) {
              await db.category.create({
                data: {
                  name: category.name,
                  description: category.description,
                  displayOrder: category.displayOrder || 0,
                  isActive: category.isActive !== undefined ? category.isActive : true,
                  organizationId
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

    if (type === 'all' || type === 'products') {
      if (data.products && Array.isArray(data.products)) {
        let importedCount = 0
        for (const product of data.products) {
          try {
            let categoryId = product.categoryId
            if (!categoryId && product.categoryName) {
              const category = await db.category.findFirst({
                where: {
                  name: product.categoryName,
                  organizationId
                }
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

            const existingProduct = await db.menuItem.findFirst({
              where: {
                name: product.name,
                organizationId
              }
            })

            if (!existingProduct) {
              await db.menuItem.create({
                data: {
                  name: product.name,
                  description: product.description || null,
                  price: parseFloat(product.price),
                  gstRate: product.gstRate || 'FIVE',
                  hsnCode: product.hsnCode || null,
                  categoryId: categoryId,
                  isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
                  organizationId
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

    if (type === 'all' || type === 'customers') {
      if (data.customers && Array.isArray(data.customers)) {
        let importedCount = 0
        for (const customer of data.customers) {
          try {
            const existingCustomer = await db.customer.findFirst({
              where: {
                phone: customer.phone,
                organizationId
              }
            })

            if (!existingCustomer) {
              await db.customer.create({
                data: {
                  name: customer.name,
                  phone: customer.phone,
                  email: customer.email,
                  address: customer.address,
                  organizationId
                }
              })
              importedCount++
            }
          } catch (error) {
            results.errors.push({
              entity: 'customer',
              data: customer.phone,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
        results.imported.customers = importedCount
      }
    }

    if (type === 'all' || type === 'stores') {
      if (data.stores && Array.isArray(data.stores)) {
        let importedCount = 0
        for (const store of data.stores) {
          try {
            const existingStore = await db.store.findFirst({
              where: {
                code: store.code,
                organizationId
              }
            })

            if (!existingStore) {
              await db.store.create({
                data: {
                  name: store.name,
                  code: store.code,
                  type: store.type || 'BRANCH',
                  status: store.status || 'ACTIVE',
                  address: store.address,
                  city: store.city,
                  state: store.state,
                  pincode: store.pincode,
                  country: store.country || 'India',
                  phone: store.phone,
                  email: store.email,
                  gstin: store.gstin,
                  organizationId
                }
              })
              importedCount++
            }
          } catch (error) {
            results.errors.push({
              entity: 'store',
              data: store.name,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
        results.imported.stores = importedCount
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
