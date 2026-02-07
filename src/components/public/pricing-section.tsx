'use client'

import React, { useState, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface Plan {
  id: string
  name: string
  type: string
  description: string | null
  price: number
  yearlyPrice: number | null
  currency: string
  features: string
  maxUsers: number
  maxStores: number
  maxOrdersPerMonth: number | null
  maxMenuItems: number | null
  maxInventoryItems: number | null
  supportLevel: string
  isActive: boolean
}

export default function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans?active=true')
      const data = await response.json()
      if (data.plans) {
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPrice = (plan: Plan) => {
    if (billingCycle === 'YEARLY' && plan.yearlyPrice) {
      return Math.round(plan.yearlyPrice / 12)
    }
    return plan.price
  }

  const getYearlySavings = (plan: Plan) => {
    if (plan.yearlyPrice) {
      const monthlyTotal = plan.price * 12
      const savings = monthlyTotal - plan.yearlyPrice
      return Math.round((savings / monthlyTotal) * 100)
    }
    return 0
  }

  const parseFeatures = (featuresString: string): string[] => {
    try {
      return JSON.parse(featuresString)
    } catch {
      return featuresString.split(',').map(f => f.trim())
    }
  }

  const getFeaturesList = (plan: Plan) => {
    const features = parseFeatures(plan.features)
    const limits = [
      `${plan.maxUsers} Users`,
      `${plan.maxStores} Store${plan.maxStores > 1 ? 's' : ''}`,
      plan.maxOrdersPerMonth ? `${plan.maxOrdersPerMonth} orders/month` : 'Unlimited orders',
      plan.maxMenuItems ? `${plan.maxMenuItems} menu items` : 'Unlimited menu items',
      plan.supportLevel === 'email' ? 'Email support' : 
      plan.supportLevel === 'chat' ? 'Email & Chat support' : 
      plan.supportLevel === 'phone' ? 'Priority support' : 'Dedicated support',
    ]
    return [...features, ...limits]
  }

  const handleSelectPlan = (plan: Plan) => {
    // Redirect to signup with plan selection
    const params = new URLSearchParams({
      plan: plan.id,
      cycle: billingCycle.toLowerCase(),
    })
    window.location.href = `/auth/register?${params.toString()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Choose the perfect plan for your coffee shop
          </p>
          
          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center bg-gray-200 dark:bg-gray-800 rounded-full p-1 mb-8">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'MONTHLY'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'YEARLY'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const price = getPrice(plan)
            const yearlySavings = getYearlySavings(plan)
            const features = getFeaturesList(plan)
            const isPopular = plan.type === 'PROFESSIONAL'

            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                  isPopular
                    ? 'border-primary transform md:-translate-y-4'
                    : 'border-transparent'
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <div className={`p-6 ${isPopular ? 'pt-12' : ''}`}>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {plan.description || `Perfect for ${plan.maxUsers} users`}
                  </p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ₹{price}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">/month</span>
                    {billingCycle === 'YEARLY' && yearlySavings > 0 && (
                      <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Save {yearlySavings}% yearly
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      isPopular
                        ? 'bg-primary hover:bg-primary/90 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                    }`}
                  >
                    Get Started
                  </button>
                </div>

                <div className="px-6 pb-6">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      Includes:
                    </p>
                    <ul className="space-y-3">
                      {features.slice(0, 5).map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                      {features.length > 5 && (
                        <li className="text-sm text-gray-500 dark:text-gray-400">
                          +{features.length - 5} more features
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Need a custom enterprise solution?
          </p>
          <button className="text-primary hover:text-primary/80 font-medium">
            Contact Sales →
          </button>
        </div>
      </div>
    </section>
  )
}
