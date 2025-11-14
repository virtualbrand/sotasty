'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, Info } from 'lucide-react'

export default function FinanceiroPage() {
  const [showTransactionMenu, setShowTransactionMenu] = useState(false)

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showTransactionMenu && !target.closest('.transaction-menu')) {
        setShowTransactionMenu(false)
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showTransactionMenu) {
        setShowTransactionMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showTransactionMenu])

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
                Controle suas finanças. Registre receitas e despesas, acompanhe o fluxo de caixa e mantenha o controle financeiro do seu negócio.
              </div>
            </div>
          </div>
          
          <div className="relative transaction-menu">
            <button 
              onClick={() => setShowTransactionMenu(!showTransactionMenu)}
              className="bg-[var(--color-old-rose)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--color-rosy-brown)] transition font-semibold cursor-pointer"
            >
              + Transação
            </button>

            {showTransactionMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => {
                    setShowTransactionMenu(false)
                    // TODO: Abrir modal de receita
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors flex items-center gap-3 rounded-lg mx-2"
                  style={{ width: 'calc(100% - 1rem)' }}
                >
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Receita</span>
                </button>
                <button
                  onClick={() => {
                    setShowTransactionMenu(false)
                    // TODO: Abrir modal de despesa
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 rounded-lg mx-2"
                  style={{ width: 'calc(100% - 1rem)' }}
                >
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="text-gray-700">Despesa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Este mês</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">R$ 0,00</h3>
          <p className="text-sm text-gray-600">Receitas</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Este mês</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">R$ 0,00</h3>
          <p className="text-sm text-gray-600">Despesas</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-lavender-blush)] flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[var(--color-old-rose)]" />
            </div>
            <span className="text-sm text-gray-500">Este mês</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">R$ 0,00</h3>
          <p className="text-sm text-gray-600">Saldo</p>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Transações Recentes</h2>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Novembro 2025</span>
          </div>
        </div>

        <div className="text-center py-12 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma transação registrada ainda</p>
          <p className="text-sm mt-2">Comece adicionando suas receitas e despesas</p>
        </div>
      </div>

      {/* Mensagem de funcionalidade em desenvolvimento */}
      <div className="mt-8 bg-[var(--color-lavender-blush)] border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-700 text-sm">
          <strong>Em desenvolvimento:</strong> Esta funcionalidade será expandida em breve com gráficos, relatórios detalhados e muito mais!
        </p>
      </div>
    </div>
  )
}
