'use client'

import { useState, useEffect, useRef } from 'react'
import Modal from '@/components/Modal'
import { Spinner } from '@/components/ui/spinner'
import { Info, Package, Layers, ShoppingBag, Search, ArrowDownAZ, ArrowDownZA, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProductSettings } from '@/hooks/useProductSettings'

// Função para formatar números no padrão brasileiro
const formatBRL = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// Função para formatar números inteiros (sem decimais)
const formatInteger = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

// Função para formatar input de volume (com separador de milhares, sem decimais)
const formatVolumeInput = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  if (!numbers) return ''
  
  // Converte para número e formata com separador de milhares
  const numberValue = parseFloat(numbers)
  
  // Verifica se é um número válido
  if (isNaN(numberValue)) return numbers
  
  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

// Função para formatar input de moeda (R$ com separador de milhares e 2 decimais)
const formatCurrencyInput = (value: string): string => {
  if (!value) return ''
  
  // Converte o valor string para número float
  const numericValue = parseFloat(value)
  
  if (isNaN(numericValue)) return ''
  
  return numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Função para abreviar unidades
const getUnitAbbreviation = (unit: string): string => {
  const abbreviations: { [key: string]: string } = {
    'gramas': 'g',
    'kg': 'kg',
    'quilogramas': 'kg',
    'ml': 'ml',
    'mililitros': 'ml',
    'litros': 'L',
    'unidades': 'un'
  }
  return abbreviations[unit.toLowerCase()] || unit
}

// Função para formatar números removendo zeros desnecessários
const formatSmartNumber = (value: number, maxDecimals: number = 5, isMonetary: boolean = false): string => {
  // Valida se o valor é um número válido
  if (typeof value !== 'number' || isNaN(value)) {
    return '0'
  }
  
  if (isMonetary) {
    // Para valores monetários
    const hasDecimals = value % 1 !== 0
    
    if (hasDecimals) {
      // Se tem decimais, mantém no mínimo 2 casas
      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: maxDecimals
      })
    } else {
      // Se é inteiro, não mostra decimais
      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    }
  } else {
    // Para valores não monetários (quantidades)
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals
    })
  }
}

type Ingredient = {
  id: string
  name: string
  volume: number
  unit: string
  average_cost: number
  unit_cost: number
  loss_factor: number
  type?: string // 'ingredientes' ou 'materiais'
}

type BaseRecipe = {
  id: string
  name: string
  description?: string
  loss_factor: number
  total_cost: number
  base_recipe_items?: any[]
}

type FinalProduct = {
  id: string
  name: string
  category: string
  description?: string
  loss_factor: number
  selling_price?: number
  profit_margin?: number
  total_cost: number
  final_product_items?: any[]
}

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'bases' | 'products'>('ingredients')
  const [openModalForTab, setOpenModalForTab] = useState<'ingredients' | 'bases' | 'products' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null)
  const [typeFilter, setTypeFilter] = useState<string[]>([]) // Filtro de tipo de insumo
  const [showTypeFilter, setShowTypeFilter] = useState(false) // Dropdown do filtro
  const typeFilterRef = useRef<HTMLDivElement>(null) // Ref para o dropdown

  // Fechar dropdown ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeFilterRef.current && !typeFilterRef.current.contains(event.target as Node)) {
        setShowTypeFilter(false)
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTypeFilter(false)
      }
    }

    if (showTypeFilter) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showTypeFilter])

  const handleNewButtonClick = () => {
    setOpenModalForTab(activeTab)
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => {
      if (prev === null) return 'asc'
      if (prev === 'asc') return 'desc'
      return null
    })
  }

  const toggleTypeFilter = (type: string) => {
    setTypeFilter(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const clearTypeFilter = () => {
    setTypeFilter([])
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
                Gerencie todos os produtos da sua confeitaria. Cadastre insumos/matérias-primas, crie bases de preparo e monte produtos finais com precificação automática.
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleNewButtonClick}
          className="bg-[var(--color-old-rose)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--color-rosy-brown)] transition font-semibold cursor-pointer"
        >
          {activeTab === 'ingredients' && '+ Novo Insumo'}
          {activeTab === 'bases' && '+ Nova Base'}
          {activeTab === 'products' && '+ Novo Produto'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Botão de Ordenação */}
        <Button
          variant="outline"
          size="sm"
          className="filter-button h-10 cursor-pointer group relative"
          onClick={toggleSortOrder}
        >
          {sortOrder === null ? (
            <ArrowDownAZ className="w-5 h-5 opacity-80" />
          ) : sortOrder === 'asc' ? (
            <ArrowDownAZ className="w-5 h-5 opacity-80" />
          ) : (
            <ArrowDownZA className="w-5 h-5 opacity-80" />
          )}
          <div className="invisible group-hover:visible absolute right-0 top-full mt-2 bg-white text-[var(--color-licorice)] text-xs rounded-lg shadow-lg z-50 border border-gray-200 px-2 py-1 whitespace-nowrap">
            {sortOrder === null ? 'Ordenar A-Z' : sortOrder === 'asc' ? 'Ordenar Z-A' : 'Remover ordenação'}
          </div>
        </Button>

        {/* Filtro de Tipo - só aparece na aba de Insumos */}
        {activeTab === 'ingredients' && (
          <div className="relative" ref={typeFilterRef}>
            <Button
              variant="outline"
              size="sm"
              className="filter-button h-10 cursor-pointer"
              onClick={() => {
                setShowTypeFilter(!showTypeFilter)
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Tipo de insumo
              {typeFilter.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {typeFilter.length}
                </Badge>
              )}
            </Button>
            
            {showTypeFilter && (
              <div className="filter-dropdown absolute top-full mt-2 right-0 bg-[var(--color-bg-modal)] border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[180px]">
                <button
                  onClick={() => toggleTypeFilter('ingredientes')}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50 rounded"
                >
                  <span className="text-sm">Ingredientes</span>
                  {typeFilter.includes('ingredientes') && (
                    <span className="text-xs text-green-600 font-semibold">✓</span>
                  )}
                </button>
                <button
                  onClick={() => toggleTypeFilter('materiais')}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50 rounded"
                >
                  <span className="text-sm">Materiais</span>
                  {typeFilter.includes('materiais') && (
                    <span className="text-xs text-green-600 font-semibold">✓</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botão Limpar Filtros */}
        {typeFilter.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 cursor-pointer"
            onClick={clearTypeFilter}
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Filtros Ativos */}
      {typeFilter.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-600">Filtros ativos:</span>
          {typeFilter.map(filter => (
            <Badge key={filter} variant="secondary" className="gap-1.5">
              {filter === 'ingredientes' ? 'Ingredientes' : 'Materiais'}
              <button
                onClick={() => toggleTypeFilter(filter)}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab('ingredients')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md h-9 text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'ingredients'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'bg-transparent text-gray-600 hover:bg-white'
          }`}
        >
          <Package className="w-4 h-4" />
          Insumos
        </button>
        <button
          onClick={() => setActiveTab('bases')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md h-9 text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'bases'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'bg-transparent text-gray-600 hover:bg-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Bases de Preparo
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md h-9 text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'bg-transparent text-gray-600 hover:bg-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Produtos Finais
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          {activeTab === 'ingredients' && <IngredientsTab shouldOpenModal={openModalForTab === 'ingredients'} onModalClose={() => setOpenModalForTab(null)} searchQuery={searchQuery} sortOrder={sortOrder} typeFilter={typeFilter} />}
          {activeTab === 'bases' && <BasesTab shouldOpenModal={openModalForTab === 'bases'} onModalClose={() => setOpenModalForTab(null)} searchQuery={searchQuery} sortOrder={sortOrder} />}
          {activeTab === 'products' && <ProductsTab shouldOpenModal={openModalForTab === 'products'} onModalClose={() => setOpenModalForTab(null)} searchQuery={searchQuery} sortOrder={sortOrder} />}
        </div>
      </div>
    </div>
  )
}

function IngredientsTab({ shouldOpenModal, onModalClose, searchQuery, sortOrder, typeFilter }: { shouldOpenModal: boolean; onModalClose: () => void; searchQuery: string; sortOrder: 'asc' | 'desc' | null; typeFilter: string[] }) {
  const settings = useProductSettings()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: 'ingredientes', // 'ingredientes' ou 'materiais'
    name: '',
    volume: '',
    unit: 'gramas',
    average_cost: '',
    loss_factor: '2'
  })

  useEffect(() => {
    fetchIngredients()
  }, [])

  useEffect(() => {
    if (shouldOpenModal) {
      setEditingId(null)
      setFormData({ type: 'ingredientes', name: '', volume: '', unit: 'gramas', average_cost: '', loss_factor: '2' })
      setIsModalOpen(true)
      onModalClose()
    }
  }, [shouldOpenModal, onModalClose])

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/products/ingredients')
      if (response.ok) {
        const data = await response.json()
        console.log('Raw data from API:', data[0]) // Debug
        
        // Garantir que valores numéricos sejam convertidos corretamente
        const normalizedData = data.map((item: any) => {
          // O banco usa 'quantity', mas mantemos 'volume' no frontend
          const volume = Number(item.quantity || item.volume) || 0
          const average_cost = Number(item.average_cost) || 0
          const loss_factor = Number(item.loss_factor) || 0
          
          // Calcular unit_cost: average_cost / volume * (1 + loss_factor/100)
          const unit_cost = volume > 0 ? (average_cost / volume) * (1 + loss_factor / 100) : 0
          
          console.log('Processing item:', item.name, {
            raw_quantity: item.quantity,
            parsed_volume: volume,
            average_cost,
            unit_cost
          })
          
          return {
            ...item,
            volume, // Mapeia quantity para volume
            average_cost,
            unit_cost: Number(item.unit_cost) || unit_cost, // Usa o do banco ou calcula
            loss_factor
          }
        })
        console.log('Normalized data:', normalizedData[0]) // Debug
        setIngredients(normalizedData)
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error)
    } finally {
      setLoading(false)
    }
  }

  let filteredIngredients = ingredients.filter(ingredient => {
    // Filtro por nome
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filtro por tipo
    const matchesType = typeFilter.length === 0 || typeFilter.includes(ingredient.type || 'ingredientes')
    
    return matchesSearch && matchesType
  })

  // Ordena somente se sortOrder foi definido
  if (sortOrder !== null) {
    filteredIngredients = filteredIngredients.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, 'pt-BR')
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId 
        ? `/api/products/ingredients?id=${editingId}`
        : '/api/products/ingredients'
      
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const savedIngredient = await response.json()
        
        if (editingId) {
          setIngredients(ingredients.map(ing => 
            ing.id === editingId ? savedIngredient : ing
          ))
        } else {
          setIngredients([savedIngredient, ...ingredients])
        }
        
        setIsModalOpen(false)
        setEditingId(null)
        setFormData({
          type: 'ingredientes',
          name: '',
          volume: '',
          unit: 'gramas',
          average_cost: '',
          loss_factor: '2'
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar insumo')
      }
    } catch (error) {
      console.error('Erro ao salvar insumo:', error)
      alert('Erro ao salvar insumo')
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({
      type: 'ingredientes',
      name: '',
      volume: '',
      unit: 'gramas',
      average_cost: '',
      loss_factor: '2'
    })
  }

  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Editar Insumo" : "Novo Insumo"}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Insumo *</label>
              <select 
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value
                  setFormData({ 
                    ...formData, 
                    type: newType,
                    unit: newType === 'materiais' ? 'unidades' : 'gramas'
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900"
              >
                <option value="ingredientes">Ingredientes</option>
                <option value="materiais">Materiais</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'ingredientes' ? 'Nome do Ingrediente *' : 'Nome do Material *'}
              </label>
              <input
                type="text"
                placeholder={formData.type === 'ingredientes' ? 'Ex: Farinha de Trigo' : 'Ex: Embalagem 10x20cm'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
              <select 
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900"
              >
                <option value="gramas">Gramas (g)</option>
                <option value="kg">Quilogramas (kg)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="litros">Litros (L)</option>
                <option value="unidades">Unidades</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade *
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder={formData.unit === 'unidades' ? '12' : '1.000'}
                value={formData.volume ? formatVolumeInput(formData.volume) : ''}
                onChange={(e) => {
                  // Remove tudo que não é número do valor digitado
                  const rawValue = e.target.value.replace(/\D/g, '')
                  setFormData(prev => ({ ...prev, volume: rawValue }))
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo Médio (R$) *</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={formData.average_cost ? formatCurrencyInput(formData.average_cost) : ''}
                onChange={(e) => {
                  // Remove tudo que não é número
                  const rawValue = e.target.value.replace(/\D/g, '')
                  // Converte centavos para formato decimal (divide por 100)
                  const decimalValue = rawValue ? (parseInt(rawValue, 10) / 100).toFixed(2) : ''
                  setFormData(prev => ({ ...prev, average_cost: decimalValue }))
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            {settings.showLossFactorIngredients && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fator de Perda (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="2"
                  value={formData.loss_factor}
                  onChange={(e) => setFormData({ ...formData, loss_factor: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-6 justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-outline-grey"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-success"
            >
              {editingId ? 'Atualizar Insumo' : 'Salvar Insumo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="large" className="text-[var(--color-old-rose)]" />
          </div>
        ) : filteredIngredients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'Nenhum insumo encontrado' : 'Nenhum insumo cadastrado. Clique em "+ Novo Insumo" para começar.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Insumo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Quantidade</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Custo Médio</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Custo Unitário</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Fator de Perda</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.map((ingredient) => (
                <tr key={ingredient.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{ingredient.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatSmartNumber(ingredient.volume)} {getUnitAbbreviation(ingredient.unit)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">R$ {formatSmartNumber(ingredient.average_cost, 2, true)}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">R$ {formatSmartNumber(ingredient.unit_cost, 5, true)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatSmartNumber(ingredient.loss_factor, 2, true)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function BasesTab({ shouldOpenModal, onModalClose, searchQuery, sortOrder }: { shouldOpenModal: boolean; onModalClose: () => void; searchQuery: string; sortOrder: 'asc' | 'desc' | null }) {
  const settings = useProductSettings()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [bases, setBases] = useState<BaseRecipe[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    loss_factor: '2',
    unit: 'gramas',
    yield: '',
    items: [] as { ingredient_id: string; quantity: string }[]
  })
  const [newItem, setNewItem] = useState({ ingredient_id: '', quantity: '' })

  useEffect(() => {
    fetchBases()
    fetchIngredients()
  }, [])

  useEffect(() => {
    if (shouldOpenModal) {
      setEditingId(null)
      setFormData({ name: '', description: '', loss_factor: '2', unit: 'gramas', yield: '', items: [] })
      setNewItem({ ingredient_id: '', quantity: '' })
      setIsModalOpen(true)
      onModalClose()
    }
  }, [shouldOpenModal, onModalClose])

  const fetchBases = async () => {
    try {
      const response = await fetch('/api/products/bases')
      if (response.ok) {
        const data = await response.json()
        setBases(data)
      }
    } catch (error) {
      console.error('Erro ao buscar bases:', error)
    } finally {
      setLoading(false)
    }
  }

  let filteredBases = bases.filter(base =>
    base.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    base.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Ordena somente se sortOrder foi definido
  if (sortOrder !== null) {
    filteredBases = filteredBases.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, 'pt-BR')
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/products/ingredients')
      if (response.ok) {
        const data = await response.json()
        setIngredients(data)
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error)
    }
  }

  const handleAddItem = () => {
    if (newItem.ingredient_id && newItem.quantity) {
      setFormData({
        ...formData,
        items: [...formData.items, newItem]
      })
      setNewItem({ ingredient_id: '', quantity: '' })
    }
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId 
        ? `/api/products/bases?id=${editingId}`
        : '/api/products/bases'
      
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const savedBase = await response.json()
        
        if (editingId) {
          setBases(bases.map(base => 
            base.id === editingId ? savedBase : base
          ))
        } else {
          setBases([savedBase, ...bases])
        }
        
        setIsModalOpen(false)
        setEditingId(null)
        setFormData({
          name: '',
          description: '',
          loss_factor: '2',
          unit: 'gramas',
          yield: '',
          items: []
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar base')
      }
    } catch (error) {
      console.error('Erro ao salvar base:', error)
      alert('Erro ao salvar base')
    }
  }

  const handleEdit = (base: BaseRecipe) => {
    setEditingId(base.id)
    setFormData({
      name: base.name,
      description: base.description || '',
      loss_factor: base.loss_factor.toString(),
      unit: (base as any).unit || 'gramas',
      yield: (base as any).yield?.toString() || '',
      items: (base.base_recipe_items || []).map(item => ({
        ingredient_id: item.ingredients?.id || item.ingredient_id,
        quantity: item.quantity.toString()
      }))
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      loss_factor: '2',
      unit: 'gramas',
      yield: '',
      items: []
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta base?')) return

    try {
      const response = await fetch(`/api/products/bases?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBases(bases.filter(base => base.id !== id))
      } else {
        alert('Erro ao excluir base')
      }
    } catch (error) {
      console.error('Erro ao excluir base:', error)
      alert('Erro ao excluir base')
    }
  }

  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Editar Base de Preparo" : "Nova Base de Preparo"}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Base *</label>
              <input
                type="text"
                placeholder="Ex: Massa de Chocolate"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            {settings.showLossFactorBases && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fator de Perda (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="2"
                  value={formData.loss_factor}
                  onChange={(e) => setFormData({ ...formData, loss_factor: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
              <select 
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900"
              >
                <option value="gramas">Gramas (g)</option>
                <option value="kg">Quilogramas (kg)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="litros">Litros (L)</option>
                <option value="unidades">Unidades</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rendimento</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1.000"
                value={formData.yield ? formatVolumeInput(formData.yield) : ''}
                onChange={(e) => {
                  // Remove tudo que não é número do valor digitado
                  const rawValue = e.target.value.replace(/\D/g, '')
                  setFormData(prev => ({ ...prev, yield: rawValue }))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              placeholder="Descrição da base de preparo"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div className="pt-4 border-t border-gray-300">
            <h4 className="font-medium text-gray-900 mb-3">Ingredientes da Base</h4>
            
            {/* Added items list */}
            {formData.items.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.items.map((item, index) => {
                  const ing = ingredients.find(i => i.id === item.ingredient_id)
                  return (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-900">{ing?.name} - {item.quantity} {ing?.unit}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remover
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div className="md:col-span-2">
                <select 
                  value={newItem.ingredient_id}
                  onChange={(e) => setNewItem({ ...newItem, ingredient_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900"
                >
                  <option value="">Selecione um insumo</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Quantidade"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  + Adicionar
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6 justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-outline-grey"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-success"
            >
              {editingId ? 'Atualizar Base' : 'Salvar Base'}
            </button>
          </div>
        </form>
      </Modal>

      {/* List of Bases */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="large" className="text-[var(--color-old-rose)]" />
          </div>
        ) : filteredBases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'Nenhuma base encontrada' : 'Nenhuma base cadastrada. Clique em "+ Nova Base" para começar.'}
          </div>
        ) : (
          filteredBases.map((base) => (
            <div key={base.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{base.name}</h3>
                  <p className="text-sm text-gray-500">Fator de Perda: {formatSmartNumber(base.loss_factor, 2, true)}%</p>
                  {(base as any).yield && (base as any).unit && (
                    <p className="text-sm text-gray-500">
                      Rendimento: {formatInteger(parseFloat((base as any).yield))} {getUnitAbbreviation((base as any).unit)}
                    </p>
                  )}
                  {base.description && <p className="text-sm text-gray-600 mt-1">{base.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">R$ {formatBRL(base.total_cost || 0, 2)}</p>
                  <p className="text-xs text-gray-500">Custo Total</p>
                </div>
              </div>
              {base.base_recipe_items && base.base_recipe_items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Item</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Quantidade</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Custo Unit.</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {base.base_recipe_items.map((item: any) => {
                        const subtotal = item.quantity * (item.ingredients?.unit_cost || 0)
                        return (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-gray-900">{item.ingredients?.name}</td>
                            <td className="py-2 px-2 text-gray-600">
                              {formatSmartNumber(item.quantity, 2)} {getUnitAbbreviation(item.ingredients?.unit || '')}
                            </td>
                            <td className="py-2 px-2 text-gray-600">R$ {formatSmartNumber(item.ingredients?.unit_cost || 0, 5, true)}</td>
                            <td className="py-2 px-2 text-gray-900 font-medium">R$ {formatSmartNumber(subtotal, 4, true)}</td>
                          </tr>
                        )
                      })}
                      {/* Linha de Subtotal */}
                      <tr className="border-t-2 border-gray-300">
                        <td colSpan={3} className="py-2 px-2 text-right font-medium text-gray-700">Subtotal dos Ingredientes:</td>
                        <td className="py-2 px-2 text-gray-900 font-semibold">
                          R$ {formatSmartNumber(base.base_recipe_items.reduce((sum: number, item: any) => 
                            sum + (item.quantity * (item.ingredients?.unit_cost || 0)), 0
                          ), 4, true)}
                        </td>
                      </tr>
                      {/* Linha do Fator de Perda */}
                      <tr className="bg-yellow-50">
                        <td colSpan={3} className="py-2 px-2 text-right font-medium text-gray-700">
                          Fator de Perda ({formatSmartNumber(base.loss_factor, 2, true)}%):
                        </td>
                        <td className="py-2 px-2 text-orange-600 font-semibold">
                          + R$ {formatSmartNumber((base.base_recipe_items.reduce((sum: number, item: any) => 
                            sum + (item.quantity * (item.ingredients?.unit_cost || 0)), 0
                          ) * (base.loss_factor / 100)), 4, true)}
                        </td>
                      </tr>
                      {/* Linha de Total Final */}
                      <tr className="bg-gray-100 border-t-2 border-gray-300">
                        <td colSpan={3} className="py-2 px-2 text-right font-bold text-gray-900">Custo Total:</td>
                        <td className="py-2 px-2 text-pink-600 font-bold text-base">
                          R$ {formatBRL(base.total_cost || 0, 2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-3">
                <button 
                  onClick={() => handleEdit(base)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3 cursor-pointer"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(base.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ProductsTab({ shouldOpenModal, onModalClose, searchQuery, sortOrder }: { shouldOpenModal: boolean; onModalClose: () => void; searchQuery: string; sortOrder: 'asc' | 'desc' | null }) {
  const settings = useProductSettings()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [products, setProducts] = useState<FinalProduct[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [bases, setBases] = useState<BaseRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    loss_factor: '2',
    selling_price: '',
    profit_margin: '',
    items: [] as { item_type: string; item_id: string; quantity: string }[]
  })
  const [newItem, setNewItem] = useState({ item_type: 'ingredient', item_id: '', quantity: '' })

  useEffect(() => {
    fetchProducts()
    fetchIngredients()
    fetchBases()
  }, [])

  useEffect(() => {
    if (shouldOpenModal) {
      setEditingId(null)
      setFormData({
        name: '',
        category: '',
        description: '',
        loss_factor: '2',
        selling_price: '',
        profit_margin: '',
        items: []
      })
      setNewItem({ item_type: 'ingredient', item_id: '', quantity: '' })
      setIsModalOpen(true)
      onModalClose()
    }
  }, [shouldOpenModal, onModalClose])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/pricing')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  let filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Ordena somente se sortOrder foi definido
  if (sortOrder !== null) {
    filteredProducts = filteredProducts.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, 'pt-BR')
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/products/ingredients')
      if (response.ok) {
        const data = await response.json()
        setIngredients(data)
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error)
    }
  }

  const fetchBases = async () => {
    try {
      const response = await fetch('/api/products/bases')
      if (response.ok) {
        const data = await response.json()
        setBases(data)
      }
    } catch (error) {
      console.error('Erro ao buscar bases:', error)
    }
  }

  const handleAddItem = () => {
    if (newItem.item_id && newItem.quantity) {
      setFormData({
        ...formData,
        items: [...formData.items, newItem]
      })
      setNewItem({ item_type: 'ingredient', item_id: '', quantity: '' })
    }
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId 
        ? `/api/products/pricing?id=${editingId}`
        : '/api/products/pricing'
      
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const savedProduct = await response.json()
        
        if (editingId) {
          setProducts(products.map(prod => 
            prod.id === editingId ? savedProduct : prod
          ))
        } else {
          setProducts([savedProduct, ...products])
        }
        
        setIsModalOpen(false)
        setEditingId(null)
        setFormData({
          name: '',
          category: '',
          description: '',
          loss_factor: '2',
          selling_price: '',
          profit_margin: '',
          items: []
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar produto')
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar produto')
    }
  }

  const handleEdit = (product: FinalProduct) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description || '',
      loss_factor: product.loss_factor.toString(),
      selling_price: product.selling_price?.toString() || '',
      profit_margin: product.profit_margin?.toString() || '',
      items: (product.final_product_items || []).map(item => ({
        item_type: item.item_type,
        item_id: item.item_type === 'ingredient' ? item.ingredient_id : item.base_recipe_id,
        quantity: item.quantity.toString()
      }))
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({
      name: '',
      category: '',
      description: '',
      loss_factor: '2',
      selling_price: '',
      profit_margin: '',
      items: []
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return

    try {
      const response = await fetch(`/api/products/pricing?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProducts(products.filter(prod => prod.id !== id))
      } else {
        alert('Erro ao excluir produto')
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto')
    }
  }

  const getItemName = (item: any) => {
    if (item.item_type === 'ingredient') {
      const ing = ingredients.find(i => i.id === item.item_id)
      return ing?.name || 'Item não encontrado'
    } else {
      const base = bases.find(b => b.id === item.item_id)
      return base?.name || 'Item não encontrado'
    }
  }

  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Editar Produto Final" : "Novo Produto Final"} maxWidth="625px">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
              <input
                type="text"
                placeholder="Ex: Bolo de Chocolate"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900"
              >
                <option value="">Selecione</option>
                <option value="cake">Bolo</option>
                <option value="cupcake">Cupcake</option>
                <option value="cookie">Cookie</option>
                <option value="pie">Torta</option>
                <option value="other">Outro</option>
              </select>
            </div>
            {settings.showLossFactorProducts && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fator de Perda (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="2"
                  value={formData.loss_factor}
                  onChange={(e) => setFormData({ ...formData, loss_factor: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={formData.selling_price ? formatCurrencyInput(formData.selling_price) : ''}
                onChange={(e) => {
                  // Remove tudo que não é número
                  const rawValue = e.target.value.replace(/\D/g, '')
                  // Converte centavos para formato decimal (divide por 100)
                  const decimalValue = rawValue ? (parseInt(rawValue, 10) / 100).toFixed(2) : ''
                  setFormData(prev => ({ ...prev, selling_price: decimalValue }))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Margem de Lucro (%)</label>
              <input
                type="number"
                step="0.1"
                placeholder="60"
                value={formData.profit_margin}
                onChange={(e) => setFormData({ ...formData, profit_margin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              placeholder="Descrição do produto"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div className="pt-4 border-t border-gray-300">
            <h4 className="font-medium text-gray-900 mb-3">Composição do Produto</h4>
            
            {/* Added items list */}
            {formData.items.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-900">
                      {item.item_type === 'ingredient' ? '📦 Matéria-prima' : '🥄 Base'}: {getItemName(item)} - {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
              <div>
                <select 
                  value={newItem.item_type}
                  onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value, item_id: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900"
                >
                  <option value="ingredient">Matéria-prima</option>
                  <option value="base_recipe">Base</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <select 
                  value={newItem.item_id}
                  onChange={(e) => setNewItem({ ...newItem, item_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900"
                >
                  <option value="">Selecione</option>
                  {newItem.item_type === 'ingredient' 
                    ? ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                      ))
                    : bases.map((base) => (
                        <option key={base.id} value={base.id}>{base.name}</option>
                      ))
                  }
                </select>
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Quantidade"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  + Adicionar
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6 justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-outline-grey"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="btn-success"
            >
              {editingId ? 'Atualizar Produto' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Products List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="large" className="text-[var(--color-old-rose)]" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado. Clique em "+ Novo Produto" para começar.'}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const profit = product.selling_price && product.total_cost 
              ? product.selling_price - product.total_cost 
              : 0
            const margin = product.selling_price && product.total_cost
              ? ((profit / product.selling_price) * 100)
              : 0

            return (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">
                      Categoria: {product.category} | Perda: {formatSmartNumber(product.loss_factor, 2, true)}%
                    </p>
                    {product.description && <p className="text-sm text-gray-600 mt-1">{product.description}</p>}
                  </div>
                  <div className="text-right">
                    {product.selling_price ? (
                      <>
                        <p className="text-lg font-bold text-pink-600">R$ {formatBRL(product.selling_price, 2)}</p>
                        <p className="text-xs text-gray-500">Preço de Venda</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Sem preço definido</p>
                    )}
                  </div>
                </div>
                {product.selling_price && (
                  <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Custo Total</p>
                      <p className="font-semibold text-gray-900">R$ {formatBRL(product.total_cost || 0, 2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Lucro</p>
                      <p className="font-semibold text-green-600">R$ {formatBRL(profit, 2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Margem</p>
                      <p className="font-semibold text-blue-600">{formatBRL(margin, 1)}%</p>
                    </div>
                  </div>
                )}
                {product.final_product_items && product.final_product_items.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Tipo</th>
                          <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Item</th>
                          <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Qtde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.final_product_items.map((item: any) => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-gray-600">
                              {item.item_type === 'ingredient' ? 'Matéria-prima' : 'Base'}
                            </td>
                            <td className="py-2 px-2 text-gray-900">
                              {item.item_type === 'ingredient' 
                                ? item.ingredients?.name 
                                : item.base_recipes?.name}
                            </td>
                            <td className="py-2 px-2 text-gray-600">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-3">
                  <button 
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3 cursor-pointer"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
