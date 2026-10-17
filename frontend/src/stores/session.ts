import { reactive } from 'vue'
import { api } from '../api/client'
import type { User } from '../types'

export const session = reactive<{ user: User | null; loaded: boolean }>({ user: null, loaded: false })

export async function loadMe() {
  try {
    session.user = await api<User>('/api/auth/me')
  } catch {
    session.user = null
  } finally {
    session.loaded = true
  }
}

export async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST' })
  } finally {
    session.user = null
  }
}
