import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginData, SmsLoginData, LoginTab, Organization, Session } from './types'

interface AuthState {
  user: (User & { organization?: Organization }) | null
  session: Session | null
  loading: boolean
  loginData: LoginData
  loginError: string
  loginTab: LoginTab
  smsLoginData: SmsLoginData
  otpSent: boolean
  otpLoading: boolean
  smsLoginError: string

  setUser: (user: (User & { organization?: Organization }) | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setLoginData: (data: LoginData) => void
  setLoginError: (error: string) => void
  setLoginTab: (tab: LoginTab) => void
  setSmsLoginData: (data: SmsLoginData) => void
  setOtpSent: (sent: boolean) => void
  setOtpLoading: (loading: boolean) => void
  setSmsLoginError: (error: string) => void

  login: () => Promise<void>
  logout: () => Promise<void>
  sendOtp: () => Promise<void>
  verifyOtp: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      loginData: { email: '', password: '' },
      loginError: '',
      loginTab: 'email',
      smsLoginData: { phone: '', otp: '' },
      otpSent: false,
      otpLoading: false,
      smsLoginError: '',

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      setLoginData: (data) => set({ loginData: data }),
      setLoginError: (error) => set({ loginError: error }),
      setLoginTab: (tab) => set({ loginTab: tab }),
      setSmsLoginData: (data) => set({ smsLoginData: data }),
      setOtpSent: (sent) => set({ otpSent: sent }),
      setOtpLoading: (loading) => set({ otpLoading: loading }),
      setSmsLoginError: (error) => set({ smsLoginError: error }),

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
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`
          set({ user: data.user, session: { userId: data.user.id, token, expiresAt }, loading: false })
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
          set({ user: null, session: null, loading: false })
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
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`
          set({ user: data.user, session: { userId: data.user.id, token, expiresAt }, otpLoading: false, otpSent: false })
        } catch (error) {
          set({
            smsLoginError: error instanceof Error ? error.message : 'Invalid OTP',
            otpLoading: false,
          })
        }
      },

      checkSession: async () => {
        const { session } = get()
        
        if (!session) {
          set({ user: null, loading: false })
          return
        }

        const expiresAt = new Date(session.expiresAt)
        if (Date.now() > expiresAt.getTime()) {
          set({ user: null, session: null, loading: false })
          return
        }

        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'x-session-token': session.token,
              'x-user-id': session.userId
            }
          })

          if (!response.ok) {
            set({ user: null, session: null, loading: false })
            return
          }

          const userData = await response.json()
          set({ user: userData, loading: false })
        } catch (error) {
          console.error('Session check failed:', error)
          set({ user: null, session: null, loading: false })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, session: state.session }),
    }
  )
)
