import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')

    const where: any = {}
    
    if (organizationId) {
      where.organizationId = organizationId
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }

    const menuItems = await db.menuItem.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(menuItems)
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      organizationId,
      name,
      description,
      price,
      gstRate,
      hsnCode,
      categoryId,
      imageUrl,
      modifiers
    } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const menuItem = await db.menuItem.create({
      data: {
        organizationId,
        name,
        description,
        price: parseFloat(price),
        gstRate,
        hsnCode,
        categoryId,
        imageUrl,
        modifiers: modifiers ? JSON.stringify(modifiers) : null
      }
    })

    return NextResponse.json(menuItem, { status: 201 })
  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}
