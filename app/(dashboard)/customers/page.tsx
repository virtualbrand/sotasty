'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { User, Phone, Mail, ShoppingBag, X, Search, Info, ArrowDownAZ, ArrowDownZA, Camera, SwitchCamera, CircleX, Trash2, CircleAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { showToast } from '@/app/(dashboard)/layout'
import { useCustomerSettings } from '@/hooks/useCustomerSettings'
import { createClient } from '@/lib/supabase/client'
import SuperAdminCustomers from './SuperAdminCustomers'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Customer = {
  id: string
  name: string
  phone: string
  email: string
  avatar_url?: string
  cpf_cnpj?: string
  notes?: string
  created_at: string
  orders_count?: number
}

// Função para formatar CPF/CNPJ
const formatCpfCnpj = (value: string): string => {
  const numbers = value.replace(/\D/g, "")
  
  if (!numbers) return ""
  
  // CPF: 000.000.000-00
  if (numbers.length <= 11) {
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  }
  
  // CNPJ: 00.000.000/0000-00
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
}

// Função para formatar telefone
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

// Validação de email
const validateEmail = (email: string): boolean => {
  const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  return regex.test(email)
}

export default function CustomersPage() {
  const customerSettings = useCustomerSettings()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userRole, setUserRole] = useState<string>('admin')
  const [loadingRole, setLoadingRole] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cpf_cnpj: '',
    notes: '',
    avatar: null as File | null
  })
  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    email: false,
    cpf_cnpj: false,
    notes: false
  })
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    email: '',
    cpf_cnpj: '',
    notes: ''
  })

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const loadUserRole = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role) {
        setUserRole(profile.role)
      }
    }
    setLoadingRole(false)
  }

  // Mock data para demonstração
  useEffect(() => {
    loadUserRole()
    fetchCustomers()
  }, [])

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) {
          closeModal()
        }
        if (selectedCustomer) {
          setSelectedCustomer(null)
        }
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isModalOpen, selectedCustomer])

  // Se for superadmin, mostrar componente diferente
  if (loadingRole) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (userRole === 'superadmin') {
    return <SuperAdminCustomers />
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
    setFormData({ name: '', phone: '', email: '', cpf_cnpj: '', notes: '', avatar: null })
    setTouched({ name: false, phone: false, email: false, cpf_cnpj: false, notes: false })
    setErrors({ name: '', phone: '', email: '', cpf_cnpj: '', notes: '' })
    setAvatarPreview(null)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'phone') {
      const formatted = formatPhone(value)
      setFormData(prev => ({ ...prev, [name]: formatted }))
    } else if (name === 'cpf_cnpj') {
      const formatted = formatCpfCnpj(value)
      setFormData(prev => ({ ...prev, [name]: formatted }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Validação em tempo real após o campo ser tocado
    if (touched[name as keyof typeof touched]) {
      validateField(name, name === 'phone' ? formatPhone(value) : name === 'cpf_cnpj' ? formatCpfCnpj(value) : value)
    }
  }

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    const value = formData[fieldName as keyof typeof formData]
    if (typeof value === 'string') {
      validateField(fieldName, value)
    }
  }

  const validateField = (fieldName: string, value: string) => {
    let error = ''

    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          error = 'Nome é obrigatório'
        }
        break
      case 'phone':
        const phoneDigits = value.replace(/\D/g, '')
        // Telefone é opcional, mas se preenchido deve ser válido
        if (phoneDigits && phoneDigits.length < 10) {
          error = 'Telefone inválido'
        }
        break
      case 'cpf_cnpj':
        const cpfCnpjDigits = value.replace(/\D/g, '')
        // CPF/CNPJ é opcional, mas se preenchido deve ser válido
        if (cpfCnpjDigits && cpfCnpjDigits.length !== 11 && cpfCnpjDigits.length !== 14) {
          error = 'CPF (11 dígitos) ou CNPJ (14 dígitos) inválido'
        }
        break
      case 'email':
        // E-mail é opcional, mas se preenchido deve ser válido
        if (value.trim() && !validateEmail(value)) {
          error = 'E-mail inválido'
        }
        break
    }

    setErrors(prev => ({ ...prev, [fieldName]: error }))
    return error === ''
  }

  const validateForm = (): boolean => {
    const nameValid = validateField('name', formData.name)
    const phoneValid = validateField('phone', formData.phone)
    const emailValid = validateField('email', formData.email)
    const cpfCnpjValid = validateField('cpf_cnpj', formData.cpf_cnpj)
    
    setTouched({ name: true, phone: true, email: true, cpf_cnpj: true, notes: true })
    
    return nameValid && phoneValid && emailValid && cpfCnpjValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Preparar dados para envio
      const dataToSend = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        cpf_cnpj: formData.cpf_cnpj,
        notes: formData.notes,
        avatar_url: avatarPreview // Usar o preview que já está em base64
      }

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) throw new Error('Failed to create customer')

      const newCustomer = await response.json()
      
      // Adicionar orders_count ao novo cliente
      const customerWithCount = {
        ...newCustomer,
        orders_count: 0
      }

      setCustomers(prev => [customerWithCount, ...prev])
      closeModal()
      showToast({
        title: 'Cliente criado!',
        message: `${newCustomer.name} foi adicionado com sucesso.`,
        variant: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      showToast({
        title: 'Erro ao criar cliente',
        message: 'Não foi possível criar o cliente. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditCustomer = async (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      cpf_cnpj: customer.cpf_cnpj || '',
      notes: customer.notes || '',
      avatar: null
    })
    if (customer.avatar_url) {
      setAvatarPreview(customer.avatar_url)
    }
    setEditingCustomer(customer)
    setSelectedCustomer(null)
    setIsModalOpen(true)
  }

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !editingCustomer) {
      return
    }

    setLoading(true)

    try {
      // Preparar dados para envio
      const dataToSend = {
        id: editingCustomer.id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        cpf_cnpj: formData.cpf_cnpj,
        notes: formData.notes,
        avatar_url: avatarPreview // Usar o preview que já está em base64
      }

      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) throw new Error('Failed to update customer')

      const updatedCustomer = await response.json()
      
      setCustomers(prev => prev.map(c => 
        c.id === updatedCustomer.id 
          ? { ...updatedCustomer, orders_count: c.orders_count }
          : c
      ))
      
      closeModal()
      showToast({
        title: 'Cliente atualizado!',
        message: 'O cliente foi atualizado com sucesso.',
        variant: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      showToast({
        title: 'Erro ao atualizar cliente',
        message: 'Não foi possível atualizar o cliente. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers?id=${customerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete customer')

      setCustomers(prev => prev.filter(c => c.id !== customerId))
      setSelectedCustomer(null)
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
      showToast({
        title: 'Cliente excluído!',
        message: 'O cliente foi excluído com sucesso.',
        variant: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      showToast({
        title: 'Erro ao excluir cliente',
        message: 'Não foi possível excluir o cliente. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Filtrar e ordenar clientes
  let filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  )

  // Ordena somente se sortOrder foi definido
  if (sortOrder !== null) {
    filteredCustomers = filteredCustomers.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, 'pt-BR')
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => {
      if (prev === null) return 'asc'
      if (prev === 'asc') return 'desc'
      return null
    })
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
              Gerencie sua base de clientes. Cadastre novos clientes, edite informações de contato e acompanhe o histórico de pedidos de cada um.
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-clay-500)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--color-clay-600)] transition font-semibold cursor-pointer"
        >
          + Novo Cliente
        </button>
      </div>

      {/* Barra de Busca e Ordenação */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="group relative">
          <button
            onClick={toggleSortOrder}
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 filter-button h-10 cursor-pointer"
          >
            {sortOrder === null ? (
              <ArrowDownAZ className="w-5 h-5 opacity-80" />
            ) : sortOrder === 'asc' ? (
              <ArrowDownAZ className="w-5 h-5 opacity-80" />
            ) : (
              <ArrowDownZA className="w-5 h-5 opacity-80" />
            )}
          </button>
          <div className="invisible group-hover:visible absolute right-0 top-full mt-2 bg-white text-[var(--color-licorice)] text-xs rounded-lg shadow-lg z-50 border border-gray-200 px-2 py-1 whitespace-nowrap">
            {sortOrder === null ? 'Ordenar A-Z' : sortOrder === 'asc' ? 'Ordenar Z-A' : 'Remover ordenação'}
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado. Clique em "+ Novo Cliente" para começar.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {customerSettings.showPhoto && <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm w-20"></th>}
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Cliente</th>
                {customerSettings.showCpfCnpj && <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">CPF/CNPJ</th>}
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Telefone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">E-mail</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Pedidos</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Cliente desde</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr 
                  key={customer.id} 
                  className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleEditCustomer(customer)}
                >
                  {customerSettings.showPhoto && (
                    <td className="py-3 px-4">
                      {customer.avatar_url ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                          <Image
                            src={customer.avatar_url}
                            alt={customer.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full border border-gray-200 bg-gradient-to-br from-[var(--color-melon)] to-[var(--color-clay-500)] flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </td>
                  )}
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">{customer.name}</td>
                  {customerSettings.showCpfCnpj && (
                    <td className="py-3 px-4 text-sm text-gray-600">{customer.cpf_cnpj || '-'}</td>
                  )}
                  <td className="py-3 px-4 text-sm text-gray-600">{customer.phone || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{customer.email || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {customer.orders_count && customer.orders_count > 0 ? (
                      <Link 
                        href={`/orders?customer=${encodeURIComponent(customer.name)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[var(--color-clay-500)] font-semibold hover:text-[var(--color-clay-600)] transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {customer.orders_count}
                      </Link>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(customer.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Adicionar/Editar Cliente */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal()
            }
          }}
        >
          <div className="bg-[var(--color-bg-app)] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--color-bg-app)] border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingCustomer ? handleUpdateCustomer : handleSubmit} className="p-6 space-y-4">
              {/* Foto do Cliente */}
              {customerSettings.showPhoto && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <label className="cursor-pointer group">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                          {avatarPreview ? (
                            <>
                              <Image 
                                src={avatarPreview} 
                                alt="Preview" 
                                fill
                                className="object-cover" 
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                  <SwitchCamera className="w-5 h-5 text-gray-700" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <User className="w-12 h-12 text-gray-400 group-hover:text-gray-500 transition-colors" />
                              <div className="absolute inset-0 bg-gray-100 group-hover:bg-gray-200 transition-colors flex items-center justify-center">
                                <div className="flex flex-col items-center">
                                  <Camera className="w-6 h-6 text-gray-400" />
                                  <span className="text-xs text-gray-500 mt-1">Adicionar</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarPreview(null)
                            setFormData(prev => ({ ...prev, avatar: null }))
                          }}
                          className="absolute -top-1 -right-1 hover:scale-110 transition-transform"
                        >
                          <CircleX className="w-5 h-5 text-[#D67973] hover:text-[#C86561] transition-colors" />
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">JPG, PNG ou GIF (máx. 2MB)</p>
                      <p className="text-sm text-gray-400 mt-1">Clique na foto para alterar</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('name')}
                  className={`w-full px-3 py-2 border ${
                    touched.name && errors.name ? 'border-[#D67973]' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-colors bg-white`}
                  placeholder="Digite o nome"
                />
                {touched.name && errors.name && (
                  <p className="text-sm text-[#D67973] mt-1">{errors.name}</p>
                )}
              </div>

              {customerSettings.showCpfCnpj && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF/CNPJ
                  </label>
                  <input
                    type="text"
                    name="cpf_cnpj"
                    value={formData.cpf_cnpj}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('cpf_cnpj')}
                    maxLength={18}
                    className={`w-full px-3 py-2 border ${
                      touched.cpf_cnpj && errors.cpf_cnpj ? 'border-[#D67973]' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-colors bg-white`}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                  {touched.cpf_cnpj && errors.cpf_cnpj && (
                    <p className="text-sm text-[#D67973] mt-1">{errors.cpf_cnpj}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('phone')}
                  maxLength={15}
                  className={`w-full px-3 py-2 border ${
                    touched.phone && errors.phone ? 'border-[#D67973]' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-colors bg-white`}
                  placeholder="(00) 00000-0000"
                />
                {touched.phone && errors.phone && (
                  <p className="text-sm text-[#D67973] mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-3 py-2 border ${
                    touched.email && errors.email ? 'border-[#D67973]' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-colors bg-white`}
                  placeholder="cliente@email.com"
                />
                {touched.email && errors.email && (
                  <p className="text-sm text-[#D67973] mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-colors resize-none bg-white"
                  placeholder="Adicione observações sobre o cliente..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-outline-grey flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-success flex-1"
                >
                  {loading ? 'Salvando...' : (editingCustomer ? 'Atualizar' : 'Salvar Cliente')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes do Cliente */}
      {selectedCustomer && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCustomer(null)
            }
          }}
        >
          <div className="bg-[var(--color-snow)] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--color-snow)] border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Perfil do Cliente</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Avatar e Info Básica */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-melon)] to-[var(--color-clay-500)] flex items-center justify-center overflow-hidden relative">
                  {selectedCustomer.avatar_url ? (
                    <Image
                      src={selectedCustomer.avatar_url}
                      alt={selectedCustomer.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-sm text-gray-500">Cliente desde {formatDate(selectedCustomer.created_at)}</p>
                </div>
              </div>

              {/* Informações de Contato */}
              {(selectedCustomer.phone || selectedCustomer.email) ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Informações de Contato</h4>
                  <div className="space-y-2">
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Phone className="w-4 h-4 text-[var(--color-clay-500)]" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Mail className="w-4 h-4 text-[var(--color-clay-500)]" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Estatísticas */}
              {(selectedCustomer.orders_count && selectedCustomer.orders_count > 0) ? (
                <div className="bg-[var(--color-lavender-blush)] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-6 h-6 text-[var(--color-clay-500)]" />
                      <div>
                        <p className="text-sm text-gray-600">Total de Pedidos</p>
                        <p className="text-2xl font-bold text-[var(--color-clay-500)]">
                          {selectedCustomer.orders_count}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {(selectedCustomer.orders_count && selectedCustomer.orders_count > 0) ? (
                  <button className="btn-info flex-1">
                    Ver Pedidos
                  </button>
                ) : null}
                <button 
                  onClick={() => handleEditCustomer(selectedCustomer)}
                  className="btn-warning flex-1"
                >
                  Editar
                </button>
                <button 
                  onClick={() => {
                    setCustomerToDelete(selectedCustomer.id)
                    setDeleteDialogOpen(true)
                  }}
                  className="btn-outline-danger flex-1 flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
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
                Essa ação não pode ser desfeita. O cliente será permanentemente excluído do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-outline-grey">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="btn-danger flex items-center gap-2"
              onClick={() => customerToDelete && handleDeleteCustomer(customerToDelete)}
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
