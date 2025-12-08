'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface TrialAlert {
  alert_id: string
  alert_type: 'trial_ending' | 'trial_expired' | 'custom' | 'feature_promotion'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  show_cta: boolean
  cta_text: string
  cta_link: string
  background_color: string
  text_color: string
  icon: string
  shown_recently: boolean
}

export interface TrialStatus {
  isActive: boolean
  daysRemaining: number | null
  startDate: string | null
  endDate: string | null
  alerts: TrialAlert[]
  isLoading: boolean
  error: string | null
}

/**
 * Hook para monitorar o status do trial do usuário
 * Retorna informações sobre o trial e alertas ativos
 */
export function useTrialStatus() {
  const [status, setStatus] = useState<TrialStatus>({
    isActive: false,
    daysRemaining: null,
    startDate: null,
    endDate: null,
    alerts: [],
    isLoading: true,
    error: null,
  })

  const supabase = createClient()

  const fetchTrialStatus = async () => {
    try {
      // Obter usuário autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setStatus(prev => ({ ...prev, isLoading: false, error: 'Usuário não autenticado' }))
        return
      }

      // Buscar informações do trial do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('trial_start_date, trial_end_date, is_trial_active, subscription_status')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Erro ao buscar profile:', profileError)
        setStatus(prev => ({ ...prev, isLoading: false, error: profileError.message }))
        return
      }

      // Calcular dias restantes com base em trial_end_date
      let daysRemaining = null
      if (profile.trial_end_date) {
        const endDate = new Date(profile.trial_end_date)
        const now = new Date()
        const diffTime = endDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        daysRemaining = Math.max(0, diffDays)
      }

      // Buscar alertas ativos para o usuário usando a view
      const { data: alerts, error: alertsError } = await supabase
        .from('user_active_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })

      if (alertsError) {
        console.error('Erro ao buscar alertas:', alertsError)
      }

      setStatus({
        isActive: profile.is_trial_active || false,
        daysRemaining,
        startDate: profile.trial_start_date,
        endDate: profile.trial_end_date,
        alerts: alerts || [],
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('Erro ao buscar status do trial:', error)
      setStatus(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }))
    }
  }

  // Marcar alerta como exibido
  const markAlertAsShown = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('alert_history')
        .insert({
          user_id: user.id,
          alert_id: alertId,
          shown_at: new Date().toISOString(),
          action_taken: 'shown'
        })
    } catch (error) {
      console.error('Erro ao marcar alerta como exibido:', error)
    }
  }

  // Marcar alerta como dispensado
  const dismissAlert = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar registro existente
      const { data: existingHistory } = await supabase
        .from('alert_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('alert_id', alertId)
        .order('shown_at', { ascending: false })
        .limit(1)
        .single()

      if (existingHistory) {
        // Atualizar registro existente
        await supabase
          .from('alert_history')
          .update({
            dismissed_at: new Date().toISOString(),
            action_taken: 'dismissed'
          })
          .eq('id', existingHistory.id)
      }

      // Remover alerta da lista
      setStatus(prev => ({
        ...prev,
        alerts: prev.alerts.filter(alert => alert.alert_id !== alertId)
      }))
    } catch (error) {
      console.error('Erro ao dispensar alerta:', error)
    }
  }

  // Marcar que usuário clicou no CTA
  const handleCtaClick = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: existingHistory } = await supabase
        .from('alert_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('alert_id', alertId)
        .order('shown_at', { ascending: false })
        .limit(1)
        .single()

      if (existingHistory) {
        await supabase
          .from('alert_history')
          .update({
            action_taken: 'clicked_cta'
          })
          .eq('id', existingHistory.id)
      }
    } catch (error) {
      console.error('Erro ao registrar click no CTA:', error)
    }
  }

  // Refresh do status
  const refresh = () => {
    fetchTrialStatus()
  }

  useEffect(() => {
    fetchTrialStatus()

    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchTrialStatus, 5 * 60 * 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    ...status,
    markAlertAsShown,
    dismissAlert,
    handleCtaClick,
    refresh,
  }
}
