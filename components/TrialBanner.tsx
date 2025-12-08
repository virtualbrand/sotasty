'use client'

import { useEffect, useState } from 'react'
import { useTrialStatus } from '@/hooks/useTrialStatus'
import { X, Clock, AlertTriangle, AlertCircle, XCircle, Info, Sparkles } from 'lucide-react'
import Link from 'next/link'

const iconMap = {
  'clock': Clock,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'x-circle': XCircle,
  'info': Info,
  'sparkles': Sparkles,
}

export default function TrialBanner() {
  const { alerts, markAlertAsShown, dismissAlert, handleCtaClick, isLoading } = useTrialStatus()
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  // Processar alertas: filtrar não exibidos recentemente e não dispensados
  const visibleAlerts = alerts
    // .filter(alert => !alert.shown_recently && !dismissedAlerts.has(alert.alert_id)) // DESABILITADO PARA TESTES
    .filter(alert => !dismissedAlerts.has(alert.alert_id)) // Apenas verificar se foi dispensado manualmente

  // Marcar alertas como exibidos quando aparecem pela primeira vez
  useEffect(() => {
    // DESABILITADO PARA TESTES - não marcar como exibido
    // visibleAlerts.forEach(alert => {
    //   markAlertAsShown(alert.alert_id)
    // })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleAlerts.length]) // Executar apenas quando a quantidade mudar

  const handleDismiss = (alertId: string) => {
    dismissAlert(alertId)
    setDismissedAlerts(prev => new Set([...prev, alertId]))
  }

  const handleCtaClickInternal = async (alertId: string) => {
    await handleCtaClick(alertId)
    // O Link component do Next.js vai lidar com a navegação
  }

  if (isLoading || visibleAlerts.length === 0) {
    return null
  }

  // Mostrar apenas o alerta de maior prioridade
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
  const topAlert = visibleAlerts.sort((a, b) => 
    priorityOrder[b.priority] - priorityOrder[a.priority]
  )[0]

  const IconComponent = iconMap[topAlert.icon as keyof typeof iconMap] || AlertCircle

  return (
    <div className="mb-8 animate-in slide-in-from-top duration-300">
      <div 
        className="w-full rounded-xl border shadow-lg"
        style={{ 
          backgroundColor: topAlert.background_color,
          borderColor: topAlert.background_color === '#FEF2F2' ? '#DC2626' : '#c9935a',
        }}
      >
        <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Icon + Message */}
          <div className="flex items-center gap-3 flex-1">
            <IconComponent 
              className="w-5 h-5 flex-shrink-0" 
              style={{ color: topAlert.text_color }}
            />
            <div className="flex-1">
              <p 
                className="font-bold text-sm"
                style={{ color: topAlert.text_color }}
              >
                {topAlert.title}
              </p>
              <p 
                className="text-sm opacity-90 mt-0.5"
                style={{ color: topAlert.text_color }}
              >
                {topAlert.message}
              </p>
            </div>
          </div>

          {/* CTA Button */}
          {topAlert.show_cta && (
            <Link
              href={topAlert.cta_link}
              onClick={() => handleCtaClickInternal(topAlert.alert_id)}
              className="btn-primary-xs whitespace-nowrap"
            >
              {topAlert.cta_text}
            </Link>
          )}

          {/* Dismiss Button */}
          <button
            onClick={() => handleDismiss(topAlert.alert_id)}
            className="p-1 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
            style={{ color: topAlert.text_color }}
            aria-label="Dispensar alerta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper function to darken/lighten colors
function adjustColor(color: string, amount: number): string {
  // Converter hex para RGB
  const hex = color.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount))
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
