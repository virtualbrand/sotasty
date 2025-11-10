'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Modal from '@/components/Modal'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'

// Brazilian number formatting helper
const formatBRL = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

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

type Customer = {
  id: string
  name: string
  email: string
  phone: string
}

type Product = {
  id: string
  name: string
  description: string
  price?: number
  selling_price?: number
  category: string
  available?: boolean
}

export default function OrdersPage() {
  const [view, setView] = useState<'month' | 'week' | 'day' | 'list'>('list')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 10))
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showColorFilter, setShowColorFilter] = useState(false)
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [newProductData, setNewProductData] = useState({
    name: '',
    description: '',
    category: 'cake' as 'cake' | 'cupcake' | 'cookie' | 'pie' | 'other',
    selling_price: '',
  })
  const [formData, setFormData] = useState({
    customer: '',
    customerId: '',
    product: '',
    productId: '',
    deliveryDate: '',
    deliveryTime: '',
    status: 'pending' as Order['status'],
    phone: '',
    value: '',
    notes: ''
  })

  // Carregar clientes e produtos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, productsRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/products')
        ])
        
        if (customersRes.ok) {
          const customersData = await customersRes.json()
          setCustomers(customersData)
        }
        
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoadingCustomers(false)
        setLoadingProducts(false)
      }
    }
    
    fetchData()
  }, [])

  // Fechar filtros ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.filter-dropdown') && !target.closest('.filter-button')) {
        setShowColorFilter(false)
        setShowTagFilter(false)
        setShowCategoryFilter(false)
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowColorFilter(false)
        setShowTagFilter(false)
        setShowCategoryFilter(false)
      }
    }

    if (showColorFilter || showTagFilter || showCategoryFilter) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showColorFilter, showTagFilter, showCategoryFilter])

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
    setIsEditing(true)
    setFormData({
      customer: order.customer,
      customerId: '',
      product: order.product,
      productId: '',
      deliveryDate: order.deliveryDate.toISOString().split('T')[0],
      deliveryTime: order.deliveryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: order.status,
      phone: order.phone || '',
      value: order.value?.toString() || '',
      notes: order.notes || ''
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
    setIsEditing(false)
    setFormData({
      customer: '',
      customerId: '',
      product: '',
      productId: '',
      deliveryDate: '',
      deliveryTime: '',
      status: 'pending',
      phone: '',
      value: '',
      notes: ''
    })
  }

  const handleNewOrder = () => {
    setIsEditing(false)
    setSelectedOrder(null)
    setFormData({
      customer: '',
      customerId: '',
      product: '',
      productId: '',
      deliveryDate: '',
      deliveryTime: '',
      status: 'pending',
      phone: '',
      value: '',
      notes: ''
    })
    setIsModalOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui você implementaria a lógica de salvar no banco de dados
    console.log('Salvar pedido:', formData)
    handleCloseModal()
  }

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
      // Aqui você implementaria a lógica de deletar do banco de dados
      console.log('Deletar pedido:', selectedOrder?.id)
      handleCloseModal()
    }
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerData),
      })

      if (response.ok) {
        const newCustomer = await response.json()
        setCustomers(prev => [...prev, newCustomer])
        setFormData(prev => ({
          ...prev,
          customerId: newCustomer.id,
          customer: newCustomer.name,
          phone: newCustomer.phone,
        }))
        setIsCustomerModalOpen(false)
        setNewCustomerData({ name: '', email: '', phone: '' })
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      alert('Erro ao criar cliente. Tente novamente.')
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProductData,
          selling_price: parseFloat(newProductData.selling_price),
        }),
      })

      if (response.ok) {
        const newProduct = await response.json()
        setProducts(prev => [...prev, newProduct])
        setFormData(prev => ({
          ...prev,
          productId: newProduct.id,
          product: newProduct.name,
          value: newProduct.selling_price?.toString() || '',
        }))
        setIsProductModalOpen(false)
        setNewProductData({ name: '', description: '', category: 'cake', selling_price: '' })
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      alert('Erro ao criar produto. Tente novamente.')
    }
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
            <button 
              onClick={handleNewOrder}
              className="bg-[var(--color-old-rose)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--color-rosy-brown)] transition font-semibold flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Pedido
            </button>
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
              className="filter-button"
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
              <div className="filter-dropdown absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
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
              className="filter-button"
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
              <div className="filter-dropdown absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
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
              className="filter-button"
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
              <div className="filter-dropdown absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
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
                                      R$ {formatBRL(order.value)}
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

      {/* Modal Pedido */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={isEditing ? 'Editar Pedido' : 'Novo Pedido'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <Combobox
                options={customers.map(c => ({
                  value: c.id,
                  label: c.name,
                  subtitle: c.phone
                }))}
                value={formData.customerId}
                onValueChange={(value) => {
                  const selectedCustomer = customers.find(c => c.id === value)
                  setFormData(prev => ({
                    ...prev,
                    customerId: value,
                    customer: selectedCustomer?.name || '',
                    phone: selectedCustomer?.phone || prev.phone
                  }))
                }}
                placeholder="Selecione ou busque um cliente"
                searchPlaceholder="Digite o nome do cliente..."
                emptyMessage="Cliente não encontrado"
                onCreateNew={(searchTerm) => {
                  setNewCustomerData(prev => ({ ...prev, name: searchTerm }))
                  setIsCustomerModalOpen(true)
                }}
                createNewLabel="Adicionar"
                loading={loadingCustomers}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produto *
              </label>
              <Combobox
                options={products.map(p => ({
                  value: p.id,
                  label: p.name,
                  subtitle: p.selling_price ? `R$ ${p.selling_price.toFixed(2)}` : undefined
                }))}
                value={formData.productId}
                onValueChange={(value) => {
                  const selectedProduct = products.find(p => p.id === value)
                  setFormData(prev => ({
                    ...prev,
                    productId: value,
                    product: selectedProduct?.name || '',
                    value: selectedProduct?.selling_price?.toString() || prev.value
                  }))
                }}
                placeholder="Selecione ou busque um produto"
                searchPlaceholder="Digite o nome do produto..."
                emptyMessage="Produto não encontrado"
                onCreateNew={(searchTerm) => {
                  setNewProductData(prev => ({ ...prev, name: searchTerm }))
                  setIsProductModalOpen(true)
                }}
                createNewLabel="Adicionar"
                loading={loadingProducts}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Entrega *
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário *
                </label>
                <input
                  type="time"
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900"
              >
                <option value="pending">Pendente</option>
                <option value="in-progress">Em Andamento</option>
                <option value="completed">Concluído</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor
              </label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900 placeholder:text-gray-500 resize-none"
                placeholder="Observações sobre o pedido"
              />
            </div>

            <div className="flex gap-3 pt-4">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn-danger flex-1"
                >
                  Excluir
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseModal}
                className="btn-outline-grey flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-success flex-1"
              >
                {isEditing ? 'Atualizar' : 'Salvar Pedido'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Novo Cliente */}
      {isCustomerModalOpen && (
        <Modal
          isOpen={isCustomerModalOpen}
          onClose={() => {
            setIsCustomerModalOpen(false)
            setNewCustomerData({ name: '', email: '', phone: '' })
          }}
          title="Novo Cliente"
        >
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={newCustomerData.name}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone *
              </label>
              <input
                type="tel"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsCustomerModalOpen(false)
                  setNewCustomerData({ name: '', email: '', phone: '' })
                }}
                className="btn-outline-grey flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-success flex-1"
              >
                Adicionar Cliente
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Novo Produto */}
      {isProductModalOpen && (
        <Modal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false)
            setNewProductData({ name: '', description: '', category: 'cake', selling_price: '' })
          }}
          title="Novo Produto"
        >
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={newProductData.name}
                onChange={(e) => setNewProductData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="Nome do produto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria *
              </label>
              <select
                value={newProductData.category}
                onChange={(e) => setNewProductData(prev => ({ 
                  ...prev, 
                  category: e.target.value as 'cake' | 'cupcake' | 'cookie' | 'pie' | 'other'
                }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900"
              >
                <option value="cake">Bolo</option>
                <option value="cupcake">Cupcake</option>
                <option value="cookie">Cookie</option>
                <option value="pie">Torta</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço de Venda
              </label>
              <input
                type="number"
                value={newProductData.selling_price}
                onChange={(e) => setNewProductData(prev => ({ ...prev, selling_price: e.target.value }))}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={newProductData.description}
                onChange={(e) => setNewProductData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900 placeholder:text-gray-500 resize-none"
                placeholder="Descrição do produto"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsProductModalOpen(false)
                  setNewProductData({ name: '', description: '', category: 'cake', selling_price: '' })
                }}
                className="btn-outline-grey flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-success flex-1"
              >
                Adicionar Produto
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
