'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, CreditCard, Info, Search, ArrowDownAZ, ThumbsUp, ThumbsDown,
  Lightbulb, Cloud, ClipboardList, Shirt, Settings, Plane, Briefcase, Music, Trophy, Newspaper, Sandwich, 
  ChefHat, MessageCircle, Dices, MapPin, Eye, Link, Heart, Flag, Utensils, Camera, Tag, ShoppingCart, Users,
  Wrench, Plus, Home, BarChart, Lock, Car, Coffee, FileText, MoreHorizontal, Palette, User, PawPrint, Shield, 
  Sailboat, Star, Sun, Gift, Book, Hospital, Bus, Bird, Package, TreePine, Zap, Droplet, Flame, Wallet, 
  PiggyBank, Receipt, Coins, HandCoins, CircleDollarSign, Filter, X, ArrowRightLeft
} from 'lucide-react'
import TransactionModal from '@/components/financeiro/TransactionModal'
import TransferModal from '@/components/financeiro/TransferModal'
import { showToast } from '@/app/(dashboard)/layout'
import { CountAnimation } from '@/components/ui/count-animation'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getToday, getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth, getCurrentMonthName, formatDateForAPI } from '@/lib/dateUtils'
import PageLoading from '@/components/PageLoading'

const ICON_MAP: Record<string, any> = {
  Lightbulb, Cloud, ClipboardList, Shirt, Settings, Plane, Briefcase,
  Music, Trophy, Newspaper, Sandwich, ChefHat, MessageCircle, Dices, MapPin,
  Eye, Link, Heart, Flag, Utensils, Camera, Tag, ShoppingCart, Users,
  Wrench, Plus, Home, BarChart, DollarSign, Lock, Car, Coffee, FileText,
  MoreHorizontal, Palette, CreditCard, User, PawPrint, Shield, Sailboat, Star,
  Sun, Gift, Book, Hospital, Bus, Bird, Package, TreePine, Zap, Droplet,
  Flame, Wallet, PiggyBank, TrendingUp, Receipt, Coins, HandCoins, CircleDollarSign
}

interface Transaction {
  id: string
  type: 'receita' | 'despesa'
  description: string
  amount: number
  date: string
  is_paid: boolean
  observation?: string
  category?: {
    id: string
    name: string
    color: string
    icon?: string
  }
  account?: {
    id: string
    name: string
  }
  tags?: string[]
  is_recurring?: boolean
  recurrence_type?: string
  installment_number?: number
  total_installments?: number
}

interface Summary {
  receitasPagas: number
  receitasTotal: number
  despesasPagas: number
  despesasTotal: number
  saldo: number
}

export default function FinanceiroPage() {
  const [showTransactionMenu, setShowTransactionMenu] = useState(false)
  const [modalType, setModalType] = useState<'receita' | 'despesa' | 'transferencia' | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary>({
    receitasPagas: 0,
    receitasTotal: 0,
    despesasPagas: 0,
    despesasTotal: 0,
    saldo: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    return {
      start: getStartOfMonth(),
      end: getEndOfMonth()
    }
  })
  const [categories, setCategories] = useState<Array<{id: string; name: string; color: string; type: string}>>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<Array<'receita' | 'despesa' | 'transferencia'>>([])
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [showTypeFilter, setShowTypeFilter] = useState(false)
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'hoje' | 'esta-semana' | 'este-mes' | 'escolher'>('este-mes')

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const startDate = formatDateForAPI(dateRange.start)
      const endDate = formatDateForAPI(dateRange.end)
      
      const response = await fetch(`/api/financeiro/transactions?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
        
        // Calculate summary with paid and total
        const receitasPagas = data.transactions
          ?.filter((t: Transaction) => t.type === 'receita' && t.is_paid)
          .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
        const receitasTotal = data.transactions
          ?.filter((t: Transaction) => t.type === 'receita')
          .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
        const despesasPagas = data.transactions
          ?.filter((t: Transaction) => t.type === 'despesa' && t.is_paid)
          .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
        const despesasTotal = data.transactions
          ?.filter((t: Transaction) => t.type === 'despesa')
          .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0) || 0
        
        setSummary({
          receitasPagas,
          receitasTotal,
          despesasPagas,
          despesasTotal,
          saldo: receitasPagas - despesasPagas
        })
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [dateRange])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showPeriodDropdown && !target.closest('.relative')) {
        setShowPeriodDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPeriodDropdown])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/financeiro/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  const handleTransactionSuccess = () => {
    fetchTransactions()
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setModalType(transaction.type)
  }

  const filteredTransactions = transactions
    .filter(t => {
      // Search filter
      const matchesSearch = !searchQuery || 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.account?.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Type filter
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(t.type)
      
      // Category filter
      const matchesCategory = selectedCategories.length === 0 || 
        (t.category && selectedCategories.includes(t.category.id))
      
      // Tag filter
      const matchesTags = selectedTags.length === 0 || 
        (t.tags && t.tags.some(tag => selectedTags.includes(tag)))
      
      return matchesSearch && matchesType && matchesCategory && matchesTags
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

  // Calculate summary based on filtered transactions
  const filteredSummary = {
    receitasPagas: filteredTransactions
      .filter(t => t.type === 'receita' && t.is_paid)
      .reduce((sum, t) => sum + Number(t.amount), 0),
    receitasTotal: filteredTransactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + Number(t.amount), 0),
    despesasPagas: filteredTransactions
      .filter(t => t.type === 'despesa' && t.is_paid)
      .reduce((sum, t) => sum + Number(t.amount), 0),
    despesasTotal: filteredTransactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + Number(t.amount), 0),
    saldo: 0
  }
  filteredSummary.saldo = filteredSummary.receitasPagas - filteredSummary.despesasPagas

  const formatCurrency = (value: number): string => {
    const isInteger = value % 1 === 0
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: isInteger ? 0 : 2,
      maximumFractionDigits: 2
    })
  }

  const getIconComponent = (iconName?: string) => {
    if (!iconName || !ICON_MAP[iconName]) {
      return null
    }
    const Icon = ICON_MAP[iconName]
    return <Icon className="w-4 h-4" />
  }

  const togglePaymentStatus = async (e: React.MouseEvent, transaction: Transaction) => {
    e.stopPropagation() // Prevent row click
    
    // Optimistic UI update
    const newIsPaid = !transaction.is_paid
    setTransactions(prev => 
      prev.map(t => 
        t.id === transaction.id ? { ...t, is_paid: newIsPaid } : t
      )
    )
    
    try {
      const response = await fetch(`/api/financeiro/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_paid: newIsPaid })
      })

      if (response.ok) {
        showToast({
          title: 'Status atualizado',
          message: `Transação marcada como ${newIsPaid ? 'paga' : 'não paga'}`,
          variant: 'success',
          duration: 2000,
        })
        // No need to refresh - optimistic update is enough
      } else {
        // Revert on error
        setTransactions(prev => 
          prev.map(t => 
            t.id === transaction.id ? { ...t, is_paid: !newIsPaid } : t
          )
        )
        throw new Error('Failed to update')
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      showToast({
        title: 'Erro',
        message: 'Erro ao atualizar status de pagamento',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showTransactionMenu && !target.closest('.transaction-menu')) {
        setShowTransactionMenu(false)
      }
      if (showCategoryFilter && !target.closest('.category-filter')) {
        setShowCategoryFilter(false)
      }
      if (showTagFilter && !target.closest('.tag-filter')) {
        setShowTagFilter(false)
      }
      if (showTypeFilter && !target.closest('.type-filter')) {
        setShowTypeFilter(false)
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTransactionMenu(false)
        setShowCategoryFilter(false)
        setShowTagFilter(false)
        setShowTypeFilter(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showTransactionMenu, showCategoryFilter, showTagFilter, showTypeFilter])

  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const toggleTypeFilter = (type: 'receita' | 'despesa' | 'transferencia') => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const allTags = Array.from(new Set(transactions.flatMap(t => t.tags || [])))

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
              className="bg-[var(--color-clay-500)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--color-clay-600)] transition font-semibold cursor-pointer"
            >
              + Transação
            </button>

            {showTransactionMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => {
                    setShowTransactionMenu(false)
                    setModalType('receita')
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors flex items-center gap-3 rounded-lg mx-2 cursor-pointer"
                  style={{ width: 'calc(100% - 1rem)' }}
                >
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Receita</span>
                </button>
                <button
                  onClick={() => {
                    setShowTransactionMenu(false)
                    setModalType('despesa')
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 rounded-lg mx-2 cursor-pointer"
                  style={{ width: 'calc(100% - 1rem)' }}
                >
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="text-gray-700">Despesa</span>
                </button>
                <button
                  onClick={() => {
                    setShowTransactionMenu(false)
                    setModalType('transferencia')
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 rounded-lg mx-2 cursor-pointer"
                  style={{ width: 'calc(100% - 1rem)' }}
                >
                  <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Transferência</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar transações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          <div className="relative type-filter">
            <button
              className="inline-flex items-center justify-center h-10 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors cursor-pointer"
              onClick={() => {
                setShowTypeFilter(!showTypeFilter)
                setShowCategoryFilter(false)
                setShowTagFilter(false)
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Tipo
              {selectedTypes.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {selectedTypes.length}
                </Badge>
              )}
            </button>
            
            {showTypeFilter && (
              <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                <button
                  onClick={() => toggleTypeFilter('receita')}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Receita</span>
                  </div>
                  {selectedTypes.includes('receita') && (
                    <span className="text-xs text-green-600 font-semibold">✓</span>
                  )}
                </button>
                <button
                  onClick={() => toggleTypeFilter('despesa')}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Despesa</span>
                  </div>
                  {selectedTypes.includes('despesa') && (
                    <span className="text-xs text-green-600 font-semibold">✓</span>
                  )}
                </button>
                <button
                  onClick={() => toggleTypeFilter('transferencia')}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Transferência</span>
                  </div>
                  {selectedTypes.includes('transferencia') && (
                    <span className="text-xs text-green-600 font-semibold">✓</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {categories.length > 0 && (
            <div className="relative category-filter">
              <button
                className="inline-flex items-center justify-center h-10 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors cursor-pointer"
                onClick={() => {
                  setShowCategoryFilter(!showCategoryFilter)
                  setShowTagFilter(false)
                  setShowTypeFilter(false)
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Categorias
                {selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {selectedCategories.length}
                  </Badge>
                )}
              </button>
              
              {showCategoryFilter && (
                <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => toggleCategoryFilter(category.id)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      {selectedCategories.includes(category.id) && (
                        <span className="text-xs text-green-600 font-semibold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {allTags.length > 0 && (
            <div className="relative tag-filter">
              <button
                className="inline-flex items-center justify-center h-10 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors cursor-pointer"
                onClick={() => {
                  setShowTagFilter(!showTagFilter)
                  setShowCategoryFilter(false)
                  setShowTypeFilter(false)
                }}
              >
                <Tag className="h-4 w-4 mr-2" />
                Tags
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {selectedTags.length}
                  </Badge>
                )}
              </button>
              
              {showTagFilter && (
                <div className="absolute top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <span className="text-sm">{tag}</span>
                      {selectedTags.includes(tag) && (
                        <span className="text-xs text-green-600 font-semibold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="inline-flex items-center justify-center h-10 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors cursor-pointer"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {selectedPeriod === 'hoje' && 'Hoje'}
                {selectedPeriod === 'esta-semana' && 'Esta semana'}
                {selectedPeriod === 'este-mes' && getCurrentMonthName()}
                {selectedPeriod === 'escolher' && `${dateRange.start.toLocaleDateString('pt-BR', { month: 'short' })} - ${dateRange.end.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`}
              </button>
              
              {showPeriodDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      const today = getToday()
                      setDateRange({ start: today, end: today })
                      setSelectedPeriod('hoje')
                      setShowPeriodDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 first:rounded-t-lg"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => {
                      setDateRange({ start: getStartOfWeek(), end: getEndOfWeek() })
                      setSelectedPeriod('esta-semana')
                      setShowPeriodDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                  >
                    Esta semana
                  </button>
                  <button
                    onClick={() => {
                      setDateRange({ start: getStartOfMonth(), end: getEndOfMonth() })
                      setSelectedPeriod('este-mes')
                      setShowPeriodDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                  >
                    Este mês
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPeriod('escolher')
                      setShowPeriodDropdown(false)
                      // TODO: Abrir date picker
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 last:rounded-b-lg"
                  >
                    Escolher período
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Receitas Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mb-1">
            {loading ? (
              <h3 className="text-2xl font-bold text-gray-900">R$ 0,00</h3>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-gray-900">R$</span>
                <CountAnimation 
                  number={filteredSummary.receitasPagas} 
                  className="text-2xl font-bold text-gray-900"
                />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">Receita Realizada</p>
          {filteredSummary.receitasTotal > filteredSummary.receitasPagas && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Prevista: R$ {formatCurrency(filteredSummary.receitasTotal)}
              </p>
            </div>
          )}
        </div>

        {/* Despesas Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mb-1">
            {loading ? (
              <h3 className="text-2xl font-bold text-gray-900">R$ 0,00</h3>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-gray-900">R$</span>
                <CountAnimation 
                  number={filteredSummary.despesasPagas} 
                  className="text-2xl font-bold text-gray-900"
                />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">Despesa Realizada</p>
          {filteredSummary.despesasTotal > filteredSummary.despesasPagas && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Prevista: R$ {formatCurrency(filteredSummary.despesasTotal)}
              </p>
            </div>
          )}
        </div>

        {/* Saldo Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-lavender-blush)] flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[var(--color-clay-500)]" />
            </div>
          </div>
          <div className="mb-1">
            {loading ? (
              <h3 className="text-2xl font-bold text-gray-900">R$ 0,00</h3>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-gray-900">R$</span>
                <CountAnimation 
                  number={filteredSummary.saldo} 
                  className={`text-2xl font-bold ${filteredSummary.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}
                />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">Saldo Realizado</p>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Saldo Previsto: R$ {formatCurrency(filteredSummary.receitasTotal - filteredSummary.despesasTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Transações</h2>
        </div>

        {loading ? (
          <PageLoading />
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? (
              <>
                <p>Nenhuma transação encontrada</p>
                <p className="text-sm mt-2">Tente buscar com outros termos</p>
              </>
            ) : (
              <>
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma transação registrada ainda</p>
                <p className="text-sm mt-2">Comece adicionando suas receitas e despesas</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-sm font-medium text-gray-600">Descrição</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-gray-600">Data</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-gray-600">Conta</th>
                  <th className="text-right py-3 px-3 text-sm font-medium text-gray-600">Valor</th>
                  <th className="text-center py-3 px-3 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr 
                    key={transaction.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {transaction.category && transaction.category.icon && (
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border"
                            style={{ 
                              backgroundColor: transaction.category.color + '20', 
                              borderColor: transaction.category.color + '40',
                              color: transaction.category.color 
                            }}
                          >
                            {getIconComponent(transaction.category.icon)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                          {transaction.observation && (
                            <div className="text-xs text-gray-500 mt-0.5">{transaction.observation}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm text-gray-600">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm text-gray-700">{transaction.account?.name || '-'}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`text-sm font-semibold ${transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'receita' ? '+' : '-'} R$ {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => togglePaymentStatus(e, transaction)}
                        className="group relative inline-flex items-center justify-center p-1 hover:bg-gray-100 rounded transition-all duration-300 cursor-pointer focus:outline-none focus-visible:outline-none"
                        aria-label={transaction.is_paid ? 'Marcar como não pago' : 'Marcar como pago'}
                      >
                        <div className="transition-all duration-300 ease-in-out" style={{ transform: transaction.is_paid ? 'scaleY(1)' : 'scaleY(-1)' }}>
                          {transaction.is_paid ? (
                            <ThumbsUp className="w-4 h-4 text-green-600 transition-colors duration-300" />
                          ) : (
                            <ThumbsUp className={`w-4 h-4 transition-colors duration-300 ${new Date(transaction.date) < new Date() ? 'text-red-600' : 'text-gray-400'}`} />
                          )}
                        </div>
                        <span className="absolute invisible group-hover:visible bottom-full mb-2 w-auto bg-white text-[var(--color-licorice)] rounded-lg shadow-lg z-50 border border-gray-200 whitespace-nowrap" style={{ padding: '4px 8px', fontSize: '11px' }}>
                          {transaction.is_paid ? 'Marcar como não pago' : 'Marcar como pago'}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {modalType && modalType !== 'transferencia' && (
        <TransactionModal
          isOpen={modalType !== null}
          onClose={() => {
            setModalType(null)
            setSelectedTransaction(null)
          }}
          type={modalType}
          transaction={selectedTransaction}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {/* Transfer Modal */}
      {modalType === 'transferencia' && (
        <TransferModal
          isOpen={true}
          onClose={() => {
            setModalType(null)
          }}
          onSuccess={handleTransactionSuccess}
        />
      )}
    </div>
  )
}
