'use client'

import { useState } from 'react'
import { Save, Layout } from 'lucide-react'
import { showToast } from '@/app/(dashboard)/layout'

// Função para obter o valor inicial do localStorage
const getInitialMenuPosition = (): 'sidebar' | 'header' | 'footer' | 'right' => {
  if (typeof window === 'undefined') return 'sidebar'
  const saved = localStorage.getItem('menuPosition')
  return (saved as 'sidebar' | 'header' | 'footer' | 'right') || 'sidebar'
}

const getInitialShowDailyBalance = (): boolean => {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem('showDailyBalance')
  return saved === 'true'
}

export default function PreferencesPage() {
  const [menuPosition, setMenuPosition] = useState<'sidebar' | 'header' | 'footer' | 'right'>(getInitialMenuPosition)
  const [savedMenuPosition, setSavedMenuPosition] = useState<'sidebar' | 'header' | 'footer' | 'right'>(getInitialMenuPosition)
  const [showDailyBalance, setShowDailyBalance] = useState(getInitialShowDailyBalance)
  const [savedShowDailyBalance, setSavedShowDailyBalance] = useState(getInitialShowDailyBalance)

  const hasChanges = menuPosition !== savedMenuPosition || showDailyBalance !== savedShowDailyBalance

  const handleSave = () => {
    localStorage.setItem('menuPosition', menuPosition)
    localStorage.setItem('showDailyBalance', showDailyBalance.toString())
    
    setSavedMenuPosition(menuPosition)
    setSavedShowDailyBalance(showDailyBalance)

    // Disparar evento para atualizar o layout imediatamente
    const event = new CustomEvent('menu-position-changed', {
      detail: { position: menuPosition }
    })
    window.dispatchEvent(event)

    const positionLabels = {
      sidebar: 'Lateral Esquerda',
      right: 'Lateral Direita',
      header: 'Topo (Header)',
      footer: 'Rodapé (Footer)'
    }

    showToast({
      title: 'Preferências salvas!',
      message: `Menu posicionado em: ${positionLabels[menuPosition]}`,
      variant: 'success',
      duration: 3000,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 space-y-6">
        {/* Posição do Menu */}
        <div className="pb-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Layout className="w-5 h-5 text-gray-700" />
                <h3 className="text-base font-semibold text-gray-900">Posição do Menu</h3>
              </div>
              <p className="text-sm text-gray-600">
                Escolha onde deseja visualizar o menu de navegação principal
              </p>
            </div>
            <div className="ml-6 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="menuPosition"
                  value="sidebar"
                  checked={menuPosition === 'sidebar'}
                  onChange={(e) => setMenuPosition(e.target.value as 'sidebar' | 'header' | 'footer' | 'right')}
                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Esquerda</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="menuPosition"
                  value="right"
                  checked={menuPosition === 'right'}
                  onChange={(e) => setMenuPosition(e.target.value as 'sidebar' | 'header' | 'footer' | 'right')}
                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Direita</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="menuPosition"
                  value="header"
                  checked={menuPosition === 'header'}
                  onChange={(e) => setMenuPosition(e.target.value as 'sidebar' | 'header' | 'footer' | 'right')}
                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Topo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="menuPosition"
                  value="footer"
                  checked={menuPosition === 'footer'}
                  onChange={(e) => setMenuPosition(e.target.value as 'sidebar' | 'header' | 'footer' | 'right')}
                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Rodapé</span>
              </label>
            </div>
          </div>
        </div>

        {/* Saldo Diário */}
        <div className="pb-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">Saldo diário</h3>
              <p className="text-sm text-gray-600 mt-1">
                Mostra saldos listados na tela de Pedidos ao final de cada dia
              </p>
            </div>
            <div className="ml-6 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="showDailyBalance"
                  value="yes"
                  checked={showDailyBalance}
                  onChange={() => setShowDailyBalance(true)}
                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Sim</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="showDailyBalance"
                  value="no"
                  checked={!showDailyBalance}
                  onChange={() => setShowDailyBalance(false)}
                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Não</span>
              </label>
            </div>
          </div>
        </div>

        {/* Começar do Zero */}
        <div className="pb-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">Começar do zero</h3>
              <p className="text-sm text-gray-600 mt-1">
                Aqui você pode zerar sua conta, deletando toda sua movimentação financeira. 
                Suas contas, clientes e produtos cadastrados permanecerão intactos.
              </p>
            </div>
            <div className="ml-6">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-[var(--color-old-rose)] hover:text-[var(--color-rosy-brown)] transition"
              >
                Excluir minhas transações
              </button>
            </div>
          </div>
        </div>

        {/* Excluir Conta */}
        <div className="pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">Excluir conta</h3>
              <p className="text-sm text-gray-600 mt-1">
                Já é hora de dizer tchau? Aqui você pode excluir sua conta definitivamente
              </p>
            </div>
            <div className="ml-6">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition"
              >
                Excluir conta por completo
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`inline-flex items-center gap-2 ${
              !hasChanges 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed px-6 py-2.5 rounded-full font-semibold text-sm'
                : 'btn-success'
            }`}
          >
            <Save className="w-4 h-4" />
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}
