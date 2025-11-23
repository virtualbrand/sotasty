'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Modal from '@/components/Modal'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { showToast } from '@/app/(dashboard)/layout'
import PageLoading from '@/components/PageLoading'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  Plus, 
  Clock, 
  Package, 
  Search, 
  Filter,
  Calendar,
  Grid3x3,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
  Trash2,
  CircleAlert,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
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
  status: 'pending' | 'in-progress' | 'completed'
  title?: string
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

// Helper para formatar o título do pedido
const getOrderTitle = (order: Order, enableAlternativeTitle: boolean): string => {
  if (enableAlternativeTitle && order.title) {
    return `${order.title} - ${order.customer}`
  }
  return order.customer
}

// Componente de célula droppable do calendário
function DroppableCalendarCell({ date, children }: { 
  date: Date; 
  children: React.ReactNode;
}) {
  const dateStr = `date-${date.toISOString()}`
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] border-b border-r border-gray-200 p-2 transition-colors ${
        isOver ? 'bg-pink-50 ring-2 ring-pink-300 ring-inset' : 'bg-white'
      }`}
    >
      {children}
    </div>
  )
}

// Componente de pedido draggable simplificado para o calendário
function DraggableCalendarOrder({ order, onClick, enableAlternativeTitle }: { order: Order; onClick: () => void; enableAlternativeTitle: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

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
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="text-xs px-2 py-1 mb-1 rounded bg-white border border-gray-200 cursor-move hover:shadow-md hover:border-pink-300 transition-all flex items-center gap-1"
    >
      <div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(order.status)}`} />
      <span className="truncate flex-1">{getOrderTitle(order, enableAlternativeTitle)}</span>
      <span className="text-gray-500 text-[10px]">
        {order.deliveryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}

// Componente de card draggable
function SortableOrderCard({ order, onClick, enableAlternativeTitle }: { order: Order; onClick: () => void; enableAlternativeTitle: boolean }) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

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
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-5 mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="w-1 h-16 rounded-full bg-pink-500" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">{getOrderTitle(order, enableAlternativeTitle)}</h3>
              <p className="text-sm text-gray-600">{order.product}</p>
            </div>
            <Badge variant="outline" className={`${getStatusBadgeColor(order.status)} shrink-0`}>
              {getStatusText(order.status)}
            </Badge>
          </div>
          
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  // Função para obter a data atual no fuso de São Paulo
  const getTodayInSaoPaulo = () => {
    const now = new Date()
    // Converte para o horário de São Paulo (UTC-3)
    const saoPauloTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    return saoPauloTime
  }

  const [view, setView] = useState<'month' | 'week' | 'day' | 'list'>('list')
  const [dateFormat, setDateFormat] = useState<'short' | 'numeric' | 'long'>('numeric')
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
  const [enableAlternativeTitle, setEnableAlternativeTitle] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ordersEnableAlternativeTitle')
      return saved === 'true'
    }
    return false
  })
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  // Listener para detectar mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('ordersEnableAlternativeTitle')
      setEnableAlternativeTitle(saved === 'true')
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Também verifica ao montar o componente
    const checkInterval = setInterval(() => {
      const saved = localStorage.getItem('ordersEnableAlternativeTitle')
      if ((saved === 'true') !== enableAlternativeTitle) {
        setEnableAlternativeTitle(saved === 'true')
      }
    }, 500)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(checkInterval)
    }
  }, [enableAlternativeTitle])
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
    notes: ''
  })

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const orderId = active.id as string
    const targetDateStr = over.id as string

    // Se foi arrastado para uma célula de data (no calendário)
    if (targetDateStr.startsWith('date-')) {
      const targetDate = new Date(targetDateStr.replace('date-', ''))
      
      setOrders((items) => {
        return items.map((item) => {
          if (item.id === orderId) {
            // Manter a hora original, apenas mudar a data
            const newDate = new Date(targetDate)
            newDate.setHours(item.deliveryDate.getHours())
            newDate.setMinutes(item.deliveryDate.getMinutes())
            
            return {
              ...item,
              deliveryDate: newDate,
            }
          }
          return item
        })
      })

      showToast({
        title: 'Pedido reagendado!',
        message: `Pedido movido para ${targetDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`,
        variant: 'success',
        duration: 3000,
      })
    } else if (active.id !== over.id) {
      // Reordenação dentro da mesma data (lista)
      setOrders((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Carregar a view padrão do localStorage após montar
  useEffect(() => {
    const savedView = localStorage.getItem('ordersDefaultView')
    const savedDateFormat = localStorage.getItem('ordersDateFormat')
    if (savedView) {
      setView(savedView as 'month' | 'week' | 'day' | 'list')
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
        const [customersRes, productsRes, ordersRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/products'),
          fetch('/api/orders')
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
          // Converte as datas do banco para objetos Date
          const ordersWithDates = ordersData
            .filter((order: { type?: string }) => !order.type || order.type === 'order') // Filtra apenas pedidos (não tarefas)
            .filter((order: { delivery_date?: string }) => order.delivery_date) // Filtra pedidos sem data
            .map((order: Order & { delivery_date: string }) => ({
              ...order,
              deliveryDate: new Date(order.delivery_date)
            }))
          setOrders(ordersWithDates)
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
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

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

  // Carregar Status, Categorias e Tags do banco de dados
  const [allStatus, setAllStatus] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string; color: string }>>([])

  useEffect(() => {
    // Carregar configurações do banco de dados
    const loadSettings = async () => {
      try {
        const [statusesRes, categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/orders/statuses'),
          fetch('/api/orders/categories'),
          fetch('/api/orders/tags')
        ])

        if (statusesRes.ok) {
          const data = await statusesRes.json()
          setAllStatus(data)
        }
        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setAllCategories(data)
        }
        if (tagsRes.ok) {
          const data = await tagsRes.json()
          setAllTags(data)
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }

    loadSettings()

    // Recarregar quando houver mudanças nas configurações
    const handleFocus = () => {
      loadSettings()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

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
      notes: order.notes || ''
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
      notes: ''
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
      notes: ''
    })
    setIsModalOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Validações básicas
      if (!formData.customer || !formData.product || !formData.deliveryDateTime) {
        alert('Preencha todos os campos obrigatórios: Cliente, Produto e Data/Hora de Entrega')
        setIsSubmitting(false)
        return
      }

      // Prepare order data
      const orderData = {
        type: 'order', // Marca como pedido (não tarefa da Agenda)
        customer: formData.customer,
        customer_id: formData.customerId || null,
        product: formData.product,
        product_id: formData.productId || null,
        delivery_date: formData.deliveryDateTime.toISOString(),
        status: formData.status,
        title: formData.title || null,
        phone: formData.phone || null,
        value: formData.value, // API will parse Brazilian format
        notes: formData.notes || null,
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

      // Converte a data do banco para objeto Date
      const orderWithDate = {
        ...savedOrder,
        deliveryDate: new Date(savedOrder.delivery_date)
      }

      // Update orders list
      if (editingOrderId) {
        setOrders(orders.map(o => o.id === editingOrderId ? orderWithDate : o))
        showToast({
          title: 'Pedido atualizado!',
          message: 'O pedido foi atualizado com sucesso.',
          variant: 'success',
          duration: 3000,
        })
      } else {
        setOrders([orderWithDate, ...orders])
        showToast({
          title: 'Pedido criado!',
          message: 'O pedido foi criado com sucesso.',
          variant: 'success',
          duration: 3000,
        })
      }

      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar pedido:', error)
      showToast({
        title: 'Erro ao salvar pedido',
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
        throw new Error('Erro ao deletar pedido')
      }

      // Remove from orders list
      setOrders(orders.filter(o => o.id !== selectedOrder.id))
      setDeleteDialogOpen(false)
      showToast({
        title: 'Pedido excluído!',
        message: 'O pedido foi excluído com sucesso.',
        variant: 'success',
        duration: 3000,
      })
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao deletar pedido:', error)
      showToast({
        title: 'Erro ao excluir pedido',
        message: 'Não foi possível excluir o pedido. Tente novamente.',
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
    if (view === 'list') return 'Pedidos'
    
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
            <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
                Gerencie todos os pedidos da sua confeitaria. Visualize, organize e acompanhe o status de cada pedido em diferentes formatos: lista, calendário mensal, semanal ou diário.
              </div>
            </div>
          </div>

          <button 
            onClick={handleNewOrder}
            className="bg-[var(--color-clay-500)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--color-clay-600)] transition font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Novo Pedido
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar pedidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {allStatus.length > 0 && (
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
                {allStatus.filter(s => activeFilters.includes(s.id)).length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {allStatus.filter(s => activeFilters.includes(s.id)).length}
                  </Badge>
                )}
              </Button>
              
              {showStatusFilter && (
                <div className="filter-dropdown absolute top-full mt-2 bg-[var(--color-bg-modal)] border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                  {allStatus.map(status => (
                    <button
                      key={status.id}
                      onClick={() => toggleFilter(status.id)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer"
                    >
                      <Badge className={`${getColorClass(status.color)} border text-xs font-medium px-2 py-1`}>
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
                      <Badge className={`${getColorClass(category.color)} border text-xs font-medium px-2 py-1`}>
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
                      <Badge className={`${getColorClass(tag.color)} border text-xs font-medium px-2 py-1`}>
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
              const status = allStatus.find(s => s.id === filter)
              const item = tag || category || status
              
              return (
                <Badge
                  key={filter}
                  variant="secondary"
                  className={`${item ? getColorClass(item.color) : 'bg-gray-100 text-gray-800'} text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity`}
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

        {view !== 'list' && (
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
              <p>{searchQuery || activeFilters.length > 0 ? 'Nenhum pedido encontrado' : 'Nenhum pedido'}</p>
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
                    
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={ordersForDate.map(o => o.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-0">
                          {ordersForDate.map(order => (
                            <SortableOrderCard
                              key={order.id}
                              order={order}
                              onClick={() => handleOrderClick(order)}
                              enableAlternativeTitle={enableAlternativeTitle}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {view === 'month' && (
        <>
          {isLoading ? (
            <PageLoading />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            
            <SortableContext
              items={filteredOrders.map(o => o.id)}
              strategy={verticalListSortingStrategy}
            >
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
                      <DroppableCalendarCell
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
                            <DraggableCalendarOrder
                              key={order.id}
                              order={order}
                              onClick={() => handleOrderClick(order)}
                              enableAlternativeTitle={enableAlternativeTitle}
                            />
                          ))}
                        </div>
                      </DroppableCalendarCell>
                    )
                    
                    current.setDate(current.getDate() + 1)
                  }
                  
                  return days
                })()}
              </div>
            </SortableContext>
          </div>
        </DndContext>
          )}
        </>
      )}

      {view === 'week' && (
        <>
          {isLoading ? (
            <PageLoading />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
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
            
            <SortableContext
              items={filteredOrders.map(o => o.id)}
              strategy={verticalListSortingStrategy}
            >
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
                          <DroppableCalendarCell
                            key={dayIndex}
                            date={day}
                          >
                            {hourOrders.map(order => (
                              <DraggableCalendarOrder
                                key={order.id}
                                order={order}
                                onClick={() => handleOrderClick(order)}
                                enableAlternativeTitle={enableAlternativeTitle}
                              />
                            ))}
                          </DroppableCalendarCell>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </SortableContext>
          </div>
        </DndContext>
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
                                <h4 className="font-semibold text-gray-900 mb-1">{getOrderTitle(order, enableAlternativeTitle)}</h4>
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
        </>
      )}

      {/* Modal Pedido */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={isEditing ? 'Editar Pedido' : 'Novo Pedido'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {enableAlternativeTitle && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título do pedido
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-sm text-gray-500 bg-white"
                  placeholder="Ex: Aniversário, Casamento, etc."
                />
              </div>
            )}

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
                  subtitle: p.selling_price ? `R$ ${formatBRL(p.selling_price)}` : undefined
                }))}
                value={formData.productId}
                onValueChange={(value) => {
                  const selectedProduct = products.find(p => p.id === value)
                  if (selectedProduct?.selling_price) {
                    // Converte o preço para o formato esperado pelo input (sem R$ e separadores)
                    const priceFormatted = formatBRL(selectedProduct.selling_price)
                    setFormData(prev => ({
                      ...prev,
                      productId: value,
                      product: selectedProduct?.name || '',
                      value: priceFormatted
                    }))
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      productId: value,
                      product: selectedProduct?.name || ''
                    }))
                  }
                }}
                placeholder="Selecione ou busque um produto"
                onCreateNew={(searchTerm) => {
                  setNewProductData(prev => ({ ...prev, name: searchTerm }))
                  setIsProductModalOpen(true)
                }}
                createNewLabel="Adicionar"
                loading={loadingProducts}
              />
            </div>

            {/* Data e Hora de Entrega */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data e Hora de Entrega *
              </label>
              <DateTimePicker
                value={formData.deliveryDateTime}
                onChange={(date) => setFormData(prev => ({ ...prev, deliveryDateTime: date }))}
                placeholder="Selecione a data e hora da entrega"
              />
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
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-500 bg-white"
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
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setFormData(prev => ({ ...prev, phone: formatted }))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-sm text-gray-500 bg-white"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  R$
                </span>
                <input
                  type="text"
                  name="value"
                  value={formData.value}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value)
                    setFormData(prev => ({ ...prev, value: formatted }))
                  }}
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-sm text-gray-500 bg-white"
                  placeholder="0,00"
                />
              </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500 resize-none bg-white"
                placeholder="Observações sobre o pedido"
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
                {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar Pedido')}
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
                Essa ação não pode ser desfeita. O pedido será permanentemente excluído do sistema.
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
