import { useState, useEffect, useCallback } from 'react'

interface UserPreferences {
  menu_position: 'sidebar' | 'header' | 'footer' | 'right'
  notification_settings: Record<string, { email: boolean; push: boolean }>
  orders_default_view: 'list' | 'day' | 'week' | 'month'
  orders_date_format: 'short' | 'numeric' | 'long'
  agenda_default_view: 'list' | 'kanban' | 'day' | 'week' | 'month'
  agenda_date_format: 'short' | 'numeric' | 'long'
}

const defaultPreferences: UserPreferences = {
  menu_position: 'sidebar',
  notification_settings: {},
  orders_default_view: 'list',
  orders_date_format: 'short',
  agenda_default_view: 'list',
  agenda_date_format: 'short',
}

const CACHE_KEY = 'user_preferences_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

interface CachedPreferences {
  data: UserPreferences
  timestamp: number
}

// Funções auxiliares para cache
function getCachedPreferences(): UserPreferences | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const parsed: CachedPreferences = JSON.parse(cached)
    const now = Date.now()
    
    // Verificar se o cache ainda é válido
    if (now - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    
    return parsed.data
  } catch {
    return null
  }
}

function setCachedPreferences(preferences: UserPreferences): void {
  if (typeof window === 'undefined') return
  
  try {
    const cached: CachedPreferences = {
      data: preferences,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  } catch (err) {
    console.error('Erro ao salvar cache de preferências:', err)
  }
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // Tentar carregar do cache primeiro
    const cached = getCachedPreferences()
    return cached || defaultPreferences
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar preferências do servidor
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user-preferences')
      
      if (!response.ok) {
        // Se erro de autenticação ou servidor, usa cache/padrão sem mostrar erro
        if (response.status === 401 || response.status === 500) {
          console.warn('Erro ao carregar preferências do servidor, usando cache local')
          const cached = getCachedPreferences()
          if (cached) {
            setPreferences(cached)
          }
          return
        }
        throw new Error('Erro ao carregar preferências')
      }
      
      const data = await response.json()
      setPreferences(data)
      setCachedPreferences(data) // Atualizar cache
    } catch (err) {
      console.error('Erro ao carregar preferências:', err)
      // Não define erro para não bloquear a interface, apenas usa cache
      const cached = getCachedPreferences()
      if (cached) {
        setPreferences(cached)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Atualizar preferências no servidor e cache
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      // Atualizar estado local imediatamente (otimistic update)
      const updatedPreferences = { ...preferences, ...updates }
      setPreferences(updatedPreferences)
      setCachedPreferences(updatedPreferences)
      
      // Disparar eventos personalizados para atualizar outros componentes
      if (updates.menu_position) {
        window.dispatchEvent(new CustomEvent('menu-position-changed', {
          detail: { position: updates.menu_position }
        }))
      }
      
      // Tentar salvar no servidor (não crítico se falhar)
      try {
        const response = await fetch('/api/user-preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })

        if (response.ok) {
          const data = await response.json()
          setPreferences(data)
          setCachedPreferences(data)
        } else {
          console.warn('Não foi possível salvar preferências no servidor, mantendo apenas no cache')
        }
      } catch (serverError) {
        console.warn('Erro ao salvar no servidor, preferências salvas apenas localmente:', serverError)
      }
      
      return { success: true, data: updatedPreferences }
    } catch (err) {
      console.error('Erro ao atualizar preferências:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      return { success: false, error: err }
    }
  }, [preferences])

  // Carregar preferências ao montar o componente
  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refreshPreferences: loadPreferences,
  }
}
