'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, X, Tag, FolderOpen, CircleDot, Eye, Check, FileText } from 'lucide-react'
import { showToast } from '@/app/(dashboard)/layout'
import { ActivitySettings } from '@/lib/activityLogger'

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

export default function OrdersSettingsPage() {
  // Carregar preferências do localStorage durante a inicialização
  const [defaultView, setDefaultView] = useState<'list' | 'day' | 'week' | 'month'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ordersDefaultView')
      return (saved as 'list' | 'day' | 'week' | 'month') || 'list'
    }
    return 'list'
  })
  
  const [savedDefaultView, setSavedDefaultView] = useState<'list' | 'day' | 'week' | 'month'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ordersDefaultView')
      return (saved as 'list' | 'day' | 'week' | 'month') || 'list'
    }
    return 'list'
  })
  
  const [dateFormat, setDateFormat] = useState<'short' | 'numeric' | 'long'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ordersDateFormat')
      return (saved as 'short' | 'numeric' | 'long') || 'numeric'
    }
    return 'numeric'
  })
  
  const [savedDateFormat, setSavedDateFormat] = useState<'short' | 'numeric' | 'long'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ordersDateFormat')
      return (saved as 'short' | 'numeric' | 'long') || 'numeric'
    }
    return 'numeric'
  })

  const [statuses, setStatuses] = useState<Status[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<TagItem[]>([])

  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('blue')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('pink')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('blue')

  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)

  // Configuração de título alternativo
  const [enableAlternativeTitle, setEnableAlternativeTitle] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ordersEnableAlternativeTitle')
      return saved === 'true'
    }
    return false
  })

  // Carregar dados do banco de dados
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch('/api/orders/statuses')
        if (response.ok) {
          const data = await response.json()
          setStatuses(data)
        }
      } catch (error) {
        console.error('Erro ao carregar status:', error)
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/orders/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      }
    }

    const fetchTags = async () => {
      try {
        const response = await fetch('/api/orders/tags')
        if (response.ok) {
          const data = await response.json()
          setTags(data)
        }
      } catch (error) {
        console.error('Erro ao carregar tags:', error)
      }
    }

    fetchStatuses()
    fetchCategories()
    fetchTags()
  }, [])

  const saveDefaultView = () => {
    localStorage.setItem('ordersDefaultView', defaultView)
    setSavedDefaultView(defaultView)
    
    const viewNames = {
      list: 'Lista',
      day: 'Dia',
      week: 'Semana',
      month: 'Mês'
    }
    
    showToast({
      title: 'Preferência salva!',
      message: `Visualização padrão alterada para ${viewNames[defaultView]}`,
      variant: 'success',
      duration: 3000,
    })
  }

  const hasUnsavedChanges = defaultView !== savedDefaultView

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
        const response = await fetch(`/api/orders/statuses?id=${editingStatusId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newStatusName, color: newStatusColor }),
        })

        if (response.ok) {
          const updatedStatus = await response.json()
          setStatuses(statuses.map(s => s.id === editingStatusId ? updatedStatus : s))          
          setNewStatusName('')
          setNewStatusColor('blue')
          setEditingStatusId(null)
          
          // Registrar atividade
          const oldName = statuses.find(s => s.id === editingStatusId)?.name || ''
          await ActivitySettings.orderStatusUpdated(oldName, updatedStatus.name)
          
          showToast({
            title: 'Status atualizado!',
            message: `"${updatedStatus.name}" foi atualizado com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
        }
      } else {
        // Adicionar novo status
        const response = await fetch('/api/orders/statuses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newStatusName, color: newStatusColor }),
        })

        if (response.ok) {
          const newStatus = await response.json()
          setStatuses([...statuses, newStatus])
          setNewStatusName('')
          setNewStatusColor('blue')
          
          // Registrar atividade
          await ActivitySettings.orderStatusAdded(newStatus.name, newStatus.color)
          
          showToast({
            title: 'Status adicionado!',
            message: `"${newStatus.name}" foi adicionado com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
        } else if (response.status === 409) {
          showToast({
            title: 'Status já existe',
            message: 'Já existe um status com esse nome.',
            variant: 'error',
            duration: 3000,
          })
        }
      }
    } catch (error) {
      console.error('Erro ao salvar status:', error)
      showToast({
        title: 'Erro',
        message: 'Não foi possível salvar o status.',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  const editStatus = (status: Status) => {
    setEditingStatusId(status.id)
    setNewStatusName(status.name)
    setNewStatusColor(status.color)
  }

  const removeStatus = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/orders/statuses?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setStatuses(statuses.filter(s => s.id !== id))
        
        // Registrar atividade
        await ActivitySettings.orderStatusRemoved(name)
        
        showToast({
          title: 'Status removido!',
          message: `"${name}" foi removido com sucesso.`,
          variant: 'success',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Erro ao remover status:', error)
      showToast({
        title: 'Erro',
        message: 'Não foi possível remover o status.',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) return
    
    try {
      if (editingCategoryId) {
        // Atualizar categoria existente
        const response = await fetch(`/api/orders/categories?id=${editingCategoryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
        })

        if (response.ok) {
          const updatedCategory = await response.json()
          setCategories(categories.map(c => c.id === editingCategoryId ? updatedCategory : c))
          setNewCategoryName('')
          setNewCategoryColor('pink')
          setEditingCategoryId(null)
          
          // Registrar atividade
          const oldName = categories.find(c => c.id === editingCategoryId)?.name || ''
          await ActivitySettings.orderCategoryUpdated(oldName, updatedCategory.name)
          
          showToast({
            title: 'Categoria atualizada!',
            message: `"${updatedCategory.name}" foi atualizada com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
        }
      } else {
        // Adicionar nova categoria
        const response = await fetch('/api/orders/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
        })

        if (response.ok) {
          const newCategory = await response.json()
          setCategories([...categories, newCategory])
          setNewCategoryName('')
          setNewCategoryColor('pink')
          
          // Registrar atividade
          await ActivitySettings.orderCategoryAdded(newCategory.name)
          
          showToast({
            title: 'Categoria adicionada!',
            message: `"${newCategory.name}" foi adicionada com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
        } else if (response.status === 409) {
          showToast({
            title: 'Categoria já existe',
            message: 'Já existe uma categoria com esse nome.',
            variant: 'error',
            duration: 3000,
          })
        }
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      showToast({
        title: 'Erro',
        message: 'Não foi possível salvar a categoria.',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  const editCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setNewCategoryName(category.name)
    setNewCategoryColor(category.color)
  }

  const removeCategory = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/orders/categories?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCategories(categories.filter(c => c.id !== id))
        
        // Registrar atividade
        await ActivitySettings.orderCategoryRemoved(name)
        
        showToast({
          title: 'Categoria removida!',
          message: `"${name}" foi removida com sucesso.`,
          variant: 'success',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Erro ao remover categoria:', error)
      showToast({
        title: 'Erro',
        message: 'Não foi possível remover a categoria.',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  const addTag = async () => {
    if (!newTagName.trim()) return
    
    try {
      if (editingTagId) {
        // Atualizar tag existente
        const response = await fetch(`/api/orders/tags?id=${editingTagId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newTagName, color: newTagColor }),
        })

        if (response.ok) {
          const updatedTag = await response.json()
          setTags(tags.map(t => t.id === editingTagId ? updatedTag : t))
          setNewTagName('')
          setNewTagColor('blue')
          setEditingTagId(null)
          
          // Registrar atividade
          const oldName = tags.find(t => t.id === editingTagId)?.name || ''
          await ActivitySettings.orderTagUpdated(oldName, updatedTag.name)
          
          showToast({
            title: 'Tag atualizada!',
            message: `"${updatedTag.name}" foi atualizada com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
        }
      } else {
        // Adicionar nova tag
        const response = await fetch('/api/orders/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newTagName, color: newTagColor }),
        })

        if (response.ok) {
          const newTag = await response.json()
          setTags([...tags, newTag])
          setNewTagName('')
          setNewTagColor('blue')
          
          // Registrar atividade
          await ActivitySettings.orderTagAdded(newTag.name)
          
          showToast({
            title: 'Tag adicionada!',
            message: `"${newTag.name}" foi adicionada com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
        } else if (response.status === 409) {
          showToast({
            title: 'Tag já existe',
            message: 'Já existe uma tag com esse nome.',
            variant: 'error',
            duration: 3000,
          })
        }
      }
    } catch (error) {
      console.error('Erro ao salvar tag:', error)
      showToast({
        title: 'Erro',
        message: 'Não foi possível salvar a tag.',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  const editTag = (tag: TagItem) => {
    setEditingTagId(tag.id)
    setNewTagName(tag.name)
    setNewTagColor(tag.color)
  }

  const removeTag = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/orders/tags?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTags(tags.filter(t => t.id !== id))
        
        // Registrar atividade
        await ActivitySettings.orderTagRemoved(name)
        
        showToast({
          title: 'Tag removida!',
          message: `"${name}" foi removida com sucesso.`,
          variant: 'success',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Erro ao remover tag:', error)
      showToast({
        title: 'Erro',
        message: 'Não foi possível remover a tag.',
        variant: 'error',
        duration: 3000,
      })
    }
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

  const toggleAlternativeTitle = async () => {
    const newValue = !enableAlternativeTitle
    setEnableAlternativeTitle(newValue)
    localStorage.setItem('ordersEnableAlternativeTitle', String(newValue))
    
    // Registrar atividade
    await ActivitySettings.orderAlternativeTitleToggled(newValue)
    
    showToast({
      title: newValue ? 'Título alternativo habilitado!' : 'Título alternativo desabilitado!',
      message: newValue 
        ? 'O título alternativo será exibido quando preenchido nos pedidos.' 
        : 'O título padrão será exibido em todos os pedidos.',
      variant: 'success',
      duration: 3000,
    })
  }

  return (
    <div className="space-y-6">
      {/* Título Alternativo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Título Alternativo do Pedido</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Quando habilitado, permite adicionar um título personalizado aos pedidos. Se preenchido, o título será exibido no formato: "Título Alternativo - Cliente".
        </p>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">
              Habilitar título alternativo de pedido
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Adicione um campo extra no formulário de pedidos
            </p>
          </div>
          <Switch
            checked={enableAlternativeTitle}
            onCheckedChange={toggleAlternativeTitle}
          />
        </div>
      </div>

      {/* Visualização Padrão */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Visualização Padrão</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Defina qual será a visualização padrão ao abrir a página de pedidos.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="defaultView"
                value="list"
                checked={defaultView === 'list'}
                onChange={(e) => setDefaultView(e.target.value as 'list' | 'day' | 'week' | 'month')}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-900">Lista</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="defaultView"
                value="day"
                checked={defaultView === 'day'}
                onChange={(e) => setDefaultView(e.target.value as 'list' | 'day' | 'week' | 'month')}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-900">Dia</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="defaultView"
                value="week"
                checked={defaultView === 'week'}
                onChange={(e) => setDefaultView(e.target.value as 'list' | 'day' | 'week' | 'month')}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-900">Semana</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="defaultView"
                value="month"
                checked={defaultView === 'month'}
                onChange={(e) => setDefaultView(e.target.value as 'list' | 'day' | 'week' | 'month')}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-900">Mês</span>
            </label>

            {hasUnsavedChanges && (
              <button 
                onClick={saveDefaultView}
                className="btn-outline-success ml-4"
              >
                Salvar Alterações
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Formato de Data */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Formato de Data</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Escolha como deseja visualizar as datas nos calendários e navegação.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="dateFormat"
                value="short"
                checked={dateFormat === 'short'}
                onChange={(e) => setDateFormat(e.target.value as 'short' | 'numeric' | 'long')}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-900">{dateExamples.short}</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="dateFormat"
                value="numeric"
                checked={dateFormat === 'numeric'}
                onChange={(e) => setDateFormat(e.target.value as 'short' | 'numeric' | 'long')}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-900">{dateExamples.numeric}</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="dateFormat"
                value="long"
                checked={dateFormat === 'long'}
                onChange={(e) => setDateFormat(e.target.value as 'short' | 'numeric' | 'long')}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-900">{dateExamples.long}</span>
            </label>

            {dateFormat !== savedDateFormat && (
              <button 
                onClick={() => {
                  localStorage.setItem('ordersDateFormat', dateFormat)
                  setSavedDateFormat(dateFormat)
                  showToast({
                    title: 'Preferência salva!',
                    message: `Formato de data alterado para ${dateExamples[dateFormat]}`,
                    variant: 'success',
                    duration: 3000,
                  })
                }}
                className="btn-outline-success ml-4"
              >
                Salvar Alterações
              </button>
            )}
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
          Defina os status para acompanhar o andamento dos seus pedidos.
        </p>

        {/* Lista de Status */}
        <div className="flex flex-wrap gap-2 mb-6">
          {statuses.map(status => (
            <div
              key={status.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getColorClass(status.color)} cursor-pointer hover:opacity-80 transition-opacity`}
            >
              <span 
                className="text-xs font-medium cursor-pointer"
                onClick={() => editStatus(status)}
              >
                {status.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeStatus(status.id, status.name)
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
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                disabled={!newStatusName.trim()}
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
          Organize seus pedidos por categorias para facilitar a visualização e filtragem.
        </p>

        {/* Lista de Categorias */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(category => (
            <div
              key={category.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getColorClass(category.color)} cursor-pointer hover:opacity-80 transition-opacity`}
            >
              <span 
                className="text-xs font-medium cursor-pointer"
                onClick={() => editCategory(category)}
              >
                {category.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeCategory(category.id, category.name)
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
                placeholder="Ex: Bolos, Doces, Salgados..."
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
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                    setNewCategoryColor('pink')
                  }} 
                  className="btn-outline-grey relative top-[-2px]"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={addCategory} 
                className="btn-success relative top-[-2px]"
                disabled={!newCategoryName.trim()}
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
          Crie tags para adicionar informações extras aos pedidos, como prioridade ou tipo de evento.
        </p>

        {/* Lista de Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map(tag => (
            <div
              key={tag.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getColorClass(tag.color)} cursor-pointer hover:opacity-80 transition-opacity`}
            >
              <span 
                className="text-xs font-medium cursor-pointer"
                onClick={() => editTag(tag)}
              >
                {tag.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag.id, tag.name)
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
                placeholder="Ex: Urgente, Festa, Aniversário..."
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
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                disabled={!newTagName.trim()}
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
