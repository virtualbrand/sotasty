'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { BarChart3, Users, Clock, TrendingUp, Activity, Zap, Calendar as CalendarIcon } from 'lucide-react'
import { CalendarWithRangePresets } from '@/components/ui/calendar-with-range-presets'
import { DateRange } from 'react-day-picker'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AnalyticsMetrics {
  dau: number
  mau: number
  stickiness: string
  avgSessionDuration: number
  topFeatures: Array<{ feature_name: string; usage_count: number }>
  topEvents: Array<{ name: string; count: number }>
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDatePicker) {
        setShowDatePicker(false)
      }
    }

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showDatePicker])

  const fetchMetrics = async () => {
    try {
      // Calcular período em dias baseado no dateRange
      let days = 30
      if (dateRange?.from && dateRange?.to) {
        days = differenceInDays(dateRange.to, dateRange.from)
      }
      const response = await fetch(`/api/analytics/metrics?period=${days}`)
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const checkRole = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/auth/login')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin') {
      redirect('/')
    }

    setLoading(false)
    fetchMetrics()
  }

  useEffect(() => {
    checkRole()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchMetrics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, loading])

  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return 'Selecionar período'
    if (!range.to || range.from.getTime() === range.to.getTime()) {
      return format(range.from, 'dd MMM yyyy', { locale: ptBR })
    }
    return `${format(range.from, 'dd MMM', { locale: ptBR })} - ${format(range.to, 'dd MMM yyyy', { locale: ptBR })}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comportamento e engajamento dos usuários
          </p>
        </div>

        <div className="relative" ref={datePickerRef}>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <CalendarIcon className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {formatDateRange(dateRange)}
            </span>
          </button>
          
          {showDatePicker && (
            <div className="absolute right-0 top-full mt-2 z-50">
              <CalendarWithRangePresets
                onDateChange={(range) => {
                  setDateRange(range)
                  // Só fecha quando ambas as datas estiverem selecionadas
                  if (range?.from && range?.to) {
                    setShowDatePicker(false)
                  }
                }}
                defaultDate={dateRange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">DAU</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {metrics?.dau || 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">Usuários ativos/dia (média 7d)</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">MAU</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {metrics?.mau || 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">Usuários ativos/mês</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Stickiness</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {metrics?.stickiness || 0}%
          </div>
          <p className="text-xs text-gray-500 mt-1">DAU/MAU Ratio</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Tempo médio</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {metrics ? formatDuration(metrics.avgSessionDuration) : '0m 0s'}
          </div>
          <p className="text-xs text-gray-500 mt-1">Duração da sessão</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Features mais usadas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Features Mais Usadas
            </h2>
          </div>

          {metrics?.topFeatures && metrics.topFeatures.length > 0 ? (
            <div className="space-y-4">
              {metrics.topFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {feature.feature_name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {feature.usage_count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum dado disponível</p>
              <p className="text-xs text-gray-400 mt-1">
                Dados aparecerão quando usuários começarem a usar features
              </p>
            </div>
          )}
        </div>

        {/* Eventos mais comuns */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-pink-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-pink-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Eventos Mais Comuns
            </h2>
          </div>

          {metrics?.topEvents && metrics.topEvents.length > 0 ? (
            <div className="space-y-4">
              {metrics.topEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {event.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {event.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum dado disponível</p>
              <p className="text-xs text-gray-400 mt-1">
                Eventos serão rastreados automaticamente
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Analytics em Tempo Real
            </h3>
            <p className="text-sm text-blue-700">
              Os dados são atualizados automaticamente. Para ver analytics mais
              detalhados (heatmaps, session replay, funnels), acesse o{' '}
              <a
                href="https://app.posthog.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:text-blue-900"
              >
                dashboard do PostHog
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
