'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, Tag, FolderOpen, CircleDot, Eye, Check } from 'lucide-react'
import { showToast } from '@/app/(dashboard)/layout'

interface Status {
  id: string
  name: string
  color: string
}

interface Category {
  id: string
  name: string
  color: string
}

interface TagItem {
  id: string
  name: string
  color: string
}

export default function AgendaSettingsPage() {
  // Carregar preferências do localStorage durante a inicialização
  const [defaultView, setDefaultView] = useState<'list' | 'kanban' | 'day' | 'week' | 'month'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agendaDefaultView')
      return (saved as 'list' | 'kanban' | 'day' | 'week' | 'month') || 'list'
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
  
  const [showOrdersInAgenda, setShowOrdersInAgenda] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showOrdersInAgenda')
      return saved === 'true'
    }
    return false
  })
  
  const [statuses, setStatuses] = useState<Status[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<TagItem[]>([])

  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('blue')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('blue')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('blue')

  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)

  // Carregar dados do banco de dados
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statusesRes, categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/agenda/statuses'),
          fetch('/api/agenda/categories'),
          fetch('/api/agenda/tags')
        ])

        if (statusesRes.ok) {
          const statusesData = await statusesRes.json()
          setStatuses(statusesData)
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData)
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json()
          setTags(tagsData)
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }

    loadData()
  }, [])

  const toggleShowOrdersInAgenda = () => {
    const newValue = !showOrdersInAgenda
    setShowOrdersInAgenda(newValue)
    localStorage.setItem('showOrdersInAgenda', String(newValue))
    
    // Disparar evento customizado para outras abas/componentes
    window.dispatchEvent(new CustomEvent('showOrdersInAgendaChanged', { detail: newValue }))
    
    showToast({
      title: newValue ? 'Pedidos ativados!' : 'Pedidos desativados!',
      message: newValue 
        ? 'Os pedidos agora serão exibidos na agenda junto com as tarefas'
        : 'Os pedidos não serão mais exibidos na agenda',
      variant: 'success',
      duration: 3000,
    })
  }

  const colors = [
    { name: 'pink', label: 'Rosa', class: 'bg-pink-100 text-pink-800 border-pink-200' },
    { name: 'purple', label: 'Roxo', class: 'bg-purple-100 text-purple-800 border-purple-200' },
    { name: 'blue', label: 'Azul', class: 'bg-blue-100 text-blue-800 border-blue-200' },
    { name: 'green', label: 'Verde', class: 'bg-green-100 text-green-800 border-green-200' },
    { name: 'yellow', label: 'Amarelo', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { name: 'orange', label: 'Laranja', class: 'bg-orange-100 text-orange-800 border-orange-200' },
    { name: 'red', label: 'Vermelho', class: 'bg-red-100 text-red-800 border-red-200' },
    { name: 'gray', label: 'Cinza', class: 'bg-gray-100 text-gray-800 border-gray-200' },
  ]

  const getColorClass = (color: string) => {
    return colors.find(c => c.name === color)?.class || 'bg-gray-100 text-gray-800'
  }

  const addStatus = async () => {
    if (!newStatusName.trim()) return
    
    try {
      if (editingStatusId) {
        // Atualizar status existente
        const response = await fetch(`/api/agenda/statuses?id=${editingStatusId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newStatusName, color: newStatusColor }),
        })

        if (response.ok) {
          const updatedStatus = await response.json()
          setStatuses(statuses.map(s => s.id === editingStatusId ? updatedStatus : s))
          showToast({
            title: 'Status atualizado!',
            message: `${updatedStatus.name} foi atualizado com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
          setEditingStatusId(null)
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao atualizar status')
        }
      } else {
        // Adicionar novo status
        const response = await fetch('/api/agenda/statuses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newStatusName, color: newStatusColor }),
        })

        if (response.ok) {
          const newStatus = await response.json()
          setStatuses([...statuses, newStatus])
          showToast({
            title: 'Status criado!',
            message: `${newStatus.name} foi adicionado com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao criar status')
        }
      }
      
      setNewStatusName('')
      setNewStatusColor('blue')
    } catch (error) {
      console.error('Erro ao salvar status:', error)
      showToast({
        title: 'Erro ao salvar status',
        message: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    }
  }

  const editStatus = (status: Status) => {
    setEditingStatusId(status.id)
    setNewStatusName(status.name)
    setNewStatusColor(status.color)
  }

  const removeStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/agenda/statuses?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setStatuses(statuses.filter(s => s.id !== id))
        showToast({
          title: 'Status excluído!',
          message: 'O status foi excluído com sucesso.',
          variant: 'success',
          duration: 3000,
        })
      } else {
        throw new Error('Erro ao deletar status')
      }
    } catch (error) {
      console.error('Erro ao deletar status:', error)
      showToast({
        title: 'Erro ao excluir status',
        message: 'Não foi possível excluir o status. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    }
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) return
    
    try {
      if (editingCategoryId) {
        // Atualizar categoria existente
        const response = await fetch(`/api/agenda/categories?id=${editingCategoryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
        })

        if (response.ok) {
          const updatedCategory = await response.json()
          setCategories(categories.map(c => c.id === editingCategoryId ? updatedCategory : c))
          showToast({
            title: 'Categoria atualizada!',
            message: `${updatedCategory.name} foi atualizada com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
          setEditingCategoryId(null)
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao atualizar categoria')
        }
      } else {
        // Adicionar nova categoria
        const response = await fetch('/api/agenda/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
        })

        if (response.ok) {
          const newCategory = await response.json()
          setCategories([...categories, newCategory])
          showToast({
            title: 'Categoria criada!',
            message: `${newCategory.name} foi adicionada com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao criar categoria')
        }
      }
      
      setNewCategoryName('')
      setNewCategoryColor('blue')
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      showToast({
        title: 'Erro ao salvar categoria',
        message: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    }
  }

  const editCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setNewCategoryName(category.name)
    setNewCategoryColor(category.color)
  }

  const removeCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/agenda/categories?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCategories(categories.filter(c => c.id !== id))
        showToast({
          title: 'Categoria excluída!',
          message: 'A categoria foi excluída com sucesso.',
          variant: 'success',
          duration: 3000,
        })
      } else {
        throw new Error('Erro ao deletar categoria')
      }
    } catch (error) {
      console.error('Erro ao deletar categoria:', error)
      showToast({
        title: 'Erro ao excluir categoria',
        message: 'Não foi possível excluir a categoria. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    }
  }

  const addTag = async () => {
    if (!newTagName.trim()) return
    
    try {
      if (editingTagId) {
        // Atualizar tag existente
        const response = await fetch(`/api/agenda/tags?id=${editingTagId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newTagName, color: newTagColor }),
        })

        if (response.ok) {
          const updatedTag = await response.json()
          setTags(tags.map(t => t.id === editingTagId ? updatedTag : t))
          showToast({
            title: 'Tag atualizada!',
            message: `${updatedTag.name} foi atualizada com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
          setEditingTagId(null)
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao atualizar tag')
        }
      } else {
        // Adicionar nova tag
        const response = await fetch('/api/agenda/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newTagName, color: newTagColor }),
        })

        if (response.ok) {
          const newTag = await response.json()
          setTags([...tags, newTag])
          showToast({
            title: 'Tag criada!',
            message: `${newTag.name} foi adicionada com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao criar tag')
        }
      }
      
      setNewTagName('')
      setNewTagColor('blue')
    } catch (error) {
      console.error('Erro ao salvar tag:', error)
      showToast({
        title: 'Erro ao salvar tag',
        message: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    }
  }

  const editTag = (tag: TagItem) => {
    setEditingTagId(tag.id)
    setNewTagName(tag.name)
    setNewTagColor(tag.color)
  }

  const removeTag = (id: string) => {
    setTags(tags.filter(t => t.id !== id))
  }

  // Gerar exemplos de formato de data com o dia atual
  const getDateExamples = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    const shortYear = String(year).slice(-2)
    const monthName = today.toLocaleDateString('pt-BR', { month: 'long' })
    
    return {
      short: `${day}/${month}/${shortYear}`,
      numeric: `${day}/${month}/${year}`,
      long: `${day} de ${monthName} de ${year}`
    }
  }

  const dateExamples = getDateExamples()

  return (
    <div className="space-y-6">
      {/* Visualização */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Visualização</h2>
        </div>

        {/* Visualização Padrão */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Visualização padrão</h3>
          <p className="text-sm text-gray-600 mb-4">
            Defina qual será a visualização padrão ao abrir a página de agenda.
          </p>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="defaultView"
                value="list"
                checked={defaultView === 'list'}
                onChange={(e) => {
                  const newView = e.target.value as 'list' | 'kanban' | 'day' | 'week' | 'month'
                  setDefaultView(newView)
                  localStorage.setItem('agendaDefaultView', newView)
                  showToast({
                    title: 'Preferência salva!',
                    message: 'Visualização padrão alterada para Lista',
                    variant: 'success',
                    duration: 3000,
                  })
                }}
                className="w-4 h-4 text-[#BE9089] focus:ring-[#BE9089]"
              />
              <span className="text-sm font-medium text-gray-900">Lista</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="defaultView"
                value="kanban"
                checked={defaultView === 'kanban'}
                onChange={(e) => {
                  const newView = e.target.value as 'list' | 'kanban' | 'day' | 'week' | 'month'
                  setDefaultView(newView)
                  localStorage.setItem('agendaDefaultView', newView)
                  showToast({
                    title: 'Preferência salva!',
                    message: 'Visualização padrão alterada para Kanban',
                    variant: 'success',
                    duration: 3000,
                  })
                }}
                className="w-4 h-4 text-[#BE9089] focus:ring-[#BE9089]"
              />
              <span className="text-sm font-medium text-gray-900">Kanban</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="defaultView"
                value="day"
                checked={defaultView === 'day'}
                onChange={(e) => {
                  const newView = e.target.value as 'list' | 'kanban' | 'day' | 'week' | 'month'
                  setDefaultView(newView)
                  localStorage.setItem('agendaDefaultView', newView)
                  showToast({
                    title: 'Preferência salva!',
                    message: 'Visualização padrão alterada para Dia',
                    variant: 'success',
                    duration: 3000,
                  })
                }}
                className="w-4 h-4 text-[#BE9089] focus:ring-[#BE9089]"
              />
              <span className="text-sm font-medium text-gray-900">Dia</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="defaultView"
                value="week"
                checked={defaultView === 'week'}
                onChange={(e) => {
                  const newView = e.target.value as 'list' | 'kanban' | 'day' | 'week' | 'month'
                  setDefaultView(newView)
                  localStorage.setItem('agendaDefaultView', newView)
                  showToast({
                    title: 'Preferência salva!',
                    message: 'Visualização padrão alterada para Semana',
                    variant: 'success',
                    duration: 3000,
                  })
                }}
                className="w-4 h-4 text-[#BE9089] focus:ring-[#BE9089]"
              />
              <span className="text-sm font-medium text-gray-900">Semana</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="defaultView"
                value="month"
                checked={defaultView === 'month'}
                onChange={(e) => {
                  const newView = e.target.value as 'list' | 'kanban' | 'day' | 'week' | 'month'
                  setDefaultView(newView)
                  localStorage.setItem('agendaDefaultView', newView)
                  showToast({
                    title: 'Preferência salva!',
                    message: 'Visualização padrão alterada para Mês',
                    variant: 'success',
                    duration: 3000,
                  })
                }}
                className="w-4 h-4 text-[#BE9089] focus:ring-[#BE9089]"
              />
              <span className="text-sm font-medium text-gray-900">Mês</span>
            </label>
          </div>
        </div>

        {/* Mostrar Pedidos na Agenda */}
        <div className="mb-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Mostrar pedidos na agenda</h3>
              <p className="text-sm text-gray-600">
                Exibe os pedidos junto com as tarefas para uma visão completa das demandas do dia
              </p>
            </div>
            <button
              onClick={toggleShowOrdersInAgenda}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#BE9089] focus:ring-offset-2 ${
                showOrdersInAgenda ? 'bg-[#BE9089]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showOrdersInAgenda ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Formato de Data */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Formato de data</h3>
          <p className="text-sm text-gray-600 mb-4">
            Escolha como deseja visualizar as datas nos calendários e navegação.
          </p>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="dateFormat"
                value="short"
                checked={dateFormat === 'short'}
                onChange={(e) => {
                  const newFormat = e.target.value as 'short' | 'numeric' | 'long'
                  setDateFormat(newFormat)
                  localStorage.setItem('agendaDateFormat', newFormat)
                  showToast({
                    title: 'Preferência salva!',
                    message: `Formato alterado para ${getDateExamples()[newFormat]}`,
                    variant: 'success',
                    duration: 3000,
                  })
                }}
                className="w-4 h-4 text-[#BE9089] focus:ring-[#BE9089]"
              />
              <span className="text-sm font-medium text-gray-900">{dateExamples.short}</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="dateFormat"
                value="numeric"
                checked={dateFormat === 'numeric'}
                onChange={(e) => {
                  const newFormat = e.target.value as 'short' | 'numeric' | 'long'
                  setDateFormat(newFormat)
                  localStorage.setItem('agendaDateFormat', newFormat)
                  showToast({
                    title: 'Preferência salva!',
                    message: `Formato alterado para ${getDateExamples()[newFormat]}`,
                    variant: 'success',
                    duration: 3000,
                  })
                }}
                className="w-4 h-4 text-[#BE9089] focus:ring-[#BE9089]"
              />
              <span className="text-sm font-medium text-gray-900">{dateExamples.numeric}</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="dateFormat"
                value="long"
                checked={dateFormat === 'long'}
                onChange={(e) => {
                  const newFormat = e.target.value as 'short' | 'numeric' | 'long'
                  setDateFormat(newFormat)
                  localStorage.setItem('agendaDateFormat', newFormat)
                  showToast({
                    title: 'Preferência salva!',
                    message: `Formato alterado para ${getDateExamples()[newFormat]}`,
                    variant: 'success',
                    duration: 3000,
                  })
                }}
                className="w-4 h-4 text-[#BE9089] focus:ring-[#BE9089]"
              />
              <span className="text-sm font-medium text-gray-900">{dateExamples.long}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CircleDot className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Status</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Defina os status para acompanhar o andamento das suas tarefas na agenda.
        </p>

        {/* Lista de Status */}
        <div className="flex flex-wrap gap-2 mb-6">
          {statuses.map(status => (
            <div
              key={status.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getColorClass(status.color)} cursor-pointer hover:opacity-80 transition-opacity`}
            >
              <span 
                className="text-xs font-medium"
                onClick={() => editStatus(status)}
              >
                {status.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeStatus(status.id)
                }}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar/Editar Status */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {editingStatusId ? 'Editar Status' : 'Adicionar Novo Status'}
          </h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="statusName">Nome</Label>
              <Input
                id="statusName"
                placeholder="Ex: Em Análise, Aguardando..."
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addStatus()}
              />
            </div>
            <div className="w-40">
              <Label htmlFor="statusColor">Cor</Label>
              <select
                id="statusColor"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#BE9089]"
              >
                {colors.map(color => (
                  <option key={color.name} value={color.name}>
                    {color.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              {editingStatusId && (
                <button 
                  onClick={() => {
                    setEditingStatusId(null)
                    setNewStatusName('')
                    setNewStatusColor('blue')
                  }} 
                  className="btn-outline-grey relative top-[-2px]"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={addStatus} 
                className="btn-success relative top-[-2px]"
                disabled={!newStatusName.trim() || statuses.some(s => s.name.toLowerCase() === newStatusName.trim().toLowerCase() && s.id !== editingStatusId)}
              >
                {editingStatusId ? <Check className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                {editingStatusId ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Organize suas tarefas por categorias para facilitar a visualização e filtragem.
        </p>

        {/* Lista de Categorias */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(category => (
            <div
              key={category.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getColorClass(category.color)} cursor-pointer hover:opacity-80 transition-opacity`}
            >
              <span 
                className="text-xs font-medium"
                onClick={() => editCategory(category)}
              >
                {category.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeCategory(category.id)
                }}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar/Editar Categoria */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {editingCategoryId ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
          </h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="categoryName">Nome</Label>
              <Input
                id="categoryName"
                placeholder="Ex: Reunião, Entrega, Produção..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
            </div>
            <div className="w-40">
              <Label htmlFor="categoryColor">Cor</Label>
              <select
                id="categoryColor"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#BE9089]"
              >
                {colors.map(color => (
                  <option key={color.name} value={color.name}>
                    {color.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              {editingCategoryId && (
                <button 
                  onClick={() => {
                    setEditingCategoryId(null)
                    setNewCategoryName('')
                    setNewCategoryColor('blue')
                  }} 
                  className="btn-outline-grey relative top-[-2px]"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={addCategory} 
                className="btn-success relative top-[-2px]"
                disabled={!newCategoryName.trim() || categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase() && c.id !== editingCategoryId)}
              >
                {editingCategoryId ? <Check className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                {editingCategoryId ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Crie tags para adicionar informações extras às tarefas, como prioridade ou tipo de atividade.
        </p>

        {/* Lista de Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map(tag => (
            <div
              key={tag.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getColorClass(tag.color)} cursor-pointer hover:opacity-80 transition-opacity`}
            >
              <span 
                className="text-xs font-medium"
                onClick={() => editTag(tag)}
              >
                {tag.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag.id)
                }}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar/Editar Tag */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {editingTagId ? 'Editar Tag' : 'Adicionar Nova Tag'}
          </h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="tagName">Nome</Label>
              <Input
                id="tagName"
                placeholder="Ex: Urgente, Importante, Recorrente..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
            </div>
            <div className="w-40">
              <Label htmlFor="tagColor">Cor</Label>
              <select
                id="tagColor"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#BE9089]"
              >
                {colors.map(color => (
                  <option key={color.name} value={color.name}>
                    {color.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              {editingTagId && (
                <button 
                  onClick={() => {
                    setEditingTagId(null)
                    setNewTagName('')
                    setNewTagColor('blue')
                  }} 
                  className="btn-outline-grey relative top-[-2px]"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={addTag} 
                className="btn-success relative top-[-2px]"
                disabled={!newTagName.trim() || tags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase() && t.id !== editingTagId)}
              >
                {editingTagId ? <Check className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                {editingTagId ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
