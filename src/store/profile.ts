import { create } from 'zustand'
import type { ProfileData, PasswordData, User } from './types'

interface ProfileState {
  // State
  profileDialogOpen: boolean
  profileData: ProfileData
  passwordDialogOpen: boolean
  passwordData: PasswordData
  profileLoading: boolean
  passwordLoading: boolean

  // Actions
  setProfileDialogOpen: (open: boolean) => void
  setProfileData: (data: ProfileData) => void
  setPasswordDialogOpen: (open: boolean) => void
  setPasswordData: (data: PasswordData) => void
  setProfileLoading: (loading: boolean) => void
  setPasswordLoading: (loading: boolean) => void

  // Async actions
  updateProfile: (userId: string, data: ProfileData) => Promise<User>
  changePassword: (userId: string, data: PasswordData) => Promise<void>
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  // Initial state
  profileDialogOpen: false,
  profileData: {
    name: '',
    email: '',
    phone: ''
  },
  passwordDialogOpen: false,
  passwordData: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  },
  profileLoading: false,
  passwordLoading: false,

  // Setters
  setProfileDialogOpen: (open) => set({ profileDialogOpen: open }),
  setProfileData: (data) => set({ profileData: data }),
  setPasswordDialogOpen: (open) => set({ passwordDialogOpen: open }),
  setPasswordData: (data) => set({ passwordData: data }),
  setProfileLoading: (loading) => set({ profileLoading: loading }),
  setPasswordLoading: (loading) => set({ passwordLoading: loading }),

  // Async actions
  updateProfile: async (userId, data) => {
    set({ profileLoading: true })
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to update profile')
      const userData = await response.json()
      set({ profileLoading: false })
      return userData
    } catch (error) {
      console.error('Error updating profile:', error)
      set({ profileLoading: false })
      throw error
    }
  },

  changePassword: async (userId, data) => {
    set({ passwordLoading: true })
    try {
      const response = await fetch(`/api/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (!response.ok) throw new Error('Failed to change password')
      set({ passwordLoading: false })
    } catch (error) {
      console.error('Error changing password:', error)
      set({ passwordLoading: false })
      throw error
    }
  },
}))
