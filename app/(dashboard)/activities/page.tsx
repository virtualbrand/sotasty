'use client'

import { useState, useEffect } from 'react'
import { Activity, User, Package, ShoppingCart, Settings, Filter, Search, Calendar, Download, LucideIcon, X, Info, DollarSign, CalendarIcon, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CalendarWithRangePresets } from '@/components/ui/calendar-with-range-presets'
import { Spinner } from '@/components/ui/spinner'
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
  const processedActivities: ActivityWithIcon[] = activities.map(activity => {
    const now = new Date()
    const createdAt = new Date(activity.created_at)
    const diffInMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60))
    
    let timeAgo = ''
    if (diffInMinutes < 1) {
      timeAgo = 'Agora'
    } else if (diffInMinutes < 60) {
      timeAgo = `Há ${diffInMinutes} min`
    } else if (diffInMinutes < 1440) { // menos de 24 horas
      const hours = Math.floor(diffInMinutes / 60)
      timeAgo = `Há ${hours} h`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      timeAgo = `Há ${days} d`
    }
    
    return {
      ...activity,
      icon: getIconForCategory(activity.category),
      user: activity.profiles?.full_name || 'Usuário',
      time: timeAgo,
      date: format(createdAt, 'dd/MM/yyyy', { locale: ptBR })
    }
  })

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
              <div className="filter-dropdown absolute top-full mt-2 bg-[var(--color-bg-modal)] border border-gray-200 rounded-lg shadow-lg p-2 z-50 min-w-[180px]">
                {allCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => toggleFilter(category.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50 rounded"
                  >
                    <span className="text-sm">{category.name}</span>
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
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-[var(--color-lavender-blush)] text-[var(--color-clay-500)] border-[var(--color-clay-500)]">
                <span className="text-xs font-medium">
                  {dateRange.from && dateRange.to 
                    ? `${format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}`
                    : format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })}
                </span>
                <button
                  onClick={() => setDateRange(undefined)}
                  className="hover:opacity-70"
                  title="Remover filtro"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {activeFilters.map(filter => {
              const category = allCategories.find(c => c.id === filter)
              
              return (
                <div
                  key={filter}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-[var(--color-lavender-blush)] text-[var(--color-clay-500)] border-[var(--color-clay-500)]"
                >
                  <span className="text-xs font-medium">{category?.name || filter}</span>
                  <button
                    onClick={() => toggleFilter(filter)}
                    className="hover:opacity-70"
                    title="Remover filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Lista de Atividades */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-[calc(100vh-280px)] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="large" className="text-[var(--color-clay-500)] !w-[40px] !h-[40px]" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{searchTerm || activeFilters.length > 0 ? 'Nenhuma atividade encontrada' : 'Nenhuma atividade registrada'}</p>
          </div>
        ) : (
          <table className="w-full -mx-6 px-6" style={{ width: 'calc(100% + 48px)' }}>
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm bg-white relative before:content-[''] before:absolute before:inset-0 before:-top-6 before:bg-white before:-z-10">Categoria</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm bg-white relative before:content-[''] before:absolute before:inset-0 before:-top-6 before:bg-white before:-z-10">Ação</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm bg-white relative before:content-[''] before:absolute before:inset-0 before:-top-6 before:bg-white before:-z-10">Atividade</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm bg-white relative before:content-[''] before:absolute before:inset-0 before:-top-6 before:bg-white before:-z-10">Usuário</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm bg-white relative before:content-[''] before:absolute before:inset-0 before:-top-6 before:bg-white before:-z-10">Data e Hora</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((activity) => {
                const Icon = activity.icon
                // Extrair badge do HTML da descrição
                const descriptionMatch = activity.description.match(/<span class="badge-(danger|secondary|success)">(.+?)<\/span>\s*(.*)/)
                const badgeType = descriptionMatch ? descriptionMatch[1] : null
                const badgeText = descriptionMatch ? descriptionMatch[2] : null
                const descriptionText = descriptionMatch ? descriptionMatch[3] : activity.description
                
                return (
                  <tr key={activity.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                    {/* Ícone + Categoria */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 flex-shrink-0 text-gray-500" />
                        <span className="font-medium text-sm text-gray-600">{getCategoryLabel(activity.category)}</span>
                      </div>
                    </td>

                    {/* Badge Ação */}
                    <td className="py-3 px-4">
                      {badgeType && badgeText && (
                        <span className={`badge-${badgeType}`}>{badgeText}</span>
                      )}
                    </td>

                    {/* Descrição (sem badge) */}
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {descriptionText}
                    </td>

                    {/* Usuário */}
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {activity.user}
                    </td>

                    {/* Data e Hora */}
                    <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                      {activity.time} - {activity.date}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
