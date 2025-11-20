'use client'

import { useState } from 'react'
import { Bell, Mail, MessageSquare, Calendar, Check } from 'lucide-react'
import { showToast } from '@/app/(dashboard)/layout'

interface NotificationSettings {
  email: boolean
  push: boolean
}

const defaultNotifications = [
  {
    id: 'new-orders',
    icon: Bell,
    title: 'Novos Pedidos',
    description: 'Receba notificações quando um novo pedido for criado',
    email: true,
    push: true,
  },
  {
    id: 'delivery-reminders',
    icon: Calendar,
    title: 'Lembretes de Entrega',
    description: 'Notificações sobre pedidos próximos da data de entrega',
    email: true,
    push: false,
  },
  {
    id: 'customer-messages',
    icon: MessageSquare,
    title: 'Mensagens de Clientes',
    description: 'Quando um cliente enviar uma mensagem',
    email: false,
    push: true,
  },
  {
    id: 'weekly-reports',
    icon: Mail,
    title: 'Relatórios Semanais',
    description: 'Resumo semanal das vendas e pedidos',
    email: true,
    push: false,
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Record<string, NotificationSettings>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notificationSettings')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    // Inicializar com valores padrão
    return defaultNotifications.reduce((acc, notif) => {
      acc[notif.id] = { email: notif.email, push: notif.push }
      return acc
    }, {} as Record<string, NotificationSettings>)
  })

  const [savedNotifications, setSavedNotifications] = useState<Record<string, NotificationSettings>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notificationSettings')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return defaultNotifications.reduce((acc, notif) => {
      acc[notif.id] = { email: notif.email, push: notif.push }
      return acc
    }, {} as Record<string, NotificationSettings>)
  })

  const hasChanges = JSON.stringify(notifications) !== JSON.stringify(savedNotifications)

  const handleCheckboxChange = (id: string, type: 'email' | 'push', checked: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [type]: checked
      }
    }))
  }

  const handleSave = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notifications))
    setSavedNotifications(notifications)
    
    showToast({
      title: 'Preferências salvas!',
      message: 'Suas configurações de notificações foram atualizadas',
      variant: 'success',
      duration: 3000,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Notificações</h2>
      <p className="text-gray-600 mb-6">
        Gerencie como e quando você recebe notificações
      </p>

      <div className="space-y-4">
        {defaultNotifications.map((notification) => {
          const Icon = notification.icon
          const settings = notifications[notification.id] || { email: notification.email, push: notification.push }
          
          return (
            <div key={notification.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[var(--color-lavender-blush)] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[var(--color-clay-500)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email}
                    onChange={(e) => handleCheckboxChange(notification.id, 'email', e.target.checked)}
                    className="w-4 h-4 text-[#BE9089] border-gray-300 rounded-full focus:ring-[#BE9089] focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.push}
                    onChange={(e) => handleCheckboxChange(notification.id, 'push', e.target.checked)}
                    className="w-4 h-4 text-[#BE9089] border-gray-300 rounded-full focus:ring-[#BE9089] focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Push</span>
                </label>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end mt-6">
        <button 
          onClick={handleSave}
          disabled={!hasChanges}
          className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          Salvar alterações
        </button>
      </div>
    </div>
  )
}
