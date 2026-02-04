import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createOrganizationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default('India')
})

const updateOrganizationSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  logo: z.string().optional(),
  industry: z.string().optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  maxUsers: z.number().optional(),
  maxStores: z.number().optional(),
  isActive: z.boolean().optional()
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const slug = searchParams.get('slug')

    if (id) {
      const organization = await db.organization.findUnique({
        where: { id }
      })
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      return NextResponse.json(organization)
    }

    if (slug) {
      const organization = await db.organization.findUnique({
        where: { slug }
      })
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      return NextResponse.json(organization)
    }

    const organizations = await db.organization.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(organizations)
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = createOrganizationSchema.parse(body)

    const existingOrg = await db.organization.findUnique({
      where: { email: validatedData.email }
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization with this email already exists' },
        { status: 400 }
      )
    }

    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    let uniqueSlug = slug
    let counter = 1
    while (await db.organization.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    const organization = await db.organization.create({
      data: {
        ...validatedData,
        slug: uniqueSlug
      }
    })

    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
