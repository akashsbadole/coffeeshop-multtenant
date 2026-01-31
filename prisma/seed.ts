import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-1' },
      update: {},
      create: {
        id: 'cat-1',
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
        name: 'Desserts',
        description: 'Cakes, pastries, and sweets',
        displayOrder: 4
      }
    })
  ])

  console.log('Created categories:', categories.map(c => c.name))

  // Create menu items with India-specific pricing and GST
  const menuItems = await Promise.all([
    // Hot Beverages (18% GST - Food and beverages served in restaurants)
    prisma.menuItem.upsert({
      where: { id: 'menu-1' },
      update: {},
      create: {
        id: 'menu-1',
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
        name: 'Hot Chocolate',
        description: 'Rich chocolate drink with marshmallows',
        price: 130,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-1'
      }
    }),

    // Cold Beverages
    prisma.menuItem.upsert({
      where: { id: 'menu-7' },
      update: {},
      create: {
        id: 'menu-7',
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
        name: 'Fresh Lime Soda',
        description: 'Refreshing lime soda',
        price: 80,
        gstRate: 'EIGHTEEN',
        hsnCode: '3004',
        categoryId: 'cat-2'
      }
    }),

    // Food & Snacks (5% GST for ready-to-eat food items)
    prisma.menuItem.upsert({
      where: { id: 'menu-12' },
      update: {},
      create: {
        id: 'menu-12',
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
        name: 'Masala Dosa',
        description: 'Crispy crepe with potato filling',
        price: 120,
        gstRate: 'FIVE',
        hsnCode: '2105',
        categoryId: 'cat-3'
      }
    }),

    // Desserts (18% GST)
    prisma.menuItem.upsert({
      where: { id: 'menu-19' },
      update: {},
      create: {
        id: 'menu-19',
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

  // Create inventory items
  try {
    await prisma.inventoryItem.createMany({
      data: [
        {
          menuItemId: 'menu-1',
          quantity: 100,
          reorderLevel: 20
        },
        {
          menuItemId: 'menu-12',
          quantity: 50,
          reorderLevel: 10
        },
        {
          menuItemId: 'menu-13',
          quantity: 100,
          reorderLevel: 15
        }
      ],
      skipDuplicates: true
    })
    console.log('Created inventory items: 3')
  } catch (error) {
    console.log('Inventory items may already exist, skipping...')
  }

  // Create default users with different roles
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@coffeeshop.com' },
      update: {},
      create: {
        email: 'admin@coffeeshop.com',
        name: 'Admin User',
        role: 'ADMIN',
        password: 'password123' // In production, use bcrypt or similar
      }
    }),
    prisma.user.upsert({
      where: { email: 'manager@coffeeshop.com' },
      update: {},
      create: {
        email: 'manager@coffeeshop.com',
        name: 'Manager User',
        role: 'MANAGER',
        password: 'password123'
      }
    }),
    prisma.user.upsert({
      where: { email: 'cashier@coffeeshop.com' },
      update: {},
      create: {
        email: 'cashier@coffeeshop.com',
        name: 'Cashier User',
        role: 'CASHIER',
        password: 'password123'
      }
    })
  ])

  console.log('Created users:', users.map(u => `${u.email} (${u.role})`))

  // Create store settings
  const storeSettings = await prisma.storeSettings.upsert({
    where: { id: 'settings-1' },
    update: {},
    create: {
      id: 'settings-1',
      storeName: 'Coffee Shop POS',
      address: '123 Main Street, Bangalore, Karnataka',
      phone: '+91 98765 43210',
      gstin: '29ABCDE1234F1Z5',
      state: 'Karnataka',
      stateCode: '29',
      bankName: 'State Bank of India',
      accountNumber: '1234567890123456',
      ifscCode: 'SBIN0001234',
      invoicePrefix: 'INV',
      startingInvoice: 1
    }
  })

  console.log('Created store settings:', storeSettings.storeName)

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
