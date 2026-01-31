import { db } from '@/lib/db'
import { Role } from '@prisma/client'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
}

// Simple session management (in production, use NextAuth.js or JWT)
const SESSION_KEY = 'pos_session'
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours

export async function loginUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await db.user.findUnique({
    where: { email }
  })

  if (!user) {
    return null
  }

  // In production, use bcrypt to compare hashed passwords
  // For MVP, we're doing plain text comparison
  if (user.password !== password) {
    return null
  }

  const session: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }

  // Store session in localStorage-like storage (on server side, use cookies)
  setSession(session)

  return session
}

export function setSession(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    const sessionData = {
      user,
      expiresAt: Date.now() + SESSION_DURATION
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
  }
}

export function getSession(): AuthUser | null {
  if (typeof window === 'undefined') return null

  const sessionStr = sessionStorage.getItem(SESSION_KEY)
  if (!sessionStr) return null

  try {
    const sessionData = JSON.parse(sessionStr)
    
    // Check if session is expired
    if (Date.now() > sessionData.expiresAt) {
      clearSession()
      return null
    }

    return sessionData.user
  } catch {
    clearSession()
    return null
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY)
  }
}

export function isLoggedIn(): boolean {
  return getSession() !== null
}

export function hasRole(allowedRoles: Role[]): boolean {
  const user = getSession()
  if (!user) return false
  return allowedRoles.includes(user.role)
}

export function canAccessAdmin(): boolean {
  return hasRole(['ADMIN'])
}

export function canAccessManager(): boolean {
  return hasRole(['ADMIN', 'MANAGER'])
}

export function canAccessCashier(): boolean {
  return hasRole(['ADMIN', 'MANAGER', 'CASHIER'])
}
