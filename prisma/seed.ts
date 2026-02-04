import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create default organization
  const organization = await prisma.organization.upsert({
    where: { email: 'default@coffeeshop.com' },
    update: {},
    create: {
      name: 'Default Coffee Shop',
      slug: 'default-coffee-shop',
      email: 'default@coffeeshop.com',
      phone: '+91 98765 43210',
      industry: 'coffee_shop',
      gstin: '29ABCDE1234F1Z5',
      address: '123 Main Street, Bangalore, Karnataka',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India',
      isActive: true,
      maxUsers: 10,
      maxStores: 5
    }
  })

  console.log('Created organization:', organization.name)

  // Create default subscription plan
  const subscriptionPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'FREE' },
    update: {},
    create: {
      name: 'FREE',
      type: 'FREE',
      description: 'Free plan for small businesses',
      price: 0,
      currency: 'INR',
      features: JSON.stringify([
        '1 Store',
        '3 Users',
        '50 Menu Items',
        'Basic Reports'
      ]),
      maxUsers: 3,
      maxStores: 1,
      maxOrdersPerMonth: 100,
      maxMenuItems: 50,
      maxInventoryItems: 100,
      supportLevel: 'email',
      isActive: true
    }
  })

  // Create tenant subscription
  const subscription = await prisma.tenantSubscription.upsert({
    where: {
      id: `sub-${organization.id}`
    },
    update: {},
    create: {
      id: `sub-${organization.id}`,
      organizationId: organization.id,
      planId: subscriptionPlan.id,
      status: 'TRIAL',
      billingCycle: 'MONTHLY',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      paymentStatus: 'pending'
    }
  })

  console.log('Created subscription:', subscription.status)

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-1' },
      update: {},
      create: {
        id: 'cat-1',
        organizationId: organization.id,
        name: 'Hot Beverages',
        description: 'Coffee, tea, and hot drinks',
        displayOrder: 1
      }
    }),
    prisma.category.upsert({
      where: { id: 'cat-2' },
      update: {},
      create: {
        id: 'cat-2',
        organizationId: organization.id,
        name: 'Cold Beverages',
        description: 'Cold coffee, smoothies, and cool drinks',
        displayOrder: 2
      }
    }),
    prisma.category.upsert({
      where: { id: 'cat-3' },
      update: {},
      create: {
        id: 'cat-3',
        organizationId: organization.id,
        name: 'Food & Snacks',
        description: 'Sandwiches, burgers, and snacks',
        displayOrder: 3
      }
    }),
    prisma.category.upsert({
      where: { id: 'cat-4' },
      update: {},
      create: {
        id: 'cat-4',
        organizationId: organization.id,
        name: 'Desserts',
        description: 'Cakes, pastries, and sweets',
        displayOrder: 4
      }
    })
  ])

  console.log('Created categories:', categories.map(c => c.name))

  // Create menu items with India-specific pricing and GST
  const menuItems = await Promise.all([
    prisma.menuItem.upsert({
      where: { id: 'menu-1' },
      update: {},
      create: {
        id: 'menu-1',
        organizationId: organization.id,
        name: 'Cappuccino',
        description: 'Rich espresso with steamed milk and foam',
        price: 150,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-1'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-2' },
      update: {},
      create: {
        id: 'menu-2',
        organizationId: organization.id,
        name: 'Cafe Latte',
        description: 'Smooth espresso with steamed milk',
        price: 140,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-1'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-3' },
      update: {},
      create: {
        id: 'menu-3',
        organizationId: organization.id,
        name: 'Americano',
        description: 'Espresso with hot water',
        price: 120,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-1'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-4' },
      update: {},
      create: {
        id: 'menu-4',
        organizationId: organization.id,
        name: 'Masala Chai',
        description: 'Traditional Indian spiced tea',
        price: 80,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-1'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-5' },
      update: {},
      create: {
        id: 'menu-5',
        organizationId: organization.id,
        name: 'Filter Coffee',
        description: 'South Indian filter coffee',
        price: 70,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-1'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-6' },
      update: {},
      create: {
        id: 'menu-6',
        organizationId: organization.id,
        name: 'Hot Chocolate',
        description: 'Rich chocolate drink with marshmallows',
        price: 130,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-1'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-7' },
      update: {},
      create: {
        id: 'menu-7',
        organizationId: organization.id,
        name: 'Iced Cappuccino',
        description: 'Chilled cappuccino over ice',
        price: 160,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-2'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-8' },
      update: {},
      create: {
        id: 'menu-8',
        organizationId: organization.id,
        name: 'Mango Smoothie',
        description: 'Fresh mango blended with milk',
        price: 180,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-2'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-9' },
      update: {},
      create: {
        id: 'menu-9',
        organizationId: organization.id,
        name: 'Strawberry Milkshake',
        description: 'Creamy strawberry milkshake',
        price: 170,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-2'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-10' },
      update: {},
      create: {
        id: 'menu-10',
        organizationId: organization.id,
        name: 'Cold Coffee with Ice Cream',
        description: 'Cold coffee topped with ice cream',
        price: 180,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-2'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-11' },
      update: {},
      create: {
        id: 'menu-11',
        organizationId: organization.id,
        name: 'Fresh Lime Soda',
        description: 'Refreshing lime soda',
        price: 80,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-2'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-12' },
      update: {},
      create: {
        id: 'menu-12',
        organizationId: organization.id,
        name: 'Vada Pav',
        description: 'Spicy potato fritter in pav bread',
        price: 50,
        gstRate: 'FIVE',
        hsnCode: '2105',
        categoryId: 'cat-3'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-13' },
      update: {},
      create: {
        id: 'menu-13',
        organizationId: organization.id,
        name: 'Samosa',
        description: 'Crispy pastry with potato filling',
        price: 25,
        gstRate: 'FIVE',
        hsnCode: '2105',
        categoryId: 'cat-3'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-14' },
      update: {},
      create: {
        id: 'menu-14',
        organizationId: organization.id,
        name: 'Veg Sandwich',
        description: 'Grilled vegetable sandwich',
        price: 90,
        gstRate: 'FIVE',
        hsnCode: '2105',
        categoryId: 'cat-3'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-15' },
      update: {},
      create: {
        id: 'menu-15',
        organizationId: organization.id,
        name: 'Club Sandwich',
        description: 'Double-decker sandwich with veggies',
        price: 150,
        gstRate: 'FIVE',
        hsnCode: '2105',
        categoryId: 'cat-3'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-16' },
      update: {},
      create: {
        id: 'menu-16',
        organizationId: organization.id,
        name: 'Poha',
        description: 'Flattened rice with spices and peanuts',
        price: 60,
        gstRate: 'FIVE',
        hsnCode: '2105',
        categoryId: 'cat-3'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-17' },
      update: {},
      create: {
        id: 'menu-17',
        organizationId: organization.id,
        name: 'Idli Sambar',
        description: 'Steamed rice cakes with sambar',
        price: 70,
        gstRate: 'FIVE',
        hsnCode: '2105',
        categoryId: 'cat-3'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-18' },
      update: {},
      create: {
        id: 'menu-18',
        organizationId: organization.id,
        name: 'Masala Dosa',
        description: 'Crispy crepe with potato filling',
        price: 120,
        gstRate: 'FIVE',
        hsnCode: '2105',
        categoryId: 'cat-3'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-19' },
      update: {},
      create: {
        id: 'menu-19',
        organizationId: organization.id,
        name: 'Chocolate Cake Slice',
        description: 'Rich chocolate cake slice',
        price: 120,
        gstRate: 'EIGHTEEN',
        hsnCode: '2105',
        categoryId: 'cat-4'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-20' },
      update: {},
      create: {
        id: 'menu-20',
        organizationId: organization.id,
        name: 'Blueberry Cheesecake',
        description: 'Creamy cheesecake with blueberry topping',
        price: 180,
        gstRate: 'EIGHTEEN',
        hsnCode: '2105',
        categoryId: 'cat-4'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-21' },
      update: {},
      create: {
        id: 'menu-21',
        organizationId: organization.id,
        name: 'Gulab Jamun (2 pcs)',
        description: 'Sweet milk dumplings in syrup',
        price: 60,
        gstRate: 'EIGHTEEN',
        hsnCode: '2105',
        categoryId: 'cat-4'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-22' },
      update: {},
      create: {
        id: 'menu-22',
        organizationId: organization.id,
        name: 'Rasmalai',
        description: 'Soft cheese dumplings in milk',
        price: 80,
        gstRate: 'EIGHTEEN',
        hsnCode: '2105',
        categoryId: 'cat-4'
      }
    }),
    prisma.menuItem.upsert({
      where: { id: 'menu-23' },
      update: {},
      create: {
        id: 'menu-23',
        organizationId: organization.id,
        name: 'Ice Cream Scoop',
        description: 'Choice of vanilla, chocolate, or strawberry',
        price: 80,
        gstRate: 'EIGHTEEN',
        hsnCode: '2105',
        categoryId: 'cat-4'
      }
    })
  ])

  console.log('Created menu items:', menuItems.map(m => m.name))

  // Create default store
  const store = await prisma.store.upsert({
    where: { id: 'store-1' },
    update: {},
    create: {
      id: 'store-1',
      organizationId: organization.id,
      name: 'Main Store',
      code: 'STORE001',
      type: 'FLAGSHIP',
      status: 'ACTIVE',
      address: '123 Main Street, Bangalore, Karnataka',
      city: 'Bangalore',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560001',
      country: 'India',
      phone: '+91 98765 43210',
      email: 'store@coffeeshop.com',
      gstin: '29ABCDE1234F1Z5',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      isDefault: true
    }
  })

  console.log('Created store:', store.name)

  // Create default users with different roles
  const users = await Promise.all([
    prisma.user.upsert({
      where: { id: 'user-1' },
      update: {},
      create: {
        id: 'user-1',
        organizationId: organization.id,
        email: 'admin@coffeeshop.com',
        name: 'Admin User',
        role: 'ADMIN',
        password: 'password123'
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-2' },
      update: {},
      create: {
        id: 'user-2',
        organizationId: organization.id,
        email: 'manager@coffeeshop.com',
        name: 'Manager User',
        role: 'MANAGER',
        password: 'password123'
      }
    }),
    prisma.user.upsert({
      where: { id: 'user-3' },
      update: {},
      create: {
        id: 'user-3',
        organizationId: organization.id,
        email: 'cashier@coffeeshop.com',
        name: 'Cashier User',
        role: 'CASHIER',
        password: 'password123'
      }
    })
  ])

  console.log('Created users:', users.map(u => `${u.email} (${u.role})`))

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
