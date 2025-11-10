'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Clock, 
  User, 
  Package, 
  Search, 
  Filter,
  Calendar,
  Grid3x3,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

type Order = {
  id: string
  customer: string
  product: string
  deliveryDate: Date
  status: 'pending' | 'in-progress' | 'completed'
  notes?: string
  phone?: string
  value?: number
  color?: 'green' | 'blue' | 'red' | 'yellow'
  tags?: string[]
  category?: string
}

export default function OrdersPage() {
  const [view, setView] = useState<'month' | 'week' | 'day' | 'list'>('list')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 10))
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showColorFilter, setShowColorFilter] = useState(false)
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)

  const demoOrders: Order[] = [
    {
      id: '1',
      customer: 'Code Review',
      product: 'Bolo de Chocolate 2kg',
      deliveryDate: new Date(2025, 9, 21, 10, 0),
      status: 'pending',
      notes: 'Review pull requests for the authentication feature',
      phone: '(11) 98765-4321',
      value: 150.00,
      color: 'green',
      tags: ['Urgent'],
      category: 'Work'
    },
    {
      id: '2',
      customer: 'Deploy to Production',
      product: 'Torta de Limão',
      deliveryDate: new Date(2025, 9, 25, 16, 0),
      status: 'in-progress',
      notes: 'Deploy version 2.5.0 with new features and bug fixes',
      phone: '(11) 97654-3210',
      value: 85.00,
      color: 'green',
      tags: ['Urgent'],
      category: 'Work'
    },
  ]

  const [orders] = useState<Order[]>(demoOrders)

  const colors = [
    { id: 'green', label: 'Green', count: 2 },
    { id: 'blue', label: 'Blue', count: 0 },
    { id: 'red', label: 'Red', count: 0 },
    { id: 'yellow', label: 'Yellow', count: 0 },
  ]

  const allTags = ['Urgent', 'Important', 'Optional']
  const allCategories = ['Work', 'Personal', 'Family']

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedOrder(null)
  }

  const getViewTitle = () => {
    if (view === 'list') return 'Pedidos'
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
    if (view === 'week') {
      const weekEnd = new Date(currentDate)
      weekEnd.setDate(weekEnd.getDate() + 6)
      return `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else if (view === 'week') {
      const prevWeek = new Date(currentDate)
      prevWeek.setDate(prevWeek.getDate() - 7)
      setCurrentDate(prevWeek)
    } else if (view === 'day') {
      const prevDay = new Date(currentDate)
      prevDay.setDate(prevDay.getDate() - 1)
      setCurrentDate(prevDay)
    }
  }

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else if (view === 'week') {
      const nextWeek = new Date(currentDate)
      nextWeek.setDate(nextWeek.getDate() + 7)
      setCurrentDate(nextWeek)
    } else if (view === 'day') {
      const nextDay = new Date(currentDate)
      nextDay.setDate(nextDay.getDate() + 1)
      setCurrentDate(nextDay)
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date(2025, 10, 10))
  }

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const clearFilters = () => {
    setActiveFilters([])
  }

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'green': return 'bg-green-500'
      case 'blue': return 'bg-blue-500'
      case 'red': return 'bg-red-500'
      case 'yellow': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500'
      case 'in-progress':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
    }
  }

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'in-progress':
        return 'Em Produção'
      case 'completed':
        return 'Concluído'
    }
  }

  const getFilteredOrders = () => {
    let filtered = orders

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (activeFilters.length > 0) {
      filtered = filtered.filter(order => {
        return activeFilters.some(filter => 
          order.color === filter.toLowerCase() ||
          order.tags?.includes(filter) ||
          order.category === filter
        )
      })
    }

    return filtered.sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime())
  }

  const filteredOrders = getFilteredOrders()

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">{getViewTitle()}</h1>
            
            {view !== 'list' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="h-8"
                >
                  Hoje
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={view === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="h-9"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Mês
            </Button>
            <Button
              variant={view === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className="h-9"
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Semana
            </Button>
            <Button
              variant={view === 'day' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
              className="h-9"
            >
              <Clock className="h-4 w-4 mr-2" />
              Dia
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="h-9"
            >
              <ListIcon className="h-4 w-4 mr-2" />
              Lista
            </Button>
            <Button className="h-9 bg-pink-600 hover:bg-pink-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar pedidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowColorFilter(!showColorFilter)
                setShowTagFilter(false)
                setShowCategoryFilter(false)
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Cores
              {colors.filter(c => activeFilters.includes(c.id)).length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {colors.filter(c => activeFilters.includes(c.id)).length}
                </Badge>
              )}
            </Button>
            
            {showColorFilter && (
              <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
                {colors.map(color => (
                  <button
                    key={color.id}
                    onClick={() => toggleFilter(color.id)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 text-left"
                  >
                    <div className={`w-3 h-3 rounded-full ${getColorClass(color.id)}`} />
                    <span className="flex-1 text-sm text-gray-700">{color.label}</span>
                    {activeFilters.includes(color.id) && (
                      <span className="text-xs text-gray-500">✓</span>
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
              onClick={() => {
                setShowTagFilter(!showTagFilter)
                setShowColorFilter(false)
                setShowCategoryFilter(false)
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Tags
            </Button>
            
            {showTagFilter && (
              <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleFilter(tag)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 text-left"
                  >
                    <span className="flex-1 text-sm text-gray-700">{tag}</span>
                    {activeFilters.includes(tag) && (
                      <span className="text-xs text-gray-500">✓</span>
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
              onClick={() => {
                setShowCategoryFilter(!showCategoryFilter)
                setShowColorFilter(false)
                setShowTagFilter(false)
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Categorias
            </Button>
            
            {showCategoryFilter && (
              <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
                {allCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleFilter(category)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 text-left"
                  >
                    <span className="flex-1 text-sm text-gray-700">{category}</span>
                    {activeFilters.includes(category) && (
                      <span className="text-xs text-gray-500">✓</span>
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
              onClick={clearFilters}
            >
              Limpar
            </Button>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-gray-600">Filtros ativos:</span>
            {activeFilters.map(filter => {
              const color = colors.find(c => c.id === filter)
              return (
                <Badge
                  key={filter}
                  variant="secondary"
                  className="bg-gray-100"
                >
                  {color && (
                    <div className={`w-2 h-2 rounded-full ${getColorClass(filter)} mr-2`} />
                  )}
                  {color?.label || filter}
                  <button
                    onClick={() => toggleFilter(filter)}
                    className="ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
        )}
      </div>

      {view === 'list' && (
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchQuery || activeFilters.length > 0 ? 'Nenhum pedido encontrado' : 'Nenhum pedido'}</p>
            </div>
          ) : (
            <>
              {Array.from(new Set(filteredOrders.map(o => o.deliveryDate.toDateString()))).map(dateString => {
                const ordersForDate = filteredOrders.filter(o => o.deliveryDate.toDateString() === dateString)
                const date = new Date(dateString)
                
                return (
                  <div key={dateString}>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                    
                    <div className="space-y-3">
                      {ordersForDate.map(order => (
                        <div
                          key={order.id}
                          onClick={() => handleOrderClick(order)}
                          className="group cursor-pointer rounded-lg bg-white border border-gray-200 p-4 transition-all hover:shadow-md hover:scale-[1.01] hover:border-pink-300"
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-1 h-16 rounded-full ${getColorClass(order.color)}`} />
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 mb-1">{order.customer}</h4>
                              <p className="text-sm text-gray-600 mb-2">{order.notes || order.product}</p>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {order.deliveryDate.toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                
                                {order.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {order.category}
                                  </Badge>
                                )}
                                
                                {order.tags?.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <Badge variant="outline">
                              Pedido
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {view === 'month' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7">
            {(() => {
              const year = currentDate.getFullYear()
              const month = currentDate.getMonth()
              const firstDay = new Date(year, month, 1)
              const lastDay = new Date(year, month + 1, 0)
              const startDate = new Date(firstDay)
              startDate.setDate(startDate.getDate() - firstDay.getDay())
              
              const days = []
              const current = new Date(startDate)
              
              for (let i = 0; i < 42; i++) {
                const dayDate = new Date(current)
                const isCurrentMonth = dayDate.getMonth() === month
                const dayOrders = filteredOrders.filter(order => 
                  order.deliveryDate.toDateString() === dayDate.toDateString()
                )
                
                days.push(
                  <div
                    key={i}
                    className={`min-h-[120px] p-2 border-r border-b border-gray-200 ${
                      !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {dayDate.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayOrders.map(order => (
                        <div
                          key={order.id}
                          onClick={() => handleOrderClick(order)}
                          className={`text-xs p-1.5 rounded cursor-pointer truncate ${getColorClass(order.color)} bg-opacity-20 hover:bg-opacity-30`}
                        >
                          <div className="font-medium">{order.customer}</div>
                          <div className="text-gray-600">
                            {order.deliveryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
                
                current.setDate(current.getDate() + 1)
              }
              
              return days
            })()}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-8">
            <div className="p-3 text-sm font-medium text-gray-700 border-r border-b border-gray-200">
              Horário
            </div>
            {(() => {
              const days = []
              const startOfWeek = new Date(currentDate)
              startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
              
              for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek)
                day.setDate(startOfWeek.getDate() + i)
                days.push(
                  <div key={i} className="p-3 text-center border-r border-b border-gray-200 last:border-r-0">
                    <div className="text-sm font-medium text-gray-900">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i]}
                    </div>
                    <div className="text-xs text-gray-500">
                      {day.getDate()}/{day.getMonth() + 1}
                    </div>
                  </div>
                )
              }
              return days
            })()}
          </div>
          
          <div className="grid grid-cols-8 max-h-[600px] overflow-y-auto">
            {Array.from({ length: 24 }).map((_, hour) => {
              const startOfWeek = new Date(currentDate)
              startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
              
              return (
                <div key={hour} className="contents">
                  <div className="p-2 text-xs text-gray-500 border-r border-b border-gray-200 text-center">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const day = new Date(startOfWeek)
                    day.setDate(startOfWeek.getDate() + dayIndex)
                    
                    const hourOrders = filteredOrders.filter(order => {
                      const orderDate = order.deliveryDate
                      return orderDate.toDateString() === day.toDateString() &&
                             orderDate.getHours() === hour
                    })
                    
                    return (
                      <div
                        key={dayIndex}
                        className="min-h-[60px] p-1 border-r border-b border-gray-200 last:border-r-0"
                      >
                        {hourOrders.map(order => (
                          <div
                            key={order.id}
                            onClick={() => handleOrderClick(order)}
                            className={`text-xs p-1.5 rounded cursor-pointer mb-1 ${getColorClass(order.color)} bg-opacity-20 hover:bg-opacity-30`}
                          >
                            <div className="font-medium truncate">{order.customer}</div>
                            <div className="text-gray-600">
                              {order.deliveryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto">
            {Array.from({ length: 24 }).map((_, hour) => {
              const hourOrders = filteredOrders.filter(order => {
                const orderDate = order.deliveryDate
                return orderDate.toDateString() === currentDate.toDateString() &&
                       orderDate.getHours() === hour
              })
              
              return (
                <div key={hour} className="flex border-b border-gray-200">
                  <div className="w-24 p-3 text-sm text-gray-500 border-r border-gray-200 flex-shrink-0">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  
                  <div className="flex-1 p-3 min-h-[80px]">
                    {hourOrders.length === 0 ? (
                      <div className="h-full" />
                    ) : (
                      <div className="space-y-2">
                        {hourOrders.map(order => (
                          <div
                            key={order.id}
                            onClick={() => handleOrderClick(order)}
                            className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${getColorClass(order.color)} bg-opacity-20 border-l-4 hover:bg-opacity-30`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{order.customer}</h4>
                                <p className="text-sm text-gray-600 mb-2">{order.product}</p>
                                
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {order.deliveryDate.toLocaleTimeString('pt-BR', { 
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  
                                  {order.value && (
                                    <span className="font-medium text-green-700">
                                      R$ {order.value.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-1">
                                {order.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {order.category}
                                  </Badge>
                                )}
                                
                                {order.tags?.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              Visualize e edite as informações do pedido
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente</Label>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{selectedOrder.customer}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">Produto</Label>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span>{selectedOrder.product}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Entrega</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {selectedOrder.deliveryDate.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Horário</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {selectedOrder.deliveryDate.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                  <div className={`h-3 w-3 rounded-full ${getStatusColor(selectedOrder.status)}`} />
                  <span className="font-medium">{getStatusLabel(selectedOrder.status)}</span>
                </div>
              </div>

              {selectedOrder.phone && (
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <span>{selectedOrder.phone}</span>
                  </div>
                </div>
              )}

              {selectedOrder.value && (
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                    <span className="text-lg font-bold text-green-700">
                      R$ {selectedOrder.value.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleCloseDialog}
              className="flex-1"
            >
              Excluir
            </Button>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCloseDialog}
              className="flex-1 bg-pink-600 hover:bg-pink-700"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
