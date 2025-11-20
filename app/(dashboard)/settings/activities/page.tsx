'use client'

import { useState } from 'react'
import { User, Package, ShoppingCart, Settings } from 'lucide-react'

export default function ActivitiesPage() {
  const [showInSidebar, setShowInSidebar] = useState(() => {
    // Inicializa do localStorage se disponível
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showActivitiesInSidebar')
      return saved === null ? true : saved === 'true'
    }
    return true
  })

  // Salva a preferência e dispara evento
  const handleToggle = () => {
    const newValue = !showInSidebar
    setShowInSidebar(newValue)
    localStorage.setItem('showActivitiesInSidebar', String(newValue))
    
    // Dispara evento para atualizar a sidebar
    const event = new CustomEvent('toggle-activities-sidebar', { 
      detail: { show: newValue } 
    })
    window.dispatchEvent(event)
  }

  const activities = [
    {
      icon: ShoppingCart,
      action: 'Pedido criado',
      description: 'Bolo de Chocolate 2kg para Maria Silva',
      time: 'Há 2 horas',
      date: '10 Nov 2025',
    },
    {
      icon: Package,
      action: 'Produto atualizado',
      description: 'Preço do Bolo de Morango alterado',
      time: 'Há 5 horas',
      date: '10 Nov 2025',
    },
    {
      icon: User,
      action: 'Cliente cadastrado',
      description: 'João Santos adicionado aos clientes',
      time: 'Ontem',
      date: '9 Nov 2025',
    },
    {
      icon: Settings,
      action: 'Configurações alteradas',
      description: 'Preferências de ordenação atualizadas',
      time: 'Há 2 dias',
      date: '8 Nov 2025',
    },
    {
      icon: ShoppingCart,
      action: 'Pedido concluído',
      description: 'Torta de Limão entregue para Ana Costa',
      time: 'Há 3 dias',
      date: '7 Nov 2025',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Configuração do Menu Lateral */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Exibir no menu lateral</h3>
            <p className="text-sm text-gray-600 mt-1">
              Mostrar Atividades como item do menu principal
            </p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showInSidebar ? 'bg-[var(--color-clay-500)]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showInSidebar ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Lista de Atividades */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Atividades Recentes</h2>
          <p className="text-gray-600 mt-1">Histórico de ações realizadas no sistema</p>
        </div>

      <div className="divide-y divide-gray-200">
        {activities.map((activity, index) => {
          const Icon = activity.icon
          return (
            <div key={index} className="p-6 hover:bg-gray-50 transition">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--color-lavender-blush)] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[var(--color-clay-500)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-2">{activity.time} • {activity.date}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-6 border-t border-gray-200 text-center">
        <button className="text-sm text-[var(--color-clay-500)] hover:text-[var(--color-clay-600)] font-medium">
          Ver todas as atividades
        </button>
      </div>
      </div>
    </div>
  )
}
