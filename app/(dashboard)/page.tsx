'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown, DollarSign, Users, Package, ShoppingCart, Target, Percent, Award, Info, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import SaaSMetricsChart from '@/components/charts/SaaSMetricsChart'
import PageLoading from '@/components/PageLoading'

export default function Home() {
  const [userRole, setUserRole] = useState<string>('admin')
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const monthPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false)
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMonthPicker) {
        setShowMonthPicker(false)
      }
    }

    if (showMonthPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showMonthPicker])

  useEffect(() => {
    const loadUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile?.role) {
          setUserRole(profile.role)
        }
      }
      setLoading(false)
    }
    
    loadUserRole()
  }, [])

  const formatMonthYear = (date: Date) => {
    return format(date, 'MMMM yyyy', { locale: ptBR })
  }

  const handlePreviousMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1))
  }

  const handleNextMonth = () => {
    setSelectedDate(addMonths(selectedDate, 1))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <PageLoading />
      </div>
    )
  }

  // Dashboard para SuperAdmin (SaaS Metrics)
  if (userRole === 'superadmin') {
    return (
      <div className="p-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Métricas de crescimento e performance do SoTasty</p>
          </div>
          
          {/* Filtro de Mês */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <button
              onClick={handlePreviousMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 px-2">
              <CalendarIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900 capitalize min-w-[140px] text-center">
                {formatMonthYear(selectedDate)}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Gráfico de Métricas SaaS */}
        <div className="mb-6">
          <SaaSMetricsChart />
        </div>

        {/* Métricas de Cliente */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Métricas de Cliente</h2>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[400px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200 p-4">
                <strong>CAC</strong> (Customer Acquisition Cost): Custo médio para adquirir cada novo cliente (marketing + vendas).<br/><br/>
                <strong>LTV</strong> (Lifetime Value): Valor total que um cliente gera durante todo o relacionamento. Ideal: LTV:CAC ≥ 3:1.<br/><br/>
                <strong>Churn Rate</strong>: Taxa de cancelamento mensal. Abaixo de 5-7% é considerado saudável para SaaS.<br/><br/>
                <strong>Total Clientes</strong>: Número total de assinantes ativos no momento.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-pink-600" />
                </div>
                <span className="text-sm text-green-600 font-semibold flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  -8%
                </span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">CAC</h3>
              <p className="text-3xl font-bold text-gray-900">R$ 285</p>
              <p className="text-xs text-gray-400 mt-2">Custo de Aquisição do Cliente</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="text-sm text-indigo-600 font-semibold">3.8:1</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">LTV</h3>
              <p className="text-3xl font-bold text-gray-900">R$ 1.083</p>
              <p className="text-xs text-gray-400 mt-2">Lifetime Value</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Percent className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-sm text-red-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +0.5%
                </span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Churn Rate</h3>
              <p className="text-3xl font-bold text-gray-900">4.2%</p>
              <p className="text-xs text-gray-400 mt-2">Taxa de cancelamento mensal</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
                <span className="text-sm text-teal-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +23
                </span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Total Clientes</h3>
              <p className="text-3xl font-bold text-gray-900">187</p>
              <p className="text-xs text-gray-400 mt-2">Assinantes ativos</p>
            </div>
          </div>
        </div>

        {/* Métricas de Produto */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Métricas de Engajamento</h2>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[400px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200 p-4">
                <strong>Taxa de Ativação</strong>: Percentual de clientes que efetivamente começaram a usar o produto após assinar.<br/><br/>
                <strong>NPS Score</strong> (Net Promoter Score): Métrica de satisfação. Acima de 50 é excelente, 70+ é excepcional.<br/><br/>
                <strong>Time to Value</strong>: Tempo médio até o cliente gerar seu primeiro resultado ou valor com o produto.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-cyan-600" />
                </div>
                <span className="text-sm text-cyan-600 font-semibold">65%</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Taxa de Ativação</h3>
              <p className="text-3xl font-bold text-gray-900">122/187</p>
              <p className="text-xs text-gray-400 mt-2">Clientes que começaram a usar</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-sm text-green-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +5pts
                </span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">NPS Score</h3>
              <p className="text-3xl font-bold text-gray-900">72</p>
              <p className="text-xs text-gray-400 mt-2">Net Promoter Score</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-lime-600" />
                </div>
                <span className="text-sm text-lime-600 font-semibold">4.5 dias</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Time to Value</h3>
              <p className="text-3xl font-bold text-gray-900">~5 dias</p>
              <p className="text-xs text-gray-400 mt-2">Tempo até primeiro valor gerado</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard para Admin/Member (Métricas de Confeitaria)
  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao SoTasty - Sistema de Gestão para Gastronomia</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-pink-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+2.08%</span>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Total de Produtos</h3>
          <p className="text-3xl font-bold text-gray-900">120</p>
          <p className="text-xs text-gray-400 mt-2">vs. último mês</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-red-600 font-semibold">-2.08%</span>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Pedidos Ativos</h3>
          <p className="text-3xl font-bold text-gray-900">45</p>
          <p className="text-xs text-gray-400 mt-2">vs. último mês</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+25.8%</span>
          </div>
          <h3 className="text-gray-600 text-sm mb-1">Receita Mensal</h3>
          <p className="text-3xl font-bold text-gray-900">R$ 15.890</p>
          <p className="text-xs text-gray-400 mt-2">vs. último mês</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Placeholder */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Vendas Recentes</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p>Gráfico de vendas será exibido aqui</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h2>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Bolo de Chocolate</p>
                <p className="text-sm text-gray-500">Maria Silva</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                Confirmado
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Cupcakes Diversos</p>
                <p className="text-sm text-gray-500">João Santos</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                Pendente
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Torta de Limão</p>
                <p className="text-sm text-gray-500">Ana Costa</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                Em Preparo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
