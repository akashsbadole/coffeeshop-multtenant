'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'

interface Plan {
  id: string
  name: string
  type: string
  price: number
  yearlyPrice: number | null
  features: string
  maxUsers: number
  maxStores: number
}

export default function RegisterWithSubscription() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(searchParams.get('plan'))
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>(
    (searchParams.get('cycle') as 'MONTHLY' | 'YEARLY') || 'MONTHLY'
  )
  const [plans, setPlans] = useState<Plan[]>([])

  const [formData, setFormData] = useState({
    organizationName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

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
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
  }

  const validateStep1 = () => {
    if (!formData.organizationName) {
      setError('Organization name is required')
      return false
    }
    if (!selectedPlan) {
      setError('Please select a plan')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formData.name) {
      setError('Name is required')
      return false
    }
    if (!formData.phone) {
      setError('Phone number is required')
      return false
    }
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleNext = () => {
    setError('')
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleBack = () => {
    setError('')
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          planId: selectedPlan,
          billingCycle,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      // If there's a checkout required, redirect to checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        // Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  const getSelectedPlanDetails = () => {
    return plans.find(p => p.id === selectedPlan)
  }

  const selectedPlanDetails = getSelectedPlanDetails()
  const price = selectedPlanDetails 
    ? (billingCycle === 'YEARLY' && selectedPlanDetails.yearlyPrice 
        ? selectedPlanDetails.yearlyPrice 
        : selectedPlanDetails.price)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Your Account
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {step === 1 && 'Select a plan to get started'}
            {step === 2 && 'Tell us about yourself'}
            {step === 3 && 'Review and confirm your registration'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step >= s
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step > s ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Select a Plan
            </h3>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                <button
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    billingCycle === 'MONTHLY'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('YEARLY')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    billingCycle === 'YEARLY'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPlan === plan.id
                            ? 'border-primary'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {selectedPlan === plan.id && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {plan.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {plan.maxUsers} users • {plan.maxStores} store{plan.maxStores > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        ₹{billingCycle === 'YEARLY' && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        /{billingCycle === 'YEARLY' ? 'year' : 'month'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Organization & User Details */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Organization & Account Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your Coffee Shop Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password (optional, will be auto-generated if empty)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Review Your Registration
            </h3>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Selected Plan
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPlanDetails?.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {billingCycle === 'YEARLY' ? 'Yearly billing' : 'Monthly billing'}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    ₹{price}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Organization</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.organizationName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.email || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.phone}
                  </p>
                </div>
              </div>

              {selectedPlanDetails?.type !== 'FREE' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    You will be redirected to complete payment after registration.
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
