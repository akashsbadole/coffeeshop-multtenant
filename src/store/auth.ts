import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginData, SmsLoginData, LoginTab } from './types'

interface AuthState {
  // State
  user: User | null
  loading: boolean
  loginData: LoginData
  loginError: string
  loginTab: LoginTab
  smsLoginData: SmsLoginData
  otpSent: boolean
  otpLoading: boolean
  smsLoginError: string

  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setLoginData: (data: LoginData) => void
  setLoginError: (error: string) => void
  setLoginTab: (tab: LoginTab) => void
  setSmsLoginData: (data: SmsLoginData) => void
  setOtpSent: (sent: boolean) => void
  setOtpLoading: (loading: boolean) => void
  setSmsLoginError: (error: string) => void

  // Async actions
  login: () => Promise<void>
  logout: () => Promise<void>
  sendOtp: () => Promise<void>
  verifyOtp: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      loading: true,
      loginData: { email: '', password: '' },
      loginError: '',
      loginTab: 'email',
      smsLoginData: { phone: '', otp: '' },
      otpSent: false,
      otpLoading: false,
      smsLoginError: '',

      // Setters
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      setLoginData: (data) => set({ loginData: data }),
      setLoginError: (error) => set({ loginError: error }),
      setLoginTab: (tab) => set({ loginTab: tab }),
      setSmsLoginData: (data) => set({ smsLoginData: data }),
      setOtpSent: (sent) => set({ otpSent: sent }),
      setOtpLoading: (loading) => set({ otpLoading: loading }),
      setSmsLoginError: (error) => set({ smsLoginError: error }),

      // Async actions
      login: async () => {
        const { loginData } = get()
        set({ loading: true, loginError: '' })

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Login failed')
          }

          const data = await response.json()
          set({ user: data.user, loading: false })
        } catch (error) {
          set({
            loginError: error instanceof Error ? error.message : 'Login failed',
            loading: false,
          })
        }
      },

      logout: async () => {
        set({ loading: true })
        try {
          // Clear any session data if needed
          set({ user: null, loading: false })
        } catch (error) {
          set({ loading: false })
        }
      },

      sendOtp: async () => {
        const { smsLoginData } = get()
        set({ otpLoading: true, smsLoginError: '' })

        try {
          const response = await fetch('/api/auth/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: smsLoginData.phone }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to send OTP')
          }

          set({ otpSent: true, otpLoading: false })
        } catch (error) {
          set({
            smsLoginError: error instanceof Error ? error.message : 'Failed to send OTP',
            otpLoading: false,
          })
        }
      },

      verifyOtp: async () => {
        const { smsLoginData } = get()
        set({ otpLoading: true, smsLoginError: '' })

        try {
          const response = await fetch('/api/auth/sms/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(smsLoginData),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Invalid OTP')
          }

          const data = await response.json()
          set({ user: data.user, otpLoading: false, otpSent: false })
        } catch (error) {
          set({
            smsLoginError: error instanceof Error ? error.message : 'Invalid OTP',
            otpLoading: false,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
