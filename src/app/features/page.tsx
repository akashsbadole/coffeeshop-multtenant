'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Brain, 
  BarChart3, 
  Store, 
  Zap,
  MessageSquare,
  ArrowRight,
  Check,
  CreditCard,
  Clock,
  TrendingUp,
  AlertTriangle,
  Truck,
  Phone,
  Menu,
  Settings,
  Receipt,
  Heart,
  TruckIcon,
  CreditCardIcon,
  BarChartIcon,
  UsersIcon,
  BrainCircuit,
  ChefHat,
  Gift,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PricingSection from '@/components/public/pricing-section'

// Feature categories data
const featureCategories = [
  {
    id: 'pos',
    title: 'Point of Sale',
    icon: ShoppingCart,
    description: 'Fast and intuitive checkout experience',
    features: [
      { name: 'Quick order entry with search', icon: Search },
      { name: 'Split bills and payments', icon: CreditCard },
      { name: 'Barcode scanning', icon: Zap },
      { name: 'Hold and recall orders', icon: Clock },
      { name: 'Multiple payment methods', icon: CreditCardIcon },
      { name: 'Real-time inventory tracking', icon: Package },
      { name: 'GST-compliant invoices', icon: Receipt },
      { name: 'Customer display mode', icon: Menu },
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    icon: Package,
    description: 'Track stock levels and manage suppliers',
    features: [
      { name: 'Real-time stock tracking', icon: TrendingUp },
      { name: 'Low stock alerts', icon: AlertTriangle },
      { name: 'Supplier management', icon: TruckIcon },
      { name: 'Purchase order tracking', icon: ShoppingCart },
      { name: 'Multi-location inventory', icon: Store },
      { name: 'Batch and expiry tracking', icon: Clock },
      { name: 'Stock adjustment logs', icon: Settings },
      { name: 'Inventory valuation reports', icon: BarChartIcon },
    ]
  },
  {
    id: 'customers',
    title: 'Customer Management',
    icon: Users,
    description: 'Build loyalty and retain customers',
    features: [
      { name: 'Customer database', icon: UsersIcon },
      { name: 'Loyalty points program', icon: Heart },
      { name: 'Customer segmentation', icon: BrainCircuit },
      { name: 'Purchase history tracking', icon: Clock },
      { name: 'Automated marketing', icon: MessageSquare },
      { name: 'Customer feedback collection', icon: Star },
      { name: 'SMS/WhatsApp notifications', icon: Phone },
      { name: 'Referral tracking', icon: UsersIcon },
    ]
  },
  {
    id: 'ai',
    title: 'AI-Powered Features',
    icon: Brain,
    description: 'Smart insights and automation',
    features: [
      { name: 'Sales forecasting', icon: TrendingUp },
      { name: 'Demand prediction', icon: BrainCircuit },
      { name: 'Churn prediction', icon: AlertTriangle },
      { name: 'Price optimization', icon: CreditCardIcon },
      { name: 'Anomaly detection', icon: Zap },
      { name: 'Business insights', icon: BarChartIcon },
      { name: 'Automated recommendations', icon: ChefHat },
      { name: 'Voice commands', icon: Mic },
    ]
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    icon: BarChart3,
    description: 'Comprehensive business insights',
    features: [
      { name: 'Sales reports', icon: TrendingUp },
      { name: 'GST reports', icon: Receipt },
      { name: 'Inventory reports', icon: Package },
      { name: 'Customer analytics', icon: UsersIcon },
      { name: 'Staff performance', icon: UsersIcon },
      { name: 'Profit margin analysis', icon: BarChartIcon },
      { name: 'Custom report builder', icon: Settings },
      { name: 'Scheduled exports', icon: Download },
    ]
  },
  {
    id: 'multi-store',
    title: 'Multi-Store Support',
    icon: Store,
    description: 'Manage multiple locations easily',
    features: [
      { name: 'Centralized management', icon: Settings },
      { name: 'Store-specific settings', icon: Store },
      { name: 'Table management', icon: ChefHat },
      { name: 'Kitchen display system', icon: ChefHat },
      { name: 'Multi-store reporting', icon: BarChartIcon },
      { name: 'Staff scheduling', icon: Clock },
      { name: 'Cross-store inventory', icon: Package },
      { name: 'Unified customer data', icon: UsersIcon },
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Zap,
    description: 'Connect with popular services',
    features: [
      { name: 'Payment gateways', icon: CreditCardIcon },
      { name: 'Delivery partners', icon: TruckIcon },
      { name: 'Accounting software', icon: Receipt },
      { name: 'E-commerce platforms', icon: ShoppingCart },
      { name: 'Marketing tools', icon: MessageSquare },
      { name: 'Analytics platforms', icon: BarChartIcon },
      { name: 'HR software', icon: UsersIcon },
      { name: 'Custom APIs', icon: Settings },
    ]
  },
  {
    id: 'support',
    title: 'Support & Help',
    icon: MessageSquare,
    description: '24/7 assistance when you need it',
    features: [
      { name: 'Live chat support', icon: MessageSquare },
      { name: 'Ticket system', icon: Bell },
      { name: 'Phone support', icon: Phone },
      { name: 'Video tutorials', icon: Play },
      { name: 'Documentation', icon: FileText },
      { name: 'Community forum', icon: UsersIcon },
      { name: 'Priority SLA', icon: Star },
      { name: 'Dedicated account manager', icon: UsersIcon },
    ]
  },
]

// Simple icons
function Search({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}

function Mic({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  )
}

function Play({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function Download({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

// Stats data
const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '10M+', label: 'Orders Processed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
]

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState('pos')

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-blue-200 dark:border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Universal POS
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Home
              </Link>
              <Link href="/features" className="text-blue-600 font-medium dark:text-blue-400">
                Features
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Pricing
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
                Contact
              </Link>
              <Button asChild className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                <Link href="/auth/register">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 mb-6">
            ✨ Powering 50,000+ Businesses
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            All-in-One <span className="bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">Point of Sale</span> Solution
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
            From retail to restaurants, our AI-powered POS system handles it all. 
            Manage sales, inventory, customers, and more — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg px-8 py-6">
              <Link href="/auth/register">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20 text-lg px-8 py-6">
              <Link href="/demo">
                View Demo
              </Link>
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Every Business
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to run your business efficiently — from day-to-day operations to long-term growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCategories.map((category, index) => (
              <Card 
                key={category.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  activeCategory === category.id 
                    ? 'ring-2 ring-blue-500 dark:ring-blue-400' 
                    : ''
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  }`}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.features.slice(0, 4).map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <feature.icon className="h-4 w-4 text-blue-500" />
                        {feature.name}
                      </li>
                    ))}
                    {category.features.length > 4 && (
                      <li className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        +{category.features.length - 4} more
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Feature Sections */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          {featureCategories.map((category, index) => (
            <div 
              key={category.id}
              id={category.id}
              className={`py-20 ${index % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-900 -mx-4 px-4'}`}
            >
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                  <div className="lg:w-1/2">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6`}>
                      <category.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      {category.title}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                      {category.description}
                    </p>
                    <ul className="space-y-4">
                      {category.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{feature.name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="lg:w-1/2">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-8 h-80 flex items-center justify-center">
                      <category.icon className="h-32 w-32 text-blue-500/50" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join 50,000+ businesses that trust Universal POS to power their growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8">
                  <Link href="/auth/register">
                    Start Free 14-Day Trial
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8">
                  <Link href="/contact">
                    Contact Sales
                  </Link>
                </Button>
              </div>
              <p className="mt-6 text-blue-200 text-sm">
                No credit card required • Cancel anytime • Setup in minutes
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-1.5 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white">Universal POS</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                India's most trusted POS solution for businesses of all sizes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/features" className="hover:text-blue-600">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-600">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-blue-600">Demo</Link></li>
                <li><Link href="/integrations" className="hover:text-blue-600">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
                <li><Link href="/blog" className="hover:text-blue-600">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-blue-600">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/help" className="hover:text-blue-600">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-blue-600">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-blue-600">Status</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-600">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2024 Universal POS. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-gray-400 hover:text-blue-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
