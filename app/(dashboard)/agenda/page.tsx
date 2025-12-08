'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Modal from '@/components/Modal'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { showToast } from '@/app/(dashboard)/layout'
import PageLoading from '@/components/PageLoading'
import { 
  Plus, 
  Clock, 
  Package, 
  Search, 
  Filter,
  Calendar,
  Grid3x3,
  List as ListIcon,
  Columns3,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
  Trash2,
  CircleAlert,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Brazilian number formatting helper
const formatBRL = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// Phone formatting helper
const formatPhone = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "")
  
  // Se não tem números, retorna vazio
  if (!numbers) return ""
  
  // Se tem apenas 1 dígito, retorna sem formatação
  if (numbers.length === 1) return `(${numbers}`
  
  // Se tem 2 dígitos, adiciona apenas o parêntese inicial
  if (numbers.length === 2) return `(${numbers}`
  
  // A partir de 3 dígitos, adiciona o parêntese e espaço
  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  }
  
  // Entre 7 e 10 dígitos: (99) 9999-9999
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
  }
  
  // Mais de 10 dígitos: (99) 99999-9999
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

// Currency formatting helper - formato brasileiro completo
const formatCurrency = (value: string): string => {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '')
  
  if (!numbers) return ''
  
  // Converte para número considerando os últimos 2 dígitos como centavos
  const numValue = parseInt(numbers) / 100
  
  // Formata no padrão brasileiro
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

type Order = {
  id: string
  customer: string
  customer_id?: string
  product: string
  product_id?: string
  deliveryDate: Date
  status: string
  title?: string
  notes?: string
  phone?: string
  value?: number
  color?: 'green' | 'blue' | 'red' | 'yellow'
  tags?: string[]
  category?: string
  images?: string[]
  task_name?: string
  categories?: string[]
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

// Componente de célula do calendário
function CalendarCell({ date, children }: { 
  date: Date; 
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[120px] border-b border-r border-gray-200 p-2 bg-white">
      {children}
    </div>
  )
}

// Componente de pedido simplificado para o calendário
function CalendarOrder({ order, onClick }: { order: Order; onClick: () => void }) {
  const getStatusBadgeColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in-progress':
        return 'bg-blue-500'
      case 'pending':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="text-xs px-2 py-1 mb-1 rounded bg-white border border-gray-200 cursor-pointer hover:shadow-md hover:border-pink-300 transition-all flex items-center gap-1"
    >
      <div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(order.status)}`} />
      <span className="truncate flex-1">{order.task_name || order.product || order.customer}</span>
      <span className="text-gray-500 text-[10px]">
        {order.deliveryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}

// Componente de card simples
function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const getStatusBadgeColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'Concluído'
      case 'in-progress': return 'Em Andamento'
      case 'pending': return 'Pendente'
      default: return status
    }
  }

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-5 mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="w-1 h-16 rounded-full bg-pink-500" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              {order.task_name && (
                <h3 className="font-semibold text-gray-900 mb-1">{order.task_name}</h3>
              )}
              <p className="text-sm text-gray-600">{order.customer}</p>
              {order.product !== 'Sem produto' && (
                <p className="text-xs text-gray-500">{order.product}</p>
              )}
            </div>
            <Badge variant="outline" className={`${getStatusBadgeColor(order.status)} shrink-0`}>
              {getStatusText(order.status)}
            </Badge>
          </div>
          
          {order.categories && order.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {order.categories.map(cat => (
                <Badge key={cat} variant="secondary" className="text-xs px-2 py-0.5">
                  {cat}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{order.deliveryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {order.value && (
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>R$ {order.value.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            {order.images && order.images.length > 0 && (
              <div className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                <span>{order.images.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de card para visualização Kanban
function KanbanOrderCard({ order, onClick, dateFormat }: { order: Order; onClick: () => void; dateFormat: 'short' | 'numeric' | 'long' }) {
  // Função para formatar data
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const shortYear = String(year).slice(-2)
    
    if (dateFormat === 'short') {
      return `${day}/${month}/${shortYear}`
    } else if (dateFormat === 'numeric') {
      return `${day}/${month}/${year}`
    } else {
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
      return `${day} ${monthName}`
    }
  }

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3 cursor-pointer hover:shadow-lg hover:border-pink-300 transition-all duration-200"
    >
      {order.task_name && (
        <h4 className="font-semibold text-gray-900 mb-2">{order.task_name}</h4>
      )}
      <p className="text-sm text-gray-700 mb-1">{order.customer}</p>
      {order.product !== 'Sem produto' && (
        <p className="text-xs text-gray-500 mb-3">{order.product}</p>
      )}
      
      {order.categories && order.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {order.categories.map(cat => (
            <Badge key={cat} variant="secondary" className="text-[10px] px-1.5 py-0.5">
              {cat}
            </Badge>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>
            {formatDate(order.deliveryDate)}
            {' '}
            {order.deliveryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {order.images && order.images.length > 0 && (
            <div className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              <span>{order.images.length}</span>
            </div>
          )}
          {order.value && (
            <span className="font-medium text-green-700">
              R$ {order.value.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>
      </div>
      
      {(order.tags && order.tags.length > 0) && (
        <div className="flex flex-wrap gap-1 mt-3">
          {order.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0.5">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente de coluna simples para Kanban
function KanbanColumn({
  title,
  color,
  badgeColor,
  count,
  children,
}: {
  title: string
  color: string
  badgeColor: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          {title}
        </h3>
        <Badge variant="secondary" className={badgeColor}>
          {count}
        </Badge>
      </div>
      <div className="space-y-0 min-h-[200px]">
        {children}
      </div>
    </div>
  )
}

export default function AgendaPage() {
  // Função para obter a data atual no fuso de São Paulo
  const getTodayInSaoPaulo = () => {
    const now = new Date()
    // Converte para o horário de São Paulo (UTC-3)
    const saoPauloTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    return saoPauloTime
  }

  const [view, setView] = useState<'month' | 'week' | 'day' | 'kanban' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agendaDefaultView')
      return (saved as 'month' | 'week' | 'day' | 'kanban' | 'list') || 'list'
    }
    return 'list'
  })
  const [dateFormat, setDateFormat] = useState<'short' | 'numeric' | 'long'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agendaDateFormat')
      return (saved as 'short' | 'numeric' | 'long') || 'numeric'
    }
    return 'numeric'
  })
  const [showOrdersInAgenda, setShowOrdersInAgenda] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showOrdersInAgenda')
      return saved === 'true'
    }
    return true
  })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentDate, setCurrentDate] = useState(getTodayInSaoPaulo())
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const [showStatusFilter, setShowStatusFilter] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
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
    deliveryDateTime: undefined as Date | undefined,
    status: 'pending' as Order['status'],
    title: '',
    phone: '',
    value: '',
    notes: '',
    task_name: '',
    images: [] as string[],
    selectedCategories: [] as string[],
    selectedTags: [] as string[]
  })

  // Carregar a view padrão do localStorage após montar
  useEffect(() => {
    const savedView = localStorage.getItem('agendaDefaultView')
    const savedDateFormat = localStorage.getItem('agendaDateFormat')
    
    if (savedView) {
      setView(savedView as 'month' | 'week' | 'day' | 'kanban' | 'list')
    }
    if (savedDateFormat) {
      setDateFormat(savedDateFormat as 'short' | 'numeric' | 'long')
    }
  }, [])

  // Carregar clientes e produtos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [customersRes, productsRes, ordersRes, statusesRes, categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/products'),
          fetch('/api/orders'),
          fetch('/api/agenda/statuses'),
          fetch('/api/agenda/categories'),
          fetch('/api/agenda/tags')
        ])
        
        if (customersRes.ok) {
          const customersData = await customersRes.json()
          setCustomers(customersData)
        }
        
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData)
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          // Converte as datas do banco para objetos Date e mapeia os campos
          const ordersWithDates: Order[] = ordersData
            .filter((order: any) => {
              // Se showOrdersInAgenda está ativado, mostra tanto tasks quanto orders
              // Senão, mostra apenas tasks
              const savedShowOrders = localStorage.getItem('showOrdersInAgenda')
              const showOrders = savedShowOrders === 'true'
              
              return showOrders ? true : order.type === 'task'
            })
            .filter((order: any) => order.delivery_date) // Filtra pedidos sem data
            .map((order: any) => ({
              id: order.id,
              customer: order.customer,
              customer_id: order.customer_id,
              product: order.product,
              product_id: order.product_id,
              deliveryDate: new Date(order.delivery_date),
              status: order.status,
              title: order.title,
              notes: order.notes,
              phone: order.phone,
              value: order.value,
              tags: order.tags,
              category: order.category,
              images: order.images,
              task_name: order.task_name,
              categories: order.categories,
            }))
          setOrders(ordersWithDates)
        }

        if (statusesRes.ok) {
          const statusesData = await statusesRes.json()
          setAllStatuses(statusesData)
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setAllCategories(categoriesData)
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json()
          setAllTags(tagsData)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoadingCustomers(false)
        setLoadingProducts(false)
        setIsLoading(false)
      }
    }
    
    fetchData()

    // Recarregar dados quando a janela recebe foco (útil quando edita cliente/produto em outra aba)
    const handleFocus = () => {
      fetchData()
    }
    
    // Recarregar dados quando a preferência de mostrar pedidos mudar
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showOrdersInAgenda') {
        const newValue = e.newValue === 'true'
        setShowOrdersInAgenda(newValue)
        fetchData()
      }
    }
    
    // Listener para evento customizado (mesma aba)
    const handleShowOrdersChange = (e: any) => {
      setShowOrdersInAgenda(e.detail)
      fetchData()
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('showOrdersInAgendaChanged', handleShowOrdersChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('showOrdersInAgendaChanged', handleShowOrdersChange)
    }
  }, [])

  // Recarregar dados quando showOrdersInAgenda mudar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersRes = await fetch('/api/orders')
        
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          const ordersWithDates: Order[] = ordersData
            .filter((order: any) => {
              // Usa o estado atual para filtrar
              return showOrdersInAgenda ? true : order.type === 'task'
            })
            .filter((order: any) => order.delivery_date)
            .map((order: any) => ({
              id: order.id,
              customer: order.customer,
              customer_id: order.customer_id,
              product: order.product,
              product_id: order.product_id,
              deliveryDate: new Date(order.delivery_date),
              status: order.status,
              title: order.title,
              notes: order.notes,
              phone: order.phone,
              value: order.value,
              tags: order.tags,
              category: order.category,
              images: order.images,
              task_name: order.task_name,
              categories: order.categories,
            }))
          setOrders(ordersWithDates)
        }
      } catch (error) {
        console.error('Erro ao recarregar pedidos:', error)
      }
    }
    
    // Só recarrega se não for a primeira renderização
    if (orders.length > 0 || !isLoading) {
      fetchData()
    }
  }, [showOrdersInAgenda])

  // Fechar filtros ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.filter-dropdown') && !target.closest('.filter-button')) {
        setShowTagFilter(false)
        setShowCategoryFilter(false)
        setShowStatusFilter(false)
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTagFilter(false)
        setShowCategoryFilter(false)
        setShowStatusFilter(false)
      }
    }

    if (showTagFilter || showCategoryFilter || showStatusFilter) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showTagFilter, showCategoryFilter, showStatusFilter])

  const [orders, setOrders] = useState<Order[]>([])
  const [allStatuses, setAllStatuses] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string; color: string }>>([])

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setIsEditing(true)
    setEditingOrderId(order.id)
    setFormData({
      customer: order.customer,
      customerId: order.customer_id || '',
      product: order.product,
      productId: order.product_id || '',
      deliveryDateTime: order.deliveryDate,
      status: order.status,
      title: order.title || '',
      phone: order.phone || '',
      value: formatCurrency((order.value || 0).toFixed(2).replace('.', ',')),
      notes: order.notes || '',
      task_name: order.task_name || '',
      images: order.images || [],
      selectedCategories: order.categories || [],
      selectedTags: order.tags || []
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
    setIsEditing(false)
    setEditingOrderId(null)
    setFormData({
      customer: '',
      customerId: '',
      product: '',
      productId: '',
      deliveryDateTime: undefined,
      status: 'pending' as Order['status'],
      title: '',
      phone: '',
      value: '',
      notes: '',
      task_name: '',
      images: [],
      selectedCategories: [],
      selectedTags: []
    })
  }

  const handleNewOrder = () => {
    setIsEditing(false)
    setSelectedOrder(null)
    setEditingOrderId(null)
    setFormData({
      customer: '',
      customerId: '',
      product: '',
      productId: '',
      deliveryDateTime: undefined,
      status: 'pending',
      title: '',
      phone: '',
      value: '',
      notes: '',
      task_name: '',
      images: [],
      selectedCategories: [],
      selectedTags: []
    })
    setIsModalOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handler para upload de imagens
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: string[] = []
    const maxImages = 10 // Limite de imagens

    Array.from(files).slice(0, maxImages - formData.images.length).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          newImages.push(reader.result)
          if (newImages.length === Math.min(files.length, maxImages - formData.images.length)) {
            setFormData(prev => ({
              ...prev,
              images: [...prev.images, ...newImages]
            }))
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Handler para remover imagem
  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  // Handler para toggle de categoria
  const toggleCategory = (categoryName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryName)
        ? prev.selectedCategories.filter(c => c !== categoryName)
        : [...prev.selectedCategories, categoryName]
    }))
  }

  // Handler para toggle de tag
  const toggleTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagName)
        ? prev.selectedTags.filter(t => t !== tagName)
        : [...prev.selectedTags, tagName]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Validações básicas
      if (!formData.task_name || !formData.deliveryDateTime) {
        alert('Preencha todos os campos obrigatórios: Nome da Tarefa e Data/Hora')
        setIsSubmitting(false)
        return
      }

      // Prepare order data
      const orderData = {
        type: 'task', // Marca como tarefa da Agenda
        customer: formData.customer || 'Sem cliente',
        customer_id: formData.customerId || null,
        product: formData.product || 'Sem produto',
        product_id: formData.productId || null,
        delivery_date: formData.deliveryDateTime.toISOString(),
        status: formData.status,
        title: formData.title || null,
        phone: formData.phone || null,
        value: formData.value, // API will parse Brazilian format
        notes: formData.notes || null,
        task_name: formData.task_name,
        images: formData.images,
        categories: formData.selectedCategories,
        tags: formData.selectedTags,
      }

      const url = editingOrderId 
        ? `/api/orders?id=${editingOrderId}` 
        : '/api/orders'
      const method = editingOrderId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar pedido')
      }

      const savedOrder = await response.json()

      // Converte a data do banco para objeto Date e mapeia os campos
      const orderWithDate: Order = {
        id: savedOrder.id,
        customer: savedOrder.customer,
        customer_id: savedOrder.customer_id,
        product: savedOrder.product,
        product_id: savedOrder.product_id,
        deliveryDate: new Date(savedOrder.delivery_date),
        status: savedOrder.status,
        title: savedOrder.title,
        notes: savedOrder.notes,
        phone: savedOrder.phone,
        value: savedOrder.value,
        tags: savedOrder.tags,
        category: savedOrder.category,
        images: savedOrder.images,
        task_name: savedOrder.task_name,
        categories: savedOrder.categories,
      }

      // Update orders list
      if (editingOrderId) {
        setOrders(orders.map(o => o.id === editingOrderId ? orderWithDate : o))
        showToast({
          title: 'Tarefa atualizada!',
          message: 'A tarefa foi atualizada com sucesso.',
          variant: 'success',
          duration: 3000,
        })
      } else {
        setOrders([orderWithDate, ...orders])
        showToast({
          title: 'Tarefa criada!',
          message: 'A tarefa foi criada com sucesso.',
          variant: 'success',
          duration: 3000,
        })
      }

      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error)
      showToast({
        title: 'Erro ao salvar tarefa',
        message: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedOrder?.id) return
    
    try {
      const response = await fetch(`/api/orders?id=${selectedOrder.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao deletar tarefa')
      }

      // Remove from orders list
      setOrders(orders.filter(o => o.id !== selectedOrder.id))
      setDeleteDialogOpen(false)
      showToast({
        title: 'Tarefa excluída!',
        message: 'A tarefa foi excluída com sucesso.',
        variant: 'success',
        duration: 3000,
      })
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error)
      showToast({
        title: 'Erro ao excluir tarefa',
        message: 'Não foi possível excluir a tarefa. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
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
        showToast({
          title: 'Cliente criado!',
          message: `${newCustomer.name} foi adicionado com sucesso.`,
          variant: 'success',
          duration: 3000,
        })
      } else {
        throw new Error('Erro ao criar cliente')
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      showToast({
        title: 'Erro ao criar cliente',
        message: 'Não foi possível criar o cliente. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
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
          value: formatCurrency((newProduct.selling_price || 0).toFixed(2).replace('.', ',')),
        }))
        setIsProductModalOpen(false)
        setNewProductData({ name: '', description: '', category: 'cake', selling_price: '' })
        showToast({
          title: 'Produto criado!',
          message: `${newProduct.name} foi adicionado com sucesso.`,
          variant: 'success',
          duration: 3000,
        })
      } else {
        throw new Error('Erro ao criar produto')
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      showToast({
        title: 'Erro ao criar produto',
        message: 'Não foi possível criar o produto. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    }
  }

  // Função auxiliar para formatar datas de acordo com a preferência do usuário
  const formatDateDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const shortYear = String(year).slice(-2)
    
    if (dateFormat === 'short') {
      return `${day}/${month}/${shortYear}`
    } else if (dateFormat === 'numeric') {
      return `${day}/${month}/${year}`
    } else {
      // long format
      const monthName = date.toLocaleDateString('pt-BR', { month: 'long' })
      return `${day} de ${monthName} de ${year}`
    }
  }

  // Função auxiliar para capitalizar a primeira letra do dia da semana
  const capitalizeWeekday = (date: Date): string => {
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' })
    return weekday.charAt(0).toUpperCase() + weekday.slice(1)
  }

  const getViewTitle = () => {
    if (view === 'list') return 'Agenda'
    
    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const shortYear = String(year).slice(-2)
      
      if (dateFormat === 'short') {
        return `${day}/${month}/${shortYear}`
      } else if (dateFormat === 'numeric') {
        return `${day}/${month}/${year}`
      } else {
        // long format
        const monthName = date.toLocaleDateString('pt-BR', { month: 'long' })
        return `${day} de ${monthName} de ${year}`
      }
    }
    
    if (view === 'day') {
      return formatDate(currentDate)
    }
    
    if (view === 'week') {
      const weekEnd = new Date(currentDate)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      if (dateFormat === 'long') {
        // Para formato longo, usar formato curto na semana para não ficar muito extenso
        const startDay = String(currentDate.getDate()).padStart(2, '0')
        const startMonth = String(currentDate.getMonth() + 1).padStart(2, '0')
        const startYear = currentDate.getFullYear()
        const endDay = String(weekEnd.getDate()).padStart(2, '0')
        const endMonth = String(weekEnd.getMonth() + 1).padStart(2, '0')
        const endYear = weekEnd.getFullYear()
        return `${startDay}/${startMonth}/${startYear} - ${endDay}/${endMonth}/${endYear}`
      } else {
        return `${formatDate(currentDate)} - ${formatDate(weekEnd)}`
      }
    }
    
    // Formato para visualização mensal
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const year = currentDate.getFullYear()
    const shortYear = String(year).slice(-2)
    
    if (dateFormat === 'short') {
      return `${month}/${shortYear}`
    } else if (dateFormat === 'long') {
      const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' })
      return `${monthName} de ${year}`
    } else {
      return `${month}/${year}`
    }
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
    setCurrentDate(getTodayInSaoPaulo())
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
          order.tags?.includes(filter) ||
          order.category === filter ||
          order.status === filter
        )
      })
    }

    return filtered.sort((a, b) => {
      const dateA = a.deliveryDate?.getTime() || 0
      const dateB = b.deliveryDate?.getTime() || 0
      return dateA - dateB
    })
  }

  const filteredOrders = getFilteredOrders()

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
                Gerencie sua agenda de produção. Organize tarefas, notas e lembretes para manter tudo sob controle.
              </div>
            </div>
          </div>

          <button 
            onClick={handleNewOrder}
            className="bg-[var(--color-clay-500)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--color-clay-600)] transition font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {allStatuses.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="filter-button h-10 cursor-pointer"
                onClick={() => {
                  setShowStatusFilter(!showStatusFilter)
                  setShowTagFilter(false)
                  setShowCategoryFilter(false)
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Status
                {allStatuses.filter(s => activeFilters.includes(s.id)).length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {allStatuses.filter(s => activeFilters.includes(s.id)).length}
                  </Badge>
                )}
              </Button>
              
              {showStatusFilter && (
                <div className="filter-dropdown absolute top-full mt-2 bg-[var(--color-bg-modal)] border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                  {allStatuses.map(status => (
                    <button
                      key={status.id}
                      onClick={() => toggleFilter(status.id)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer"
                    >
                      <Badge className={`${getColorClass(status.color)} border text-xs !font-normal px-2 py-1`}>
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
          )}

          {allCategories.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="filter-button h-10 cursor-pointer"
                onClick={() => {
                  setShowCategoryFilter(!showCategoryFilter)
                  setShowTagFilter(false)
                  setShowStatusFilter(false)
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Categorias
                {allCategories.filter(c => activeFilters.includes(c.name)).length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {allCategories.filter(c => activeFilters.includes(c.name)).length}
                  </Badge>
                )}
              </Button>
              
              {showCategoryFilter && (
                <div className="filter-dropdown absolute top-full mt-2 bg-[var(--color-bg-modal)] border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                  {allCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => toggleFilter(category.name)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer"
                    >
                      <Badge className={`${getColorClass(category.color)} border text-xs !font-normal px-2 py-1`}>
                        {category.name}
                      </Badge>
                      {activeFilters.includes(category.name) && (
                        <span className="text-xs text-green-600 font-semibold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {allTags.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="filter-button h-10 cursor-pointer"
                onClick={() => {
                  setShowTagFilter(!showTagFilter)
                  setShowCategoryFilter(false)
                  setShowStatusFilter(false)
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Tags
                {allTags.filter(t => activeFilters.includes(t.name)).length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {allTags.filter(t => activeFilters.includes(t.name)).length}
                  </Badge>
                )}
              </Button>
              
              {showTagFilter && (
                <div className="filter-dropdown absolute top-full mt-2 bg-[var(--color-bg-modal)] border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                  {allTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleFilter(tag.name)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer"
                    >
                      <Badge className={`${getColorClass(tag.color)} border text-xs !font-normal px-2 py-1`}>
                        {tag.name}
                      </Badge>
                      {activeFilters.includes(tag.name) && (
                        <span className="text-xs text-green-600 font-semibold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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

        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-gray-600">Filtros ativos:</span>
            {activeFilters.map(filter => {
              const tag = allTags.find(t => t.name === filter)
              const category = allCategories.find(c => c.name === filter)
              const status = allStatuses.find(s => s.id === filter)
              const item = tag || category || status
              
              return (
                <Badge
                  key={filter}
                  variant="secondary"
                  className={`${item ? getColorClass(item.color) : 'bg-gray-100 text-gray-800 border-gray-200'} border text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  {status ? status.name : filter}
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

      {/* View Selection Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <Button 
          variant={view === 'list' ? 'secondary' : 'ghost'} 
          size="sm"
          onClick={() => setView('list')}
          className={view === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/80 hover:shadow-sm cursor-pointer transition-all'}
        >
          <ListIcon className="h-4 w-4 mr-2" />
          Lista
        </Button>
        <Button 
          variant={view === 'kanban' ? 'secondary' : 'ghost'} 
          size="sm"
          onClick={() => setView('kanban')}
          className={view === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-white/80 hover:shadow-sm cursor-pointer transition-all'}
        >
          <Columns3 className="h-4 w-4 mr-2" />
          Kanban
        </Button>
        <Button 
          variant={view === 'day' ? 'secondary' : 'ghost'} 
          size="sm"
          onClick={() => setView('day')}
          className={view === 'day' ? 'bg-white shadow-sm' : 'hover:bg-white/80 hover:shadow-sm cursor-pointer transition-all'}
        >
          <Clock className="h-4 w-4 mr-2" />
          Dia
        </Button>
        <Button 
          variant={view === 'week' ? 'secondary' : 'ghost'} 
          size="sm"
          onClick={() => setView('week')}
          className={view === 'week' ? 'bg-white shadow-sm' : 'hover:bg-white/80 hover:shadow-sm cursor-pointer transition-all'}
        >
          <Grid3x3 className="h-4 w-4 mr-2" />
          Semana
        </Button>
        <Button 
          variant={view === 'month' ? 'secondary' : 'ghost'} 
          size="sm"
          onClick={() => setView('month')}
          className={view === 'month' ? 'bg-white shadow-sm' : 'hover:bg-white/80 hover:shadow-sm cursor-pointer transition-all'}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Mês
        </Button>

        {view !== 'list' && view !== 'kanban' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="h-8 w-8 p-0 ml-4"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-gray-700 text-center">
              {getViewTitle()}
            </span>
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
          </>
        )}
      </div>

      {view === 'list' && (
        <div className="space-y-6">
          {isLoading ? (
            <PageLoading />
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchQuery || activeFilters.length > 0 ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa'}</p>
            </div>
          ) : (
            <>
              {Array.from(new Set(filteredOrders
                .filter(o => o.deliveryDate) // Filtra pedidos sem data
                .map(o => o.deliveryDate.toDateString())
              )).map(dateString => {
                const ordersForDate = filteredOrders.filter(o => 
                  o.deliveryDate && o.deliveryDate.toDateString() === dateString
                )
                const date = new Date(dateString)
                
                return (
                  <div key={dateString}>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      {capitalizeWeekday(date)}, {formatDateDisplay(date)}
                    </h3>
                    
                    <div className="space-y-0">
                      {ordersForDate.map(order => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onClick={() => handleOrderClick(order)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {view === 'kanban' && (
        <>
          {isLoading ? (
            <PageLoading />
          ) : (
            <div className={`grid gap-6`} style={{ gridTemplateColumns: `repeat(${allStatuses.length}, minmax(0, 1fr))` }}>
              {allStatuses.map(status => {
                const statusOrders = filteredOrders.filter(o => o.status === status.id)
                const colorClass = getColorClass(status.color)
                
                return (
                  <KanbanColumn
                    key={status.id}
                    title={status.name}
                    color={colorClass}
                    badgeColor={colorClass}
                    count={statusOrders.length}
                  >
                    {statusOrders
                      .sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime())
                      .map(order => (
                        <KanbanOrderCard
                          key={order.id}
                          order={order}
                          onClick={() => handleOrderClick(order)}
                          dateFormat={dateFormat}
                        />
                      ))}
                    {statusOrders.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhuma tarefa</p>
                      </div>
                    )}
                  </KanbanColumn>
                )
              })}
            </div>
          )}
        </>
      )}

      {view === 'month' && (
        <>
          {isLoading ? (
            <PageLoading />
          ) : (
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
                      <CalendarCell
                        key={i}
                        date={dayDate}
                      >
                        <div className={`text-sm font-medium mb-2 ${
                          !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                        }`}>
                          {dayDate.getDate()}
                        </div>
                        
                        <div className="space-y-1">
                          {dayOrders.map(order => (
                            <CalendarOrder
                              key={order.id}
                              order={order}
                              onClick={() => handleOrderClick(order)}
                            />
                          ))}
                        </div>
                      </CalendarCell>
                    )
                    
                    current.setDate(current.getDate() + 1)
                  }
                  
                  return days
                })()}
              </div>
            </div>
          )}
        </>
      )}

      {view === 'week' && (
        <>
          {isLoading ? (
            <PageLoading />
          ) : (
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
                          {formatDateDisplay(day)}
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
                        day.setHours(hour, 0, 0, 0)
                        
                        const hourOrders = filteredOrders.filter(order => {
                          const orderDate = order.deliveryDate
                          return orderDate.toDateString() === day.toDateString() &&
                                 orderDate.getHours() === hour
                        })
                        
                        return (
                          <CalendarCell
                            key={dayIndex}
                            date={day}
                          >
                            {hourOrders.map(order => (
                              <CalendarOrder
                                key={order.id}
                                order={order}
                                onClick={() => handleOrderClick(order)}
                              />
                            ))}
                          </CalendarCell>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {view === 'day' && (
        <>
          {isLoading ? (
            <PageLoading />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {capitalizeWeekday(currentDate)}, {formatDateDisplay(currentDate)}
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
                            className="p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02] bg-pink-50 border-l-4 border-pink-500 hover:bg-pink-100"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {order.task_name || order.product || 'Tarefa'}
                                </h4>
                                {order.customer && (
                                  <p className="text-sm text-gray-600 mb-2">{order.customer}</p>
                                )}
                                
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
                                {order.categories?.map(cat => (
                                  <Badge key={cat} variant="outline" className="text-xs">
                                    {cat}
                                  </Badge>
                                ))}
                                
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
        </>
      )}

      {/* Modal Tarefa */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome da Tarefa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Tarefa *
              </label>
              <input
                type="text"
                name="task_name"
                value={formData.task_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-sm text-gray-500 bg-white"
                placeholder="Ex: Post Instagram, Reunião Cliente, Ideia Produto"
              />
            </div>

            {/* Data e Hora */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data e Hora *
              </label>
              <DateTimePicker
                value={formData.deliveryDateTime}
                onChange={(date) => setFormData(prev => ({ ...prev, deliveryDateTime: date }))}
                placeholder="Selecione a data e hora"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-500 bg-white"
              >
                {allStatuses.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Categorias */}
            {allCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorias
                </label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map(category => (
                    <Badge
                      key={category.id}
                      onClick={() => toggleCategory(category.name)}
                      className={`cursor-pointer transition-all ${
                        formData.selectedCategories.includes(category.name)
                          ? `${getColorClass(category.color)} border-2`
                          : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {category.name}
                      {formData.selectedCategories.includes(category.name) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {allTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag.id}
                      onClick={() => toggleTag(tag.name)}
                      className={`cursor-pointer transition-all ${
                        formData.selectedTags.includes(tag.name)
                          ? `${getColorClass(tag.color)} border-2`
                          : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {tag.name}
                      {formData.selectedTags.includes(tag.name) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Upload de Imagens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens
              </label>
              
              {/* Preview das imagens com carrossel */}
              {formData.images.length > 0 && (
                <div className="mb-3">
                  <Carousel className="w-full max-w-full mb-2">
                    <CarouselContent>
                      {formData.images.map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <Image 
                              src={image} 
                              alt={`Upload ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors z-10"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {formData.images.length > 1 && (
                      <>
                        <CarouselPrevious />
                        <CarouselNext />
                      </>
                    )}
                  </Carousel>
                  <p className="text-xs text-gray-500 text-center">
                    {formData.images.length} imagem(ns) adicionada(s)
                  </p>
                </div>
              )}

              {/* Botão de upload */}
              {formData.images.length < 10 && (
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[var(--color-clay-500)] hover:bg-pink-50 transition-colors">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Upload className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      Adicionar imagens ({formData.images.length}/10)
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500 resize-none bg-white"
                placeholder="Anotações, detalhes ou lembretes sobre esta tarefa"
              />
            </div>

            <div className="flex gap-3 pt-4">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="btn-outline-danger flex-1 flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              )}
              <button
                type="submit"
                className="btn-success flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar Tarefa')}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
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
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-500 bg-white"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500 resize-none"
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

      {/* Alert Dialog para Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
              aria-hidden="true"
            >
              <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. A tarefa será permanentemente excluída do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-outline-grey">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="btn-danger flex items-center gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
