'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, Tag, FolderOpen, CircleDot, Eye } from 'lucide-react'
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

const DEFAULT_STATUSES: Status[] = [
  { id: 'pending', name: 'Pendente', color: 'yellow' },
  { id: 'in-progress', name: 'Em Andamento', color: 'blue' },
  { id: 'completed', name: 'Concluído', color: 'green' },
]

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Bolos', color: 'pink' },
  { id: '2', name: 'Doces', color: 'purple' },
  { id: '3', name: 'Salgados', color: 'orange' },
]

const DEFAULT_TAGS: TagItem[] = [
  { id: '1', name: 'Urgente', color: 'red' },
  { id: '2', name: 'Personalizado', color: 'blue' },
  { id: '3', name: 'Festa', color: 'yellow' },
  { id: '4', name: 'Aniversário', color: 'green' },
]

export default function OrdersSettingsPage() {
  const isInitialMount = useRef(true)
  
  const [statuses, setStatuses] = useState<Status[]>(DEFAULT_STATUSES)
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [tags, setTags] = useState<TagItem[]>(DEFAULT_TAGS)
  const [defaultView, setDefaultView] = useState<'list' | 'day' | 'week' | 'month'>('list')
  const [savedDefaultView, setSavedDefaultView] = useState<'list' | 'day' | 'week' | 'month'>('list')
  const [dateFormat, setDateFormat] = useState<'short' | 'numeric' | 'long'>('numeric')
  const [savedDateFormat, setSavedDateFormat] = useState<'short' | 'numeric' | 'long'>('numeric')
  const [menuPosition, setMenuPosition] = useState<'sidebar' | 'header' | 'footer'>('sidebar')
  const [savedMenuPosition, setSavedMenuPosition] = useState<'sidebar' | 'header' | 'footer'>('sidebar')

  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('blue')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('pink')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('blue')

  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)

  // Carregar dados do localStorage apenas uma vez ao montar
  useEffect(() => {
    const savedStatuses = localStorage.getItem('orderStatuses')
    const savedCategories = localStorage.getItem('orderCategories')
    const savedTags = localStorage.getItem('orderTags')
    const savedDefaultView = localStorage.getItem('ordersDefaultView')
    const savedDateFormat = localStorage.getItem('ordersDateFormat')
    const savedMenuPosition = localStorage.getItem('menuPosition')

    /* eslint-disable */
    if (savedStatuses) setStatuses(JSON.parse(savedStatuses))
    if (savedCategories) setCategories(JSON.parse(savedCategories))
    if (savedTags) setTags(JSON.parse(savedTags))
    if (savedDefaultView) {
      setDefaultView(savedDefaultView as 'list' | 'day' | 'week' | 'month')
      setSavedDefaultView(savedDefaultView as 'list' | 'day' | 'week' | 'month')
    }
    if (savedDateFormat) {
      setDateFormat(savedDateFormat as 'short' | 'numeric' | 'long')
      setSavedDateFormat(savedDateFormat as 'short' | 'numeric' | 'long')
    }
    if (savedMenuPosition) {
      setMenuPosition(savedMenuPosition as 'sidebar' | 'header' | 'footer')
      setSavedMenuPosition(savedMenuPosition as 'sidebar' | 'header' | 'footer')
    }
    /* eslint-enable */
    
    isInitialMount.current = false
  }, [])

  // Salvar statuses no localStorage (pular primeira renderização)
  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem('orderStatuses', JSON.stringify(statuses))
    }
  }, [statuses])

  // Salvar categories no localStorage (pular primeira renderização)
  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem('orderCategories', JSON.stringify(categories))
    }
  }, [categories])

  // Salvar tags no localStorage (pular primeira renderização)
  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem('orderTags', JSON.stringify(tags))
    }
  }, [tags])

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

  const addStatus = () => {
    if (!newStatusName.trim()) return
    
    if (editingStatusId) {
      // Atualizar status existente
      setStatuses(statuses.map(s => 
        s.id === editingStatusId 
          ? { ...s, name: newStatusName, color: newStatusColor }
          : s
      ))
      setEditingStatusId(null)
    } else {
      // Adicionar novo status
      const newStatus: Status = {
        id: Date.now().toString(),
        name: newStatusName,
        color: newStatusColor,
      }
      setStatuses([...statuses, newStatus])
    }
    
    setNewStatusName('')
    setNewStatusColor('blue')
  }

  const editStatus = (status: Status) => {
    setEditingStatusId(status.id)
    setNewStatusName(status.name)
    setNewStatusColor(status.color)
  }

  const removeStatus = (id: string) => {
    setStatuses(statuses.filter(s => s.id !== id))
  }

  const addCategory = () => {
    if (!newCategoryName.trim()) return
    
    if (editingCategoryId) {
      // Atualizar categoria existente
      setCategories(categories.map(c => 
        c.id === editingCategoryId 
          ? { ...c, name: newCategoryName, color: newCategoryColor }
          : c
      ))
      setEditingCategoryId(null)
    } else {
      // Adicionar nova categoria
      const newCategory: Category = {
        id: Date.now().toString(),
        name: newCategoryName,
        color: newCategoryColor,
      }
      setCategories([...categories, newCategory])
    }
    
    setNewCategoryName('')
    setNewCategoryColor('pink')
  }

  const editCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setNewCategoryName(category.name)
    setNewCategoryColor(category.color)
  }

  const removeCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id))
  }

  const addTag = () => {
    if (!newTagName.trim()) return
    
    if (editingTagId) {
      // Atualizar tag existente
      setTags(tags.map(t => 
        t.id === editingTagId 
          ? { ...t, name: newTagName, color: newTagColor }
          : t
      ))
      setEditingTagId(null)
    } else {
      // Adicionar nova tag
      const newTag: TagItem = {
        id: Date.now().toString(),
        name: newTagName,
        color: newTagColor,
      }
      setTags([...tags, newTag])
    }
    
    setNewTagName('')
    setNewTagColor('blue')
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

      {/* Posição do Menu */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Posição do Menu</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Escolha onde deseja visualizar o menu de navegação principal.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="menuPosition"
                value="sidebar"
                checked={menuPosition === 'sidebar'}
                onChange={(e) => setMenuPosition(e.target.value as 'sidebar' | 'header' | 'footer')}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-900">Lateral (Sidebar)</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="menuPosition"
                value="header"
                checked={menuPosition === 'header'}
                onChange={(e) => setMenuPosition(e.target.value as 'sidebar' | 'header' | 'footer')}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-900">Topo (Header)</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="menuPosition"
                value="footer"
                checked={menuPosition === 'footer'}
                onChange={(e) => setMenuPosition(e.target.value as 'sidebar' | 'header' | 'footer')}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm font-medium text-gray-900">Rodapé (Footer)</span>
            </label>

            {menuPosition !== savedMenuPosition && (
              <button 
                onClick={() => {
                  localStorage.setItem('menuPosition', menuPosition)
                  setSavedMenuPosition(menuPosition)
                  
                  // Disparar evento para atualizar o layout imediatamente
                  const event = new CustomEvent('menu-position-changed', {
                    detail: { position: menuPosition }
                  })
                  window.dispatchEvent(event)
                  
                  const positionLabels = {
                    sidebar: 'Lateral (Sidebar)',
                    header: 'Topo (Header)',
                    footer: 'Rodapé (Footer)'
                  }
                  showToast({
                    title: 'Preferência salva!',
                    message: `Menu posicionado em: ${positionLabels[menuPosition]}`,
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getColorClass(status.color)} cursor-pointer hover:opacity-80 transition-opacity`}
            >
              <span 
                className="text-sm font-medium"
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
                <X className="w-3.5 h-3.5" />
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
                  className="btn-outline-grey"
                >
                  Cancelar
                </button>
              )}
              <button onClick={addStatus} className="btn-success">
                <Plus className="w-4 h-4 mr-2" />
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getColorClass(category.color)} cursor-pointer hover:opacity-80 transition-opacity`}
            >
              <span 
                className="text-sm font-medium"
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
                <X className="w-3.5 h-3.5" />
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
                  className="btn-outline-grey"
                >
                  Cancelar
                </button>
              )}
              <button onClick={addCategory} className="btn-success">
                <Plus className="w-4 h-4 mr-2" />
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getColorClass(tag.color)} cursor-pointer hover:opacity-80 transition-opacity`}
            >
              <span 
                className="text-sm font-medium"
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
                <X className="w-3.5 h-3.5" />
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
                  className="btn-outline-grey"
                >
                  Cancelar
                </button>
              )}
              <button onClick={addTag} className="btn-success">
                <Plus className="w-4 h-4 mr-2" />
                {editingTagId ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
