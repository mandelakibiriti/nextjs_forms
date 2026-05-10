import { useState, useCallback } from 'react'
import type { FormSchema } from '@formforge/schema-core'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('ff_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function useFormApi() {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const saveForm = useCallback(async (schema: FormSchema): Promise<FormSchema | null> => {
    setSaving(true)
    setSaveError(null)
    try {
      const isNew = !schema.id || schema.id === ''
      if (isNew) {
        return await apiFetch<FormSchema>('/forms', {
          method: 'POST',
          body: JSON.stringify(schema),
        })
      } else {
        return await apiFetch<FormSchema>(`/forms/${schema.id}`, {
          method: 'PUT',
          body: JSON.stringify(schema),
        })
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const loadForm = useCallback(async (id: string): Promise<FormSchema | null> => {
    try {
      return await apiFetch<FormSchema>(`/forms/id/${id}`)
    } catch {
      return null
    }
  }, [])

  const listForms = useCallback(async (): Promise<FormSchema[]> => {
    try {
      const result = await apiFetch<{ forms: FormSchema[] }>('/forms')
      return result.forms
    } catch {
      return []
    }
  }, [])

  const publishForm = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiFetch(`/forms/${id}/publish`, { method: 'POST' })
      return true
    } catch {
      return false
    }
  }, [])

  const deleteForm = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiFetch(`/forms/${id}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }, [])

  return { saveForm, loadForm, listForms, publishForm, deleteForm, saving, saveError }
}

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFetch<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      localStorage.setItem('ff_token', result.token)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(
    async (email: string, password: string, name?: string): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiFetch<{ token: string }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        })
        localStorage.setItem('ff_token', result.token)
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Registration failed')
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const logout = useCallback(() => {
    localStorage.removeItem('ff_token')
    window.location.href = '/login'
  }, [])

  const isAuthenticated = !!localStorage.getItem('ff_token')

  return { login, register, logout, isAuthenticated, loading, error }
}
