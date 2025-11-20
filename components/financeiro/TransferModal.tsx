'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquare, FileText, Paperclip, Repeat } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { showToast } from '@/app/(dashboard)/layout'

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface Account {
  id: string
  name: string
  type: string
}

export default function TransferModal({ isOpen, onClose, onSuccess }: TransferModalProps) {
  const [description, setDescription] = useState('Transferência')
  const [amount, setAmount] = useState('0,00')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [fromAccount, setFromAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [observation, setObservation] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [activeTab, setActiveTab] = useState<'repetir' | 'observacao' | 'anexo' | 'tags'>('repetir')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  
  // Data from API
  const [accounts, setAccounts] = useState<Account[]>([])

  // Fetch accounts
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const accountsData = await fetch('/api/financeiro/accounts').then(res => res.json())
          setAccounts(accountsData.accounts || [])
        } catch (error) {
          console.error('Erro ao carregar contas:', error)
        }
      }
      fetchData()
    }
  }, [isOpen])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDescription('Transferência')
      setAmount('0,00')
      setDate(new Date().toISOString().split('T')[0])
      setFromAccount('')
      setToAccount('')
      setObservation('')
      setTags([])
      setTagInput('')
      setActiveTab('repetir')
      setIsRecurring(false)
    }
  }, [isOpen])

  // Close modal with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleAmountChange = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    if (!numbers) {
      setAmount('0,00')
      return
    }
    
    // Converte para formato com vírgula
    const numValue = parseInt(numbers) / 100
    setAmount(numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fromAccount) {
      showToast({
        title: 'Erro',
        message: 'Selecione a conta de origem',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    if (!toAccount) {
      showToast({
        title: 'Erro',
        message: 'Selecione a conta de destino',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    if (fromAccount === toAccount) {
      showToast({
        title: 'Erro',
        message: 'As contas de origem e destino devem ser diferentes',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'))
    
    if (numericAmount <= 0) {
      showToast({
        title: 'Erro',
        message: 'O valor deve ser maior que zero',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create two transactions: one despesa (from) and one receita (to)
      const transferData = {
        description,
        amount: numericAmount,
        date,
        fromAccount,
        toAccount,
        observation,
        tags,
        type: 'transferencia'
      }

      const response = await fetch('/api/financeiro/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      })

      if (response.ok) {
        showToast({
          title: 'Transferência criada!',
          message: `Transferência de R$ ${amount} registrada com sucesso`,
          variant: 'success',
          duration: 3000,
        })
        onSuccess?.()
        onClose()
      } else {
        throw new Error('Erro ao criar transferência')
      }
    } catch (error) {
      console.error('Erro ao criar transferência:', error)
      showToast({
        title: 'Erro',
        message: 'Erro ao criar transferência',
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--color-bg-modal)] rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-bg-modal)] flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Nova transferência</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* From Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Saiu da conta
              </label>
              <Select value={fromAccount} onValueChange={setFromAccount}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Buscar conta..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entrou na conta
              </label>
              <Select value={toAccount} onValueChange={setToAccount}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Buscar conta..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Transferência"
              />
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <Input
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="pl-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('repetir')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    activeTab === 'repetir' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                  Repetir
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('observacao')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    activeTab === 'observacao' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Observação
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tags')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    activeTab === 'tags' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Tags
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('anexo')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    activeTab === 'anexo' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                  Anexo
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'repetir' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">é uma transferência recorrente</span>
                  </label>
                </div>
              )}

              {activeTab === 'observacao' && (
                <Textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Adicione uma observação..."
                  rows={3}
                />
              )}

              {activeTab === 'tags' && (
                <div>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      placeholder="Digite uma tag e pressione Enter"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                    >
                      Adicionar
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-blue-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'anexo' && (
                <div className="text-center py-8 text-gray-500">
                  <Paperclip className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Funcionalidade em desenvolvimento</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <button
              type="submit"
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
                  Salvar Transferência
                </>
              )}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}
