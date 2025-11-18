'use client'

import { useState, useEffect, useRef } from 'react'
import { Mail, Phone, Clock, TrendingUp, Package, ShoppingCart, X, Search, Info, User, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type SaaSCustomer = {
  id: string
  company_name: string
  email: string
  phone: string
  status: 'trial' | 'active' | 'canceled' | 'past_due' | 'expired'
  plan: 'start' | 'grow' | 'scale'
  trial_start: string
  trial_end: string
  conversion_date: string | null
  mrr: number
  total_revenue: number
  payment_status: 'paid' | 'pending' | 'failed'
  next_billing: string
  last_access: string
  days_active_7: number
  days_active_30: number
  products_count: number
  orders_count: number
  health_score: 'red' | 'yellow' | 'green'
  tags: string[]
  notes: string
  created_at: string
}

// Mock data
const mockCustomers: SaaSCustomer[] = [
  {
    id: '1',
    company_name: 'Doce Arte Confeitaria',
    email: 'contato@docearte.com.br',
    phone: '(48) 99999-1234',
    status: 'active',
    plan: 'grow',
    trial_start: '2025-11-01',
    trial_end: '2025-11-15',
    conversion_date: '2025-11-14',
    mrr: 197,
    total_revenue: 591,
    payment_status: 'paid',
    next_billing: '2025-12-14',
    last_access: '2025-11-17T10:30:00',
    days_active_7: 7,
    days_active_30: 28,
    products_count: 45,
    orders_count: 123,
    health_score: 'green',
    tags: ['Power User'],
    notes: 'Cliente muito engajado, usa todas as features',
    created_at: '2025-11-01'
  },
  {
    id: '2',
    company_name: 'Sabor Doce',
    email: 'admin@sabordoce.com',
    phone: '(11) 98888-5678',
    status: 'trial',
    plan: 'start',
    trial_start: '2025-11-10',
    trial_end: '2025-11-24',
    conversion_date: null,
    mrr: 0,
    total_revenue: 0,
    payment_status: 'pending',
    next_billing: '2025-11-24',
    last_access: '2025-11-16T15:20:00',
    days_active_7: 4,
    days_active_30: 4,
    products_count: 8,
    orders_count: 2,
    health_score: 'yellow',
    tags: ['Trial', 'Precisa Onboarding'],
    notes: 'Não acessou nos últimos 2 dias',
    created_at: '2025-11-10'
  },
  {
    id: '3',
    company_name: 'Confeitaria Premium',
    email: 'gestao@premium.com.br',
    phone: '(21) 97777-9012',
    status: 'trial',
    plan: 'grow',
    trial_start: '2025-11-12',
    trial_end: '2025-11-26',
    conversion_date: null,
    mrr: 0,
    total_revenue: 0,
    payment_status: 'pending',
    next_billing: '2025-11-26',
    last_access: '2025-11-12T09:15:00',
    days_active_7: 1,
    days_active_30: 1,
    products_count: 0,
    orders_count: 0,
    health_score: 'red',
    tags: ['Risco de Churn', 'Trial'],
    notes: '⚠️ Cadastrou mas nunca voltou - 5 dias sem acesso',
    created_at: '2025-11-12'
  },
  {
    id: '4',
    company_name: 'Bolo & Cia',
    email: 'contato@boloecia.com',
    phone: '(47) 96666-3456',
    status: 'active',
    plan: 'scale',
    trial_start: '2025-10-15',
    trial_end: '2025-10-29',
    conversion_date: '2025-10-28',
    mrr: 397,
    total_revenue: 794,
    payment_status: 'paid',
    next_billing: '2025-12-28',
    last_access: '2025-11-17T08:45:00',
    days_active_7: 6,
    days_active_30: 27,
    products_count: 89,
    orders_count: 234,
    health_score: 'green',
    tags: ['Power User', 'High LTV'],
    notes: 'Melhor cliente do mês',
    created_at: '2025-10-15'
  }
]

export default function SuperAdminCustomers() {
  const [customers] = useState<SaaSCustomer[]>(mockCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<SaaSCustomer | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [showPlanFilter, setShowPlanFilter] = useState(false)
  const [showHealthFilter, setShowHealthFilter] = useState(false)
  
  const statusFilterRef = useRef<HTMLDivElement>(null)
  const planFilterRef = useRef<HTMLDivElement>(null)
  const healthFilterRef = useRef<HTMLDivElement>(null)

  // Fechar filtros ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusFilterRef.current && !statusFilterRef.current.contains(event.target as Node)) {
        setShowStatusFilter(false)
      }
      if (planFilterRef.current && !planFilterRef.current.contains(event.target as Node)) {
        setShowPlanFilter(false)
      }
      if (healthFilterRef.current && !healthFilterRef.current.contains(event.target as Node)) {
        setShowHealthFilter(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowStatusFilter(false)
        setShowPlanFilter(false)
        setShowHealthFilter(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [])

  const getStatusBadge = (status: string) => {
    const badges = {
      trial: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      canceled: 'bg-gray-100 text-gray-700',
      past_due: 'bg-red-100 text-red-700',
      expired: 'bg-orange-100 text-orange-700'
    }
    const labels = {
      trial: 'Trial',
      active: 'Ativo',
      canceled: 'Cancelado',
      past_due: 'Inadimplente',
      expired: 'Expirado'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getPlanBadge = (plan: string) => {
    const badges = {
      start: 'bg-purple-100 text-purple-700',
      grow: 'bg-pink-100 text-pink-700',
      scale: 'bg-indigo-100 text-indigo-700'
    }
    const labels = {
      start: 'Start',
      grow: 'Grow',
      scale: 'Scale'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[plan as keyof typeof badges]}`}>
        {labels[plan as keyof typeof labels]}
      </span>
    )
  }

  const getHealthIcon = (health: string) => {
    if (health === 'red') return '🔴'
    if (health === 'yellow') return '🟡'
    return '🟢'
  }

  const getDaysRemaining = (trialEnd: string) => {
    const end = new Date(trialEnd)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatLastAccess = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 60) return `${diffMinutes}min atrás`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`
    return `${Math.floor(diffMinutes / 1440)}d atrás`
  }

  const getCustomerSince = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = now.getTime() - created.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Cliente há hoje'
    if (diffDays === 1) return 'Cliente há 1 dia'
    if (diffDays < 30) return `Cliente há ${diffDays} dias`
    
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths === 1) return 'Cliente há 1 mês'
    if (diffMonths < 12) return `Cliente há ${diffMonths} meses`
    
    const diffYears = Math.floor(diffMonths / 12)
    const remainingMonths = diffMonths % 12
    if (diffYears === 1 && remainingMonths === 0) return 'Cliente há 1 ano'
    if (remainingMonths === 0) return `Cliente há ${diffYears} anos`
    return `Cliente há ${diffYears} ano${diffYears > 1 ? 's' : ''} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`
  }

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    )
  }

  const clearFilters = () => {
    setActiveFilters([])
  }

  const removeFilter = (filter: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filter))
  }

  const allStatus = [
    { id: 'trial', name: 'Trial', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'active', name: 'Ativo', color: 'bg-green-100 text-green-800 border-green-200' },
    { id: 'canceled', name: 'Cancelado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { id: 'past_due', name: 'Inadimplente', color: 'bg-red-100 text-red-800 border-red-200' },
    { id: 'expired', name: 'Expirado', color: 'bg-orange-100 text-orange-800 border-orange-200' }
  ]

  const allPlans = [
    { id: 'start', name: 'Start', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { id: 'grow', name: 'Grow', color: 'bg-pink-100 text-pink-800 border-pink-200' },
    { id: 'scale', name: 'Scale', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
  ]

  const allHealth = [
    { id: 'green', name: '🟢 Saudável', color: 'bg-green-100 text-green-800 border-green-200' },
    { id: 'yellow', name: '🟡 Atenção', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { id: 'red', name: '🔴 Risco', color: 'bg-red-100 text-red-800 border-red-200' }
  ]

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeFilters.length === 0) return matchesSearch

    const statusFilters = activeFilters.filter(f => allStatus.some(s => s.id === f))
    const planFilters = activeFilters.filter(f => allPlans.some(p => p.id === f))
    const healthFilters = activeFilters.filter(f => allHealth.some(h => h.id === f))

    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(customer.status)
    const matchesPlan = planFilters.length === 0 || planFilters.includes(customer.plan)
    const matchesHealth = healthFilters.length === 0 || healthFilters.includes(customer.health_score)

    return matchesSearch && matchesStatus && matchesPlan && matchesHealth
  })

  const statusCounts = {
    trial: customers.filter(c => c.status === 'trial').length,
    active: customers.filter(c => c.status === 'active').length,
    risk: customers.filter(c => c.health_score === 'red' || c.health_score === 'yellow').length,
    canceled: customers.filter(c => c.status === 'canceled').length,
    past_due: customers.filter(c => c.status === 'past_due').length
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Clientes SaaS</h1>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[400px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200 p-4">
              Visão completa de todos os clientes do CakeCloud. Monitore status de trial, conversões, engajamento e identifique clientes em risco de churn.
            </div>
          </div>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro Status */}
          <div className="relative" ref={statusFilterRef}>
            <Button
              variant="outline"
              size="sm"
              className="filter-button h-10 cursor-pointer"
              onClick={() => {
                setShowStatusFilter(!showStatusFilter)
                setShowPlanFilter(false)
                setShowHealthFilter(false)
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Status
              {allStatus.filter(s => activeFilters.includes(s.id)).length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {allStatus.filter(s => activeFilters.includes(s.id)).length}
                </Badge>
              )}
            </Button>
            
            {showStatusFilter && (
              <div className="filter-dropdown absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                {allStatus.map(status => (
                  <button
                    key={status.id}
                    onClick={() => toggleFilter(status.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50 rounded"
                  >
                    <Badge className={`${status.color} border text-xs font-medium px-2 py-1`}>
                      {status.name}
                    </Badge>
                    {activeFilters.includes(status.id) && (
                      <span className="text-xs text-green-600 font-semibold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro Plano */}
          <div className="relative" ref={planFilterRef}>
            <Button
              variant="outline"
              size="sm"
              className="filter-button h-10 cursor-pointer"
              onClick={() => {
                setShowPlanFilter(!showPlanFilter)
                setShowStatusFilter(false)
                setShowHealthFilter(false)
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Plano
              {allPlans.filter(p => activeFilters.includes(p.id)).length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {allPlans.filter(p => activeFilters.includes(p.id)).length}
                </Badge>
              )}
            </Button>
            
            {showPlanFilter && (
              <div className="filter-dropdown absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                {allPlans.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => toggleFilter(plan.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50 rounded"
                  >
                    <Badge className={`${plan.color} border text-xs font-medium px-2 py-1`}>
                      {plan.name}
                    </Badge>
                    {activeFilters.includes(plan.id) && (
                      <span className="text-xs text-green-600 font-semibold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro Health */}
          <div className="relative" ref={healthFilterRef}>
            <Button
              variant="outline"
              size="sm"
              className="filter-button h-10 cursor-pointer"
              onClick={() => {
                setShowHealthFilter(!showHealthFilter)
                setShowStatusFilter(false)
                setShowPlanFilter(false)
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Health
              {allHealth.filter(h => activeFilters.includes(h.id)).length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {allHealth.filter(h => activeFilters.includes(h.id)).length}
                </Badge>
              )}
            </Button>
            
            {showHealthFilter && (
              <div className="filter-dropdown absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                {allHealth.map(health => (
                  <button
                    key={health.id}
                    onClick={() => toggleFilter(health.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50 rounded"
                  >
                    <Badge className={`${health.color} border text-xs font-medium px-2 py-1`}>
                      {health.name}
                    </Badge>
                    {activeFilters.includes(health.id) && (
                      <span className="text-xs text-green-600 font-semibold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 cursor-pointer"
              onClick={clearFilters}
            >
              Limpar
            </Button>
          )}
        </div>

        {/* Filtros Ativos */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-gray-600">Filtros ativos:</span>
            {activeFilters.map(filter => {
              const status = allStatus.find(s => s.id === filter)
              const plan = allPlans.find(p => p.id === filter)
              const health = allHealth.find(h => h.id === filter)
              const item = status || plan || health
              
              if (!item) return null

              return (
                <Badge
                  key={filter}
                  variant="secondary"
                  className={`${item.color} border text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  {item.name}
                  <button
                    onClick={() => removeFilter(filter)}
                    className="ml-2 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="overflow-x-auto p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Cliente
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Plano
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  MRR
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Receita total
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Último acesso
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Engajamento
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Health
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-5">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div>
                      <div className="font-medium text-gray-900 mb-0.5">{customer.company_name}</div>
                      <div className="text-xs text-gray-500">{getCustomerSince(customer.created_at)}</div>
                      {customer.status === 'trial' && (
                        <div className="text-xs text-blue-600 font-medium mt-1">
                          {getDaysRemaining(customer.trial_end)} dias restantes
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {getStatusBadge(customer.status)}
                  </td>
                  <td className="px-6 py-3">
                    {getPlanBadge(customer.plan)}
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">
                      {customer.mrr > 0 ? `R$ ${customer.mrr}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">
                      {customer.total_revenue > 0 ? `R$ ${customer.total_revenue}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-sm text-gray-700">{formatLastAccess(customer.last_access)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{customer.days_active_7}/7 dias ativos</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-700">{customer.products_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-700">{customer.orders_count}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-start">
                      <span className="text-xs">{getHealthIcon(customer.health_score)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum cliente encontrado.
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCustomer(null)
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.company_name}</h2>
                <p className="text-sm text-gray-500">Cliente desde {formatDate(selectedCustomer.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status e Health Score */}
              <div className="flex items-center gap-4">
                <span className="text-4xl">{getHealthIcon(selectedCustomer.health_score)}</span>
                <div className="flex gap-2">
                  {getStatusBadge(selectedCustomer.status)}
                  {getPlanBadge(selectedCustomer.plan)}
                </div>
              </div>

              {/* Contato */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Informações de Contato</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                </div>
              </div>

              {/* Financeiro */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Financeiro</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">MRR</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedCustomer.mrr > 0 ? `R$ ${selectedCustomer.mrr}` : 'R$ 0'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Próx. Cobrança</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatDate(selectedCustomer.next_billing)}
                    </div>
                  </div>
                </div>
                {selectedCustomer.conversion_date && (
                  <div className="mt-2 text-sm text-gray-600">
                    Convertido em: {formatDate(selectedCustomer.conversion_date)}
                  </div>
                )}
              </div>

              {/* Engajamento */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Engajamento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-600">Último acesso</div>
                      <div className="font-semibold text-gray-900">
                        {formatLastAccess(selectedCustomer.last_access)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="text-sm text-gray-600">Dias ativos (7d)</div>
                      <div className="font-semibold text-gray-900">
                        {selectedCustomer.days_active_7}/7
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-sm text-gray-600">Produtos</div>
                      <div className="font-semibold text-gray-900">
                        {selectedCustomer.products_count}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-pink-600" />
                    <div>
                      <div className="text-sm text-gray-600">Pedidos</div>
                      <div className="font-semibold text-gray-900">
                        {selectedCustomer.orders_count}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedCustomer.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedCustomer.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Notas Internas</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
                    {selectedCustomer.notes}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="btn-info flex-1">
                  Enviar Email
                </button>
                <button className="btn-warning flex-1">
                  Ver Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
