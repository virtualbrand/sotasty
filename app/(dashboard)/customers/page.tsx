'use client'

import { useState, useEffect } from 'react'
import { User, Phone, Mail, ShoppingBag, X, Search, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'

type Customer = {
  id: string
  name: string
  phone: string
  email: string
  created_at: string
  orders_count?: number
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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    email: false
  })
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    email: ''
  })

  // Mock data para demonstração
  useEffect(() => {
    fetchCustomers()
  }, [])

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

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false)
          setFormData({ name: '', phone: '', email: '' })
          setTouched({ name: false, phone: false, email: false })
          setErrors({ name: '', phone: '', email: '' })
        }
        if (selectedCustomer) {
          setSelectedCustomer(null)
        }
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isModalOpen, selectedCustomer])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'phone') {
      const formatted = formatPhone(value)
      setFormData(prev => ({ ...prev, [name]: formatted }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Validação em tempo real após o campo ser tocado
    if (touched[name as keyof typeof touched]) {
      validateField(name, name === 'phone' ? formatPhone(value) : value)
    }
  }

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    validateField(fieldName, formData[fieldName as keyof typeof formData])
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
        if (!phoneDigits) {
          error = 'Telefone é obrigatório'
        } else if (phoneDigits.length < 10) {
          error = 'Telefone inválido'
        }
        break
      case 'email':
        if (!value.trim()) {
          error = 'E-mail é obrigatório'
        } else if (!validateEmail(value)) {
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
    
    setTouched({ name: true, phone: true, email: true })
    
    return nameValid && phoneValid && emailValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to create customer')

      const newCustomer = await response.json()
      
      // Adicionar orders_count ao novo cliente
      const customerWithCount = {
        ...newCustomer,
        orders_count: 0
      }

      setCustomers(prev => [customerWithCount, ...prev])
      setIsModalOpen(false)
      setFormData({ name: '', phone: '', email: '' })
      setTouched({ name: false, phone: false, email: false })
      setErrors({ name: '', phone: '', email: '' })
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      alert('Erro ao criar cliente. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditCustomer = async (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email
    })
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
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCustomer.id,
          ...formData
        }),
      })

      if (!response.ok) throw new Error('Failed to update customer')

      const updatedCustomer = await response.json()
      
      setCustomers(prev => prev.map(c => 
        c.id === updatedCustomer.id 
          ? { ...updatedCustomer, orders_count: c.orders_count }
          : c
      ))
      
      setIsModalOpen(false)
      setEditingCustomer(null)
      setFormData({ name: '', phone: '', email: '' })
      setTouched({ name: false, phone: false, email: false })
      setErrors({ name: '', phone: '', email: '' })
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      alert('Erro ao atualizar cliente. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return
    }

    try {
      const response = await fetch(`/api/customers?id=${customerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete customer')

      setCustomers(prev => prev.filter(c => c.id !== customerId))
      setSelectedCustomer(null)
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      alert('Erro ao excluir cliente. Tente novamente.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Filtrar clientes pela busca
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  )

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <div className="group relative">
            <Info className="w-5 h-5 text-gray-400 cursor-help" />
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
              Gerencie sua base de clientes. Cadastre novos clientes, edite informações de contato e acompanhe o histórico de pedidos de cada um.
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-old-rose)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--color-rosy-brown)] transition font-semibold"
        >
          + Novo Cliente
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-[var(--color-snow)] rounded-xl border border-gray-200 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            {searchQuery ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado. Clique em "+ Novo Cliente" para começar.'}
          </p>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="p-6 hover:bg-[var(--color-lavender-blush)] transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-melon)] to-[var(--color-old-rose)] flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-[var(--color-old-rose)] font-semibold">
                      <ShoppingBag className="w-4 h-4" />
                      {customer.orders_count} pedidos
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block">
                      Cliente desde {formatDate(customer.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Adicionar/Editar Cliente */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false)
              setEditingCustomer(null)
              setFormData({ name: '', phone: '', email: '' })
              setTouched({ name: false, phone: false, email: false })
              setErrors({ name: '', phone: '', email: '' })
            }
          }}
        >
          <div className="bg-[var(--color-snow)] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--color-snow)] border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingCustomer(null)
                  setFormData({ name: '', phone: '', email: '' })
                  setTouched({ name: false, phone: false, email: false })
                  setErrors({ name: '', phone: '', email: '' })
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingCustomer ? handleUpdateCustomer : handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('name')}
                  className={`w-full px-3 py-2 border ${
                    touched.name && errors.name ? 'border-[#D67973]' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-colors`}
                  placeholder="Digite o nome completo"
                />
                {touched.name && errors.name && (
                  <p className="text-sm text-[#D67973] mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
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
                  } rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-colors`}
                  placeholder="(00) 00000-0000"
                />
                {touched.phone && errors.phone && (
                  <p className="text-sm text-[#D67973] mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-3 py-2 border ${
                    touched.email && errors.email ? 'border-[#D67973]' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-colors`}
                  placeholder="cliente@email.com"
                />
                {touched.email && errors.email && (
                  <p className="text-sm text-[#D67973] mt-1">{errors.email}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingCustomer(null)
                    setFormData({ name: '', phone: '', email: '' })
                    setTouched({ name: false, phone: false, email: false })
                    setErrors({ name: '', phone: '', email: '' })
                  }}
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
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-melon)] to-[var(--color-old-rose)] flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-sm text-gray-500">Cliente desde {formatDate(selectedCustomer.created_at)}</p>
                </div>
              </div>

              {/* Informações de Contato */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Informações de Contato</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="w-4 h-4 text-[var(--color-old-rose)]" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="w-4 h-4 text-[var(--color-old-rose)]" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="bg-[var(--color-lavender-blush)] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-[var(--color-old-rose)]" />
                    <div>
                      <p className="text-sm text-gray-600">Total de Pedidos</p>
                      <p className="text-2xl font-bold text-[var(--color-old-rose)]">
                        {selectedCustomer.orders_count || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="btn-info flex-1">
                  Ver Pedidos
                </button>
                <button 
                  onClick={() => handleEditCustomer(selectedCustomer)}
                  className="btn-warning flex-1"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                  className="btn-danger flex-1"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
