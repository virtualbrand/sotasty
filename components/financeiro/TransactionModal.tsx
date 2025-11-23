'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  X, Repeat, MessageSquare, Paperclip, ThumbsUp, ThumbsDown, Plus,
  Lightbulb, Cloud, ClipboardList, Shirt, Settings, Plane, Briefcase, Music, Trophy, Newspaper, Sandwich, 
  ChefHat, Dices, MapPin, Eye, Link, Heart, Flag, Utensils, Camera, Tag, ShoppingCart, Users,
  Wrench, Home, BarChart, DollarSign, Lock, Car, Coffee, FileText, MoreHorizontal, Palette, User, PawPrint, Shield, 
  Sailboat, Star, Sun, Gift, Book, Hospital, Bus, Bird, Package, TreePine, Zap, Droplet, Flame, Wallet, 
  PiggyBank, Receipt, Coins, HandCoins, CircleDollarSign, CreditCard
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { showToast } from '@/app/(dashboard)/layout'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'receita' | 'despesa'
  transaction?: {
    id: string
    description: string
    amount: number
    date: string
    account?: { id: string; name: string }
    category?: { id: string; name: string; color: string; icon?: string }
    observation?: string
    tags?: string[]
    is_paid: boolean
    is_recurring?: boolean
    recurrence_type?: string
    installment_number?: number
    total_installments?: number
  } | null
  onSuccess?: () => void
}

type RecurrenceType = 'fixa' | 'parcelada' | null

interface Account {
  id: string
  name: string
  type: string
}

interface Category {
  id: string
  name: string
  type: string
  color: string
  icon?: string
}

const ICON_MAP: Record<string, any> = {
  Lightbulb, Cloud, ClipboardList, Shirt, Settings, Plane, Briefcase,
  Music, Trophy, Newspaper, Sandwich, ChefHat, Dices, MapPin,
  Eye, Link, Heart, Flag, Utensils, Camera, Tag, ShoppingCart, Users,
  Wrench, Plus, Home, BarChart, DollarSign, Lock, Car, Coffee, FileText,
  MoreHorizontal, Palette, CreditCard, User, PawPrint, Shield, Sailboat, Star,
  Sun, Gift, Book, Hospital, Bus, Bird, Package, TreePine, Zap, Droplet,
  Flame, Wallet, PiggyBank, Receipt, Coins, HandCoins, CircleDollarSign
}

export default function TransactionModal({ isOpen, onClose, type, transaction, onSuccess }: TransactionModalProps) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('0,00')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [account, setAccount] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(null)
  const [installments, setInstallments] = useState('2')
  const [installmentPeriod, setInstallmentPeriod] = useState<'Meses' | 'Semanas'>('Meses')
  const [observation, setObservation] = useState('')
  const [activeTab, setActiveTab] = useState<'repetir' | 'observacao' | 'anexo' | 'tags'>('repetir')
  const [isPaid, setIsPaid] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Data from API
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // Populate form when editing transaction
  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description)
      setAmount(transaction.amount.toFixed(2).replace('.', ','))
      setDate(transaction.date)
      setAccount(transaction.account?.id || '')
      setCategory(transaction.category?.id || '')
      setObservation(transaction.observation || '')
      setTags(transaction.tags || [])
      setIsPaid(transaction.is_paid)
      if (transaction.is_recurring) {
        setRecurrenceType(transaction.recurrence_type as RecurrenceType)
        if (transaction.total_installments) {
          setInstallments(transaction.total_installments.toString())
        }
      }
    }
  }, [transaction])

  // Fetch accounts and categories
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [accountsData, categoriesData] = await Promise.all([
            fetch('/api/financeiro/accounts').then(res => res.json()),
            fetch(`/api/financeiro/categories?type=${type}`).then(res => res.json()),
          ])
          setAccounts(accountsData.accounts || [])
          setCategories(categoriesData.categories || [])
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
      fetchData()
    }
  }, [isOpen, type])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Use a timeout to reset after the modal is fully closed
      const timer = setTimeout(() => {
        setDescription('')
        setAmount('0,00')
        setDate(new Date().toISOString().split('T')[0])
        setAccount('')
        setCategory('')
        setTags([])
        setTagInput('')
        setRecurrenceType(null)
        setInstallments('2')
        setInstallmentPeriod('Meses')
        setObservation('')
        setActiveTab('repetir')
        setIsPaid(true)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    const numericValue = parseInt(value || '0')
    const formatted = (numericValue / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    setAmount(formatted)
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async () => {
    if (!description || !amount || parseFloat(amount.replace(',', '.')) === 0) {
      showToast({
        title: 'Campos obrigatórios',
        message: 'Preencha a descrição e o valor',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/financeiro/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          description,
          amount: amount.replace(',', '.'),
          date,
          accountId: account || null,
          categoryId: category || null,
          isPaid,
          observation,
          tags,
          recurrenceType,
          installments: recurrenceType === 'parcelada' ? installments : null,
          installmentPeriod: recurrenceType === 'parcelada' ? installmentPeriod : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar transação')
      }

      showToast({
        title: `${type === 'receita' ? 'Receita' : 'Despesa'} criada!`,
        message: `"${description}" foi adicionada com sucesso`,
        variant: 'success',
        duration: 3000,
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error saving transaction:', error)
      showToast({
        title: 'Erro',
        message: 'Erro ao salvar transação. Tente novamente.',
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const isReceita = type === 'receita'
  const title = transaction 
    ? (isReceita ? 'Editar receita' : 'Editar despesa')
    : (isReceita ? 'Nova receita' : 'Nova despesa')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--color-bg-modal)] rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-bg-modal)] flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Aluguel, Salário, Compras..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900 placeholder:text-sm text-gray-500 bg-white"
              />
            </div>

            {/* Valor e Data */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    R$
                  </span>
                  <Input
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0,00"
                    className="w-full pl-12 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-sm text-gray-500 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900 bg-white"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className="h-4 w-px bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => setIsPaid(!isPaid)}
                      className="cursor-pointer transition-all duration-300"
                      style={{
                        transform: isPaid ? 'scaleY(1)' : 'scaleY(-1)'
                      }}
                    >
                      <ThumbsUp 
                        className={`w-4 h-4 transition-colors duration-300 ${
                          isPaid 
                            ? 'text-green-600' 
                            : (new Date(date) < new Date(new Date().setHours(0, 0, 0, 0)) ? 'text-red-600' : 'text-gray-400')
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Conta/Cartão e Categoria */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta/Cartão
                </label>
                <Select value={account} onValueChange={setAccount}>
                  <SelectTrigger className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900 bg-white">
                    <SelectValue placeholder="Selecione ou busque um conta/cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="max-h-[300px] overflow-y-auto">
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        router.push('/settings/financeiro')
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 text-[var(--color-clay-500)] border-t border-gray-200 mt-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Adicionar</span>
                    </button>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900 bg-white">
                    <SelectValue placeholder="Selecione ou busque uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="max-h-[300px] overflow-y-auto">
                      {categories.map((cat) => {
                        const IconComponent = cat.icon && ICON_MAP[cat.icon] ? ICON_MAP[cat.icon] : null
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              {IconComponent && (
                                <div 
                                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border"
                                  style={{ 
                                    backgroundColor: `${cat.color}20`,
                                    borderColor: `${cat.color}40`,
                                    color: cat.color
                                  }}
                                >
                                  <IconComponent className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        const tabType = type === 'receita' ? 'receitas' : 'despesas'
                        router.push(`/settings/financeiro?tab=${tabType}`)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 text-[var(--color-clay-500)] border-t border-gray-200 mt-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Adicionar</span>
                    </button>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags - Always Visible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Digite uma tag e pressione Enter"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900 placeholder:text-sm text-gray-500 bg-white"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-200 -mx-6 px-6 pt-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('repetir')}
                  className="flex items-center justify-center gap-2 py-2 px-3 text-gray-600 hover:text-gray-900 transition"
                >
                  <Repeat className="w-4 h-4" />
                  <span className="text-sm">Repetir</span>
                </button>
                <button
                  onClick={() => setActiveTab('observacao')}
                  className="flex items-center justify-center gap-2 py-2 px-3 text-gray-600 hover:text-gray-900 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">Observação</span>
                </button>
                <button
                  onClick={() => setActiveTab('anexo')}
                  className="flex items-center justify-center gap-2 py-2 px-3 text-gray-600 hover:text-gray-900 transition"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">Anexo</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[120px]">
                {activeTab === 'repetir' && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recurrence"
                        checked={recurrenceType === 'fixa'}
                        onChange={() => setRecurrenceType('fixa')}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm text-gray-700">é uma {isReceita ? 'receita' : 'despesa'} recorrente</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recurrence"
                        checked={recurrenceType === 'parcelada'}
                        onChange={() => setRecurrenceType('parcelada')}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm text-gray-700">é um lançamento parcelado em</span>
                    </label>

                    {recurrenceType === 'parcelada' && (
                        <div className="ml-6 mt-2">
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            min="2"
                            value={installments}
                            onChange={(e) => setInstallments(e.target.value)}
                            className="w-20 text-center px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900 bg-white"
                          />
                          <Select value={installmentPeriod} onValueChange={(value: 'Meses' | 'Semanas') => setInstallmentPeriod(value)}>
                            <SelectTrigger className="w-28 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900 bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Meses">Meses</SelectItem>
                              <SelectItem value="Semanas">Semanas</SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            onClick={() => setRecurrenceType(null)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Serão lançadas {installments} parcelas de R$ {amount}
                        </p>
                        <p className="text-xs text-gray-500">
                          Em caso de divisão não exata, a sobra será somada à primeira parcela.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'observacao' && (
                  <div>
                  <Textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Adicione uma observação..."
                    className="w-full min-h-[100px] resize-none px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900 placeholder:text-sm text-gray-500 bg-white"
                  />
                  </div>
                )}

                {activeTab === 'anexo' && (
                  <div className="flex items-center justify-center h-[100px] border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Clique para adicionar anexo</p>
                      <p className="text-xs text-gray-400 mt-1">No file chosen</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-success w-full"
          >
            {isSubmitting ? (
              <span>Salvando...</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check w-4 h-4" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                Salvar {isReceita ? 'Receita' : 'Despesa'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
