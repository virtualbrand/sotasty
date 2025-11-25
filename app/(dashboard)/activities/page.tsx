'use client'

import { useState, useEffect } from 'react'
import { Activity, User, Package, ShoppingCart, Settings, Filter, Search, Calendar, Download, LucideIcon, X, Info, DollarSign, CalendarIcon, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CalendarWithRangePresets } from '@/components/ui/calendar-with-range-presets'
import { DateRange } from 'react-day-picker'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type ActivityType = {
  id: string
  action: string
  category: string
  description: string
  entity_type: string | null
  entity_id: string | null
  metadata: any
  created_at: string
  profiles: {
    full_name: string
  } | null
}

type ActivityWithIcon = ActivityType & {
  icon: LucideIcon
  user: string
  time: string
  date: string
}

export default function ActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [activities, setActivities] = useState<ActivityType[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const limit = 20

  // Buscar atividades da API
  useEffect(() => {
    fetchActivities()
  }, [searchTerm, activeFilters, dateRange, offset])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      })

      if (searchTerm) params.append('search', searchTerm)
      if (activeFilters.length > 0) params.append('category', activeFilters.join(','))
      if (dateRange?.from) params.append('startDate', dateRange.from.toISOString())
      if (dateRange?.to) params.append('endDate', dateRange.to.toISOString())

      const response = await fetch(`/api/activities?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar atividades')
      }

      const data = await response.json()
      setActivities(data.activities || [])
      setTotal(data.total || 0)
      console.log('🔍 Activities Page - fetched:', data.activities?.length, 'total:', data.total)
    } catch (error) {
      console.error('Erro ao buscar atividades:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mapear categoria para ícone
  const getIconForCategory = (category: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      pedido: ShoppingCart,
      produto: Package,
      cliente: User,
      configuracao: Settings,
      cardapio: Menu,
      financeiro: DollarSign,
      agenda: CalendarIcon,
      system: Activity
    }
    return iconMap[category] || Activity
  }

  // Processar atividades para adicionar informações de UI
  const processedActivities: ActivityWithIcon[] = activities.map(activity => ({
    ...activity,
    icon: getIconForCategory(activity.category),
    user: activity.profiles?.full_name || 'Usuário',
    time: formatDistanceToNow(new Date(activity.created_at), { 
      addSuffix: true, 
      locale: ptBR 
    }),
    date: format(new Date(activity.created_at), "d 'de' MMM yyyy", { locale: ptBR })
  }))

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      pedido: 'bg-blue-100 text-blue-700',
      produto: 'bg-purple-100 text-purple-700',
      cliente: 'bg-green-100 text-green-700',
      configuracao: 'bg-orange-100 text-orange-700',
      cardapio: 'bg-pink-100 text-pink-700',
      financeiro: 'bg-yellow-100 text-yellow-700',
      agenda: 'bg-indigo-100 text-indigo-700',
      system: 'bg-gray-100 text-gray-700'
    }
    return colors[category] || 'bg-gray-100 text-gray-700'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      pedido: 'Pedido',
      produto: 'Produto',
      cliente: 'Cliente',
      configuracao: 'Configuração',
      cardapio: 'Cardápio',
      financeiro: 'Financeiro',
      agenda: 'Agenda',
      system: 'Sistema'
    }
    return labels[category] || category
  }

  // Categorias disponíveis para filtro
  const allCategories = [
    { id: 'pedido', name: 'Pedido', color: 'blue' },
    { id: 'produto', name: 'Produto', color: 'purple' },
    { id: 'cliente', name: 'Cliente', color: 'green' },
    { id: 'cardapio', name: 'Cardápio', color: 'pink' },
    { id: 'financeiro', name: 'Financeiro', color: 'yellow' },
    { id: 'agenda', name: 'Agenda', color: 'indigo' },
    { id: 'configuracao', name: 'Configuração', color: 'orange' },
  ]

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    }
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
    setOffset(0) // Reset para primeira página
  }

  const clearFilters = () => {
    setActiveFilters([])
    setOffset(0) // Reset para primeira página
  }

  // Fechar filtros ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.filter-dropdown') && !target.closest('.filter-button')) {
        setShowCategoryFilter(false)
        setShowDateFilter(false)
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCategoryFilter(false)
        setShowDateFilter(false)
      }
    }

    if (showCategoryFilter || showDateFilter) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showCategoryFilter, showDateFilter])

  // Não precisamos mais filtrar no client-side, a API já faz isso
  const filteredActivities = processedActivities

  // Funções de paginação
  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit)
    }
  }

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit))
    }
  }

  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Atividades</h1>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
                Histórico completo de ações realizadas no sistema. Acompanhe todas as atividades relacionadas a pedidos, produtos, clientes e configurações.
              </div>
            </div>
          </div>
          <button className="bg-[var(--color-clay-500)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--color-clay-600)] transition font-semibold flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar atividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="filter-button h-10 cursor-pointer"
              onClick={() => {
                setShowCategoryFilter(!showCategoryFilter)
                setShowDateFilter(false)
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Categoria
              {allCategories.filter(c => activeFilters.includes(c.id)).length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {allCategories.filter(c => activeFilters.includes(c.id)).length}
                </Badge>
              )}
            </Button>
            
            {showCategoryFilter && (
              <div className="filter-dropdown absolute top-full mt-2 bg-[var(--color-bg-modal)] border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                {allCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => toggleFilter(category.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50 rounded"
                  >
                    <Badge className={`${getColorClass(category.color)} border text-xs px-2 py-1`}>
                      {category.name}
                    </Badge>
                    {activeFilters.includes(category.id) && (
                      <span className="text-xs text-green-600 font-semibold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="filter-button h-10 cursor-pointer"
              onClick={() => {
                setShowDateFilter(!showDateFilter)
                setShowCategoryFilter(false)
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Período
              {dateRange?.from && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {dateRange.from && dateRange.to 
                    ? `${format(dateRange.from, 'dd/MM', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM', { locale: ptBR })}`
                    : format(dateRange.from, 'dd/MM', { locale: ptBR })}
                </Badge>
              )}
            </Button>
            
            {showDateFilter && (
              <div className="filter-dropdown absolute top-full mt-2 right-0 z-50">
                <CalendarWithRangePresets 
                  onDateChange={setDateRange}
                  defaultDate={dateRange}
                />
              </div>
            )}
          </div>

          {(activeFilters.length > 0 || dateRange?.from) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 cursor-pointer"
              onClick={() => {
                clearFilters()
                setDateRange(undefined)
                setOffset(0)
              }}
            >
              Limpar
            </Button>
          )}
        </div>

        {(activeFilters.length > 0 || dateRange?.from) && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-gray-600">Filtros ativos:</span>
            {dateRange?.from && (
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-800 cursor-pointer hover:opacity-80 transition-opacity"
              >
                {dateRange.from && dateRange.to 
                  ? `${format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}`
                  : format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })}
                <button
                  onClick={() => setDateRange(undefined)}
                  className="ml-2 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {activeFilters.map(filter => {
              const category = allCategories.find(c => c.id === filter)
              
              return (
                <Badge
                  key={filter}
                  variant="secondary"
                  className={`${category ? getColorClass(category.color) : 'bg-gray-100 text-gray-800'} cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  {category?.name || filter}
                  <button
                    onClick={() => toggleFilter(filter)}
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

      {/* Lista de Atividades */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-clay-500)] mx-auto mb-3"></div>
            <p className="text-gray-500">Carregando atividades...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchTerm || activeFilters.length > 0 ? 'Nenhuma atividade encontrada' : 'Nenhuma atividade registrada'}</p>
            </div>
          ) : (
            filteredActivities.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Ícone */}
                    <div className="w-12 h-12 rounded-full bg-[var(--color-lavender-blush)] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[var(--color-clay-500)]" />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900">
                              {activity.action}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(activity.category)}`}>
                              {getCategoryLabel(activity.category)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {activity.user}
                            </span>
                            <span>•</span>
                            <span>{activity.time}</span>
                            <span>•</span>
                            <span>{activity.date}</span>
                          </div>
                        </div>

                        {/* Ações */}
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        )}

        {/* Paginação */}
        {!loading && filteredActivities.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{offset + 1}-{Math.min(offset + limit, total)}</span> de <span className="font-semibold">{total}</span> atividades
              </p>
              <div className="flex items-center gap-2">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600 px-3">
                  Página {currentPage} de {totalPages}
                </span>
                <button 
                  className="px-4 py-2 bg-[var(--color-clay-500)] text-white rounded-lg hover:bg-[var(--color-clay-600)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={handleNextPage}
                  disabled={offset + limit >= total}
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
