'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Modal from '@/components/Modal'
import { Spinner } from '@/components/ui/spinner'
import { Info, Package, Layers, ShoppingBag, Tags, Search, ArrowDownAZ, ArrowDownZA, Filter, Check, Trash2, Plus, Camera, SwitchCamera, CircleX, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProductSettings } from '@/hooks/useProductSettings'
import { showToast } from '@/app/(dashboard)/layout'
import { 
  convertFromSmallUnit, 
  convertToSmallUnit, 
  getUnitOptions, 
  formatQuantityWithUnit 
} from '@/lib/unitConversion'
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
  image_url?: string
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
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]) // Filtro de categoria de produto
  const [showCategoryFilter, setShowCategoryFilter] = useState(false) // Dropdown do filtro de categoria
  const categoryFilterRef = useRef<HTMLDivElement>(null) // Ref para o dropdown de categoria
  const [categories, setCategories] = useState<string[]>([]) // Lista de categorias disponíveis

  // Carregar categorias
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/products/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.map((cat: { id: string; name: string }) => cat.name))
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      }
    }
    loadCategories()
  }, [])

  // Fechar dropdown ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeFilterRef.current && !typeFilterRef.current.contains(event.target as Node)) {
        setShowTypeFilter(false)
      }
      if (categoryFilterRef.current && !categoryFilterRef.current.contains(event.target as Node)) {
        setShowCategoryFilter(false)
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTypeFilter(false)
        setShowCategoryFilter(false)
      }
    }

    if (showTypeFilter || showCategoryFilter) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showTypeFilter, showCategoryFilter])

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

  const toggleCategoryFilter = (category: string) => {
    setCategoryFilter(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
  }

  const clearCategoryFilter = () => {
    setCategoryFilter([])
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
          className="bg-[var(--color-clay-500)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--color-clay-600)] transition font-semibold cursor-pointer"
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

        {/* Filtro de Categoria - só aparece na aba de Produtos */}
        {activeTab === 'products' && (
          <div className="relative" ref={categoryFilterRef}>
            <Button
              variant="outline"
              size="sm"
              className="filter-button h-10 cursor-pointer"
              onClick={() => {
                setShowCategoryFilter(!showCategoryFilter)
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Categoria
              {categoryFilter.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {categoryFilter.length}
                </Badge>
              )}
            </Button>
            
            {showCategoryFilter && (
              <div className="filter-dropdown absolute top-full mt-2 right-0 bg-[var(--color-bg-modal)] border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[180px] max-h-[300px] overflow-y-auto">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategoryFilter(category)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50 rounded"
                    >
                      <span className="text-sm">{category}</span>
                      {categoryFilter.includes(category) && (
                        <span className="text-xs text-green-600 font-semibold">✓</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Nenhuma categoria cadastrada
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Botão Limpar Filtros */}
        {(typeFilter.length > 0 || categoryFilter.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 cursor-pointer"
            onClick={() => {
              clearTypeFilter()
              clearCategoryFilter()
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Filtros Ativos */}
      {(typeFilter.length > 0 || categoryFilter.length > 0) && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-600">Filtros ativos:</span>
          {typeFilter.map(filter => (
            <div
              key={filter}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-[var(--color-lavender-blush)] text-[var(--color-clay-500)] border-[var(--color-clay-500)]"
            >
              <span className="text-xs font-medium">
                {filter === 'ingredientes' ? 'Ingredientes' : 'Materiais'}
              </span>
              <button
                onClick={() => toggleTypeFilter(filter)}
                className="hover:opacity-70"
                title="Remover filtro"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {categoryFilter.map(filter => (
            <div
              key={filter}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-[var(--color-lavender-blush)] text-[var(--color-clay-500)] border-[var(--color-clay-500)]"
            >
              <span className="text-xs font-medium">{filter}</span>
              <button
                onClick={() => toggleCategoryFilter(filter)}
                className="hover:opacity-70"
                title="Remover categoria"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
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
          <Tags className="w-4 h-4" />
          Produtos Finais
        </button>
      </div>

      {/* Tab Content */}
      <div className="overflow-hidden">
        <div>
          {activeTab === 'ingredients' && <IngredientsTab shouldOpenModal={openModalForTab === 'ingredients'} onModalClose={() => setOpenModalForTab(null)} searchQuery={searchQuery} sortOrder={sortOrder} typeFilter={typeFilter} />}
          {activeTab === 'bases' && <BasesTab shouldOpenModal={openModalForTab === 'bases'} onModalClose={() => setOpenModalForTab(null)} searchQuery={searchQuery} sortOrder={sortOrder} />}
          {activeTab === 'products' && <ProductsTab shouldOpenModal={openModalForTab === 'products'} onModalClose={() => setOpenModalForTab(null)} searchQuery={searchQuery} sortOrder={sortOrder} categoryFilter={categoryFilter} />}
        </div>
      </div>
    </div>
  )
}

function IngredientsTab({ shouldOpenModal, onModalClose, searchQuery, sortOrder, typeFilter }: { shouldOpenModal: boolean; onModalClose: () => void; searchQuery: string; sortOrder: 'asc' | 'desc' | null; typeFilter: string[] }) {
  const settings = useProductSettings()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [ingredientUsage, setIngredientUsage] = useState<Record<string, string[]>>({})
  const [bases, setBases] = useState<BaseRecipe[]>([])
  
  // Função auxiliar para obter unidade padrão baseada nas configurações
  const getDefaultUnit = useCallback(() => {
    return settings.measurementUnit === 'metric-large' ? 'kg' : 'gramas'
  }, [settings.measurementUnit])
  
  const [formData, setFormData] = useState({
    type: 'ingredientes', // 'ingredientes' ou 'materiais'
    name: '',
    volume: '',
    unit: getDefaultUnit(),
    average_cost: '',
    loss_factor: '2',
    image_url: ''
  })

  useEffect(() => {
    fetchIngredients()
    fetchBases()
  }, [])

  const fetchBases = async () => {
    try {
      const response = await fetch('/api/products/bases')
      if (response.ok) {
        const data = await response.json()
        setBases(data)
        
        // Mapear quais ingredientes estão sendo usados em quais bases
        const usage: Record<string, string[]> = {}
        data.forEach((base: any) => {
          if (base.base_recipe_items) {
            base.base_recipe_items.forEach((item: any) => {
              const ingredientId = item.ingredient_id || item.ingredients?.id
              if (ingredientId) {
                if (!usage[ingredientId]) {
                  usage[ingredientId] = []
                }
                usage[ingredientId].push(base.name)
              }
            })
          }
        })
        setIngredientUsage(usage)
      }
    } catch (error) {
      console.error('Erro ao buscar bases:', error)
    }
  }

  useEffect(() => {
    if (shouldOpenModal) {
      setEditingId(null)
      setImagePreview(null)
      setFormData({ type: 'ingredientes', name: '', volume: '', unit: getDefaultUnit(), average_cost: '', loss_factor: '2', image_url: '' })
      setIsModalOpen(true)
      onModalClose()
    }
  }, [shouldOpenModal, onModalClose, getDefaultUnit])

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
      // Preparar dados: converter unidades para o padrão do banco (g/ml)
      const volumeValue = parseFloat(formData.volume)
      const convertedVolume = convertToSmallUnit(volumeValue, formData.unit, settings.measurementUnit)
      
      // Mapear unidade para o padrão do banco
      let dbUnit = formData.unit
      if (settings.measurementUnit === 'metric-large') {
        if (formData.unit === 'kg') dbUnit = 'gramas'
        if (formData.unit === 'L') dbUnit = 'ml'
      }
      
      const dataToSend = {
        ...formData,
        volume: convertedVolume.toString(),
        unit: dbUnit
      }
      
      const url = editingId 
        ? `/api/products/ingredients?id=${editingId}`
        : '/api/products/ingredients'
      
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const savedIngredient = await response.json()
        
        if (editingId) {
          setIngredients(ingredients.map(ing => 
            ing.id === editingId ? savedIngredient : ing
          ))
          showToast({
            title: 'Insumo atualizado!',
            message: 'O insumo foi atualizado com sucesso.',
            variant: 'success',
            duration: 3000,
          })
        } else {
          setIngredients([savedIngredient, ...ingredients])
          showToast({
            title: 'Insumo criado!',
            message: `${savedIngredient.name} foi adicionado com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
        }
        
        setIsModalOpen(false)
        setEditingId(null)
        setImagePreview(null)
        setFormData({
          type: 'ingredientes',
          name: '',
          volume: '',
          unit: 'gramas',
          average_cost: '',
          loss_factor: '2',
          image_url: ''
        })
      } else {
        const error = await response.json()
        showToast({
          title: 'Erro ao salvar insumo',
          message: error.error || 'Não foi possível salvar o insumo. Tente novamente.',
          variant: 'error',
          duration: 4000,
        })
      }
    } catch (error) {
      console.error('Erro ao salvar insumo:', error)
      showToast({
        title: 'Erro ao salvar insumo',
        message: 'Não foi possível salvar o insumo. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setImagePreview(null)
    setFormData({
      type: 'ingredientes',
      name: '',
      volume: '',
      unit: 'gramas',
      average_cost: '',
      loss_factor: '2',
      image_url: ''
    })
  }

  const handleEdit = (ingredient: Ingredient) => {
    setEditingId(ingredient.id)
    
    // Converter valores do banco (g/ml) para a unidade de exibição
    const volumeValue = ingredient.volume || 0
    const baseUnit = ingredient.unit || 'gramas'
    const convertedVolume = convertFromSmallUnit(volumeValue, baseUnit, settings.measurementUnit)
    
    // Mapear unidade para exibição
    let displayUnit = baseUnit
    if (settings.measurementUnit === 'metric-large') {
      if (baseUnit === 'gramas') displayUnit = 'kg'
      if (baseUnit === 'ml') displayUnit = 'L'
    }
    
    // Definir preview da imagem se houver
    if ((ingredient as any).image_url) {
      setImagePreview((ingredient as any).image_url)
    }
    
    setFormData({
      type: ingredient.type || 'ingredientes',
      name: ingredient.name || '',
      volume: convertedVolume.toString(),
      unit: displayUnit,
      average_cost: ingredient.average_cost?.toString() || '',
      loss_factor: ingredient.loss_factor?.toString() || '2',
      image_url: (ingredient as any).image_url || ''
    })
    setIsModalOpen(true)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setImagePreview(base64String)
        setFormData(prev => ({ ...prev, image_url: base64String }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Editar Insumo" : "Novo Insumo"}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">{settings.showIngredientPhoto && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Insumo</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <label className="cursor-pointer group">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                        {imagePreview ? (
                          <>
                            <Image
                              src={imagePreview}
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
                            <Package className="w-12 h-12 text-gray-400 group-hover:text-gray-500 transition-colors" />
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
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeAvatar}
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
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 bg-white"
              >
                <option value="ingredientes">Ingrediente</option>
                <option value="materiais">Material</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
              <select 
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-500 bg-white"
              >
                {getUnitOptions(settings.measurementUnit).map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-6 justify-end">
            {editingId && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={!!(editingId && ingredientUsage[editingId]?.length > 0)}
                  className="btn-outline-danger disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Insumo
                </button>
                {editingId && ingredientUsage[editingId]?.length > 0 && (
                  <div className="invisible group-hover:visible absolute bottom-full mb-2 left-0 w-[280px] bg-white text-[var(--color-licorice)] text-xs rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '15px' }}>
                    <p className="font-medium mb-2">Não pode ser excluído. Usado em:</p>
                    <ul className="list-none space-y-1">
                      {ingredientUsage[editingId].map((baseName, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{baseName}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <button 
              type="submit"
              className="btn-success"
            >
              <Check className="w-4 h-4" />
              {editingId ? 'Atualizar Insumo' : 'Salvar Insumo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Alert Dialog para Excluir Insumo */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Insumo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este insumo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-outline-grey">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="btn-danger"
              onClick={async () => {
                if (editingId) {
                  try {
                    const response = await fetch(`/api/products/ingredients/${editingId}`, {
                      method: 'DELETE',
                    })
                    if (response.ok) {
                      showToast({
                        title: 'Insumo excluído!',
                        message: 'O insumo foi removido com sucesso.',
                        variant: 'success',
                        duration: 3000,
                      })
                      setIsModalOpen(false)
                      setDeleteDialogOpen(false)
                      fetchIngredients()
                    } else {
                      throw new Error('Erro ao excluir insumo')
                    }
                  } catch (error) {
                    console.error('Erro ao excluir:', error)
                    showToast({
                      title: 'Erro',
                      message: 'Não foi possível excluir o insumo.',
                      variant: 'error',
                      duration: 3000,
                    })
                  }
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="large" className="text-[var(--color-clay-500)]" />
          </div>
        ) : filteredIngredients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'Nenhum insumo encontrado' : 'Nenhum insumo cadastrado. Clique em "+ Novo Insumo" para começar.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {settings.showIngredientPhoto && <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm w-20"></th>}
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Insumo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Quantidade</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Custo Médio</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Custo Unitário</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Fator de Perda</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.map((ingredient) => {
                // Converter volume do banco (g/ml) para unidade de exibição
                const displayVolume = convertFromSmallUnit(ingredient.volume, ingredient.unit, settings.measurementUnit)
                const displayUnit = ingredient.unit === 'gramas' && settings.measurementUnit === 'metric-large' 
                  ? 'kg' 
                  : ingredient.unit === 'ml' && settings.measurementUnit === 'metric-large'
                  ? 'L'
                  : ingredient.unit
                
                return (
                  <tr 
                    key={ingredient.id} 
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleEdit(ingredient)}
                  >
                    {settings.showIngredientPhoto && (
                      <td className="py-3 px-4">
                        {(ingredient as any).image_url ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                            <Image
                              src={(ingredient as any).image_url}
                              alt={ingredient.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-gray-900">{ingredient.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatSmartNumber(displayVolume)} {getUnitAbbreviation(displayUnit)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">R$ {formatSmartNumber(ingredient.average_cost, 2, true)}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">R$ {formatSmartNumber(ingredient.unit_cost, 5, true)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formatSmartNumber(ingredient.loss_factor, 2, true)}%</td>
                  </tr>
                )
              })}
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bases, setBases] = useState<BaseRecipe[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [baseUsage, setBaseUsage] = useState<Record<string, string[]>>({})
  const [products, setProducts] = useState<FinalProduct[]>([])
  
  // Função auxiliar para obter unidade padrão baseada nas configurações
  const getDefaultUnit = useCallback(() => {
    return settings.measurementUnit === 'metric-large' ? 'kg' : 'gramas'
  }, [settings.measurementUnit])
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    loss_factor: '2',
    unit: getDefaultUnit(),
    yield: '',
    items: [] as { ingredient_id: string; quantity: string }[],
    image_url: ''
  })
  const [newItem, setNewItem] = useState({ ingredient_id: '', quantity: '' })

  useEffect(() => {
    fetchBases()
    fetchIngredients()
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/pricing')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
        
        // Mapear quais bases estão sendo usadas em quais produtos
        const usage: Record<string, string[]> = {}
        data.forEach((product: any) => {
          if (product.final_product_items) {
            product.final_product_items.forEach((item: any) => {
              if (item.item_type === 'base_recipe') {
                const baseId = item.base_recipe_id || item.base_recipes?.id
                if (baseId) {
                  if (!usage[baseId]) {
                    usage[baseId] = []
                  }
                  usage[baseId].push(product.name)
                }
              }
            })
          }
        })
        setBaseUsage(usage)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    }
  }

  useEffect(() => {
    if (shouldOpenModal) {
      setEditingId(null)
      setImagePreview(null)
      setFormData({ name: '', description: '', loss_factor: '2', unit: getDefaultUnit(), yield: '', items: [], image_url: '' })
      setNewItem({ ingredient_id: '', quantity: '' })
      setIsModalOpen(true)
      onModalClose()
    }
  }, [shouldOpenModal, onModalClose, getDefaultUnit])

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
      // Converter valores para o padrão do banco (g/ml)
      const yieldValue = parseFloat(formData.yield)
      const convertedYield = convertToSmallUnit(yieldValue, formData.unit, settings.measurementUnit)
      
      // Mapear unidade para o padrão do banco
      let dbUnit = formData.unit
      if (settings.measurementUnit === 'metric-large') {
        if (formData.unit === 'kg') dbUnit = 'gramas'
        if (formData.unit === 'L') dbUnit = 'ml'
      }
      
      const dataToSend = {
        ...formData,
        yield: convertedYield.toString(),
        unit: dbUnit
      }
      
      const url = editingId 
        ? `/api/products/bases?id=${editingId}`
        : '/api/products/bases'
      
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const savedBase = await response.json()
        
        if (editingId) {
          setBases(bases.map(base => 
            base.id === editingId ? savedBase : base
          ))
          showToast({
            title: 'Base atualizada!',
            message: 'A base foi atualizada com sucesso.',
            variant: 'success',
            duration: 3000,
          })
        } else {
          setBases([savedBase, ...bases])
          showToast({
            title: 'Base criada!',
            message: `${savedBase.name} foi adicionada com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
        }
        
        setIsModalOpen(false)
        setEditingId(null)
        setImagePreview(null)
        setFormData({
          name: '',
          description: '',
          loss_factor: '2',
          unit: 'gramas',
          yield: '',
          items: [],
          image_url: ''
        })
      } else {
        const error = await response.json()
        showToast({
          title: 'Erro ao salvar base',
          message: error.error || 'Não foi possível salvar a base. Tente novamente.',
          variant: 'error',
          duration: 4000,
        })
      }
    } catch (error) {
      console.error('Erro ao salvar base:', error)
      showToast({
        title: 'Erro ao salvar base',
        message: 'Não foi possível salvar a base. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    }
  }

  const handleEdit = (base: BaseRecipe) => {
    setEditingId(base.id)
    
    // Converter valores do banco (g/ml) para a unidade de exibição
    const baseUnit = (base as any).unit || 'gramas'
    const yieldValue = parseFloat((base as any).yield || '0')
    const convertedYield = convertFromSmallUnit(yieldValue, baseUnit, settings.measurementUnit)
    
    // Mapear unidade para exibição
    let displayUnit = baseUnit
    if (settings.measurementUnit === 'metric-large') {
      if (baseUnit === 'gramas') displayUnit = 'kg'
      if (baseUnit === 'ml') displayUnit = 'L'
    }
    
    // Definir preview da imagem se houver
    if ((base as any).image_url) {
      setImagePreview((base as any).image_url)
    }
    
    setFormData({
      name: base.name,
      description: base.description || '',
      loss_factor: base.loss_factor.toString(),
      unit: displayUnit,
      yield: convertedYield.toString(),
      items: (base.base_recipe_items || []).map(item => ({
        ingredient_id: item.ingredients?.id || item.ingredient_id,
        quantity: item.quantity.toString()
      })),
      image_url: (base as any).image_url || ''
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setImagePreview(null)
    setFormData({
      name: '',
      description: '',
      loss_factor: '2',
      unit: 'gramas',
      yield: '',
      items: [],
      image_url: ''
    })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setImagePreview(base64String)
        setFormData(prev => ({ ...prev, image_url: base64String }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Editar Base de Preparo" : "Nova Base de Preparo"}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-4">
            {settings.showBasePhoto && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto da Base</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <label className="cursor-pointer group">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                        {imagePreview ? (
                          <>
                            <Image
                              src={imagePreview}
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
                            <Layers className="w-12 h-12 text-gray-400 group-hover:text-gray-500 transition-colors" />
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
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeAvatar}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Base *</label>
              <input
                type="text"
                placeholder="Ex: Massa de Chocolate"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
              <select 
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-500 bg-white"
              >
                {getUnitOptions(settings.measurementUnit).map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-500 bg-white"
                >
                  <option value="">Selecione um ingrediente</option>
                  {ingredients.filter(ing => ing.type === 'ingredientes' || !ing.type).map((ing) => (
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500 bg-white"
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
            {editingId && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={!!(editingId && baseUsage[editingId]?.length > 0)}
                  className="btn-outline-danger disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Base
                </button>
                {editingId && baseUsage[editingId]?.length > 0 && (
                  <div className="invisible group-hover:visible absolute bottom-full mb-2 left-0 w-[280px] bg-white text-[var(--color-licorice)] text-xs rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '15px' }}>
                    <p className="font-medium mb-2">Não pode ser excluída. Usada em:</p>
                    <ul className="list-none space-y-1">
                      {baseUsage[editingId].map((productName, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{productName}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <button 
              type="submit"
              className="btn-success"
            >
              <Check className="w-4 h-4" />
              {editingId ? 'Atualizar Base' : 'Salvar Base'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Alert Dialog para Excluir Base */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Base</AlertDialogTitle>
            <AlertDialogDescription>
              {editingId && baseUsage[editingId]?.length > 0 ? (
                <>
                  Não é possível excluir esta base pois ela está sendo usada nos seguintes produtos:
                  <ul className="mt-2 ml-4 list-disc text-gray-700">
                    {baseUsage[editingId].map((productName, idx) => (
                      <li key={idx}>
                        <span>{productName}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                'Tem certeza que deseja excluir esta base? Esta ação não pode ser desfeita.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-outline-grey">
              {editingId && baseUsage[editingId]?.length > 0 ? 'Fechar' : 'Cancelar'}
            </AlertDialogCancel>
            {(!editingId || !baseUsage[editingId] || baseUsage[editingId].length === 0) && (
              <AlertDialogAction
                className="btn-danger"
                onClick={async () => {
                  if (editingId) {
                    try {
                      const response = await fetch(`/api/products/bases/${editingId}`, {
                        method: 'DELETE',
                      })
                      if (response.ok) {
                        showToast({
                          title: 'Base excluída!',
                          message: 'A base foi removida com sucesso.',
                          variant: 'success',
                          duration: 3000,
                        })
                        setIsModalOpen(false)
                        setDeleteDialogOpen(false)
                        fetchBases()
                      } else {
                        throw new Error('Erro ao excluir base')
                      }
                    } catch (error) {
                      console.error('Erro ao excluir:', error)
                      showToast({
                        title: 'Erro',
                        message: 'Não foi possível excluir a base.',
                        variant: 'error',
                        duration: 3000,
                      })
                    }
                  }
                }}
              >
                Excluir
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* List of Bases */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="large" className="text-[var(--color-clay-500)]" />
          </div>
        ) : filteredBases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'Nenhuma base encontrada' : 'Nenhuma base cadastrada. Clique em "+ Nova Base" para começar.'}
          </div>
        ) : (
          filteredBases.map((base) => {
            // Converter yield do banco (g/ml) para unidade de exibição
            const baseUnit = (base as any).unit || 'gramas'
            const yieldValue = parseFloat((base as any).yield || '0')
            const displayYield = convertFromSmallUnit(yieldValue, baseUnit, settings.measurementUnit)
            const displayUnit = baseUnit === 'gramas' && settings.measurementUnit === 'metric-large' 
              ? 'kg' 
              : baseUnit === 'ml' && settings.measurementUnit === 'metric-large'
              ? 'L'
              : baseUnit
            
            return (
              <div 
                key={base.id} 
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
                onClick={() => handleEdit(base)}
              >
                {settings.showBasePhoto && (base as any).image_url && (
                  <div className="mb-3">
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={(base as any).image_url}
                        alt={base.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{base.name}</h3>
                    <p className="text-sm text-gray-500">Fator de Perda: {formatSmartNumber(base.loss_factor, 2, true)}%</p>
                    {yieldValue > 0 && displayUnit && (
                      <p className="text-sm text-gray-500">
                        Rendimento: {formatSmartNumber(displayYield)} {getUnitAbbreviation(displayUnit)}
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
                        // Converter quantidade do ingrediente
                        const ingUnit = item.ingredients?.unit || 'gramas'
                        const displayQuantity = convertFromSmallUnit(item.quantity, ingUnit, settings.measurementUnit)
                        const displayIngUnit = ingUnit === 'gramas' && settings.measurementUnit === 'metric-large' 
                          ? 'kg' 
                          : ingUnit === 'ml' && settings.measurementUnit === 'metric-large'
                          ? 'L'
                          : ingUnit
                        
                        return (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-gray-900">{item.ingredients?.name}</td>
                            <td className="py-2 px-2 text-gray-600">
                              {formatSmartNumber(displayQuantity, 2)} {getUnitAbbreviation(displayIngUnit)}
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
            </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ProductsTab({ shouldOpenModal, onModalClose, searchQuery, sortOrder, categoryFilter }: { shouldOpenModal: boolean; onModalClose: () => void; searchQuery: string; sortOrder: 'asc' | 'desc' | null; categoryFilter: string[] }) {
  const settings = useProductSettings()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [products, setProducts] = useState<FinalProduct[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [bases, setBases] = useState<BaseRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    loss_factor: '2',
    selling_price: '',
    profit_margin: '',
    image: null as File | null,
    items: [] as { item_type: string; item_id: string; quantity: string }[]
  })
  const [newItem, setNewItem] = useState({ item_type: 'base_recipe', item_id: '', quantity: '' })

  useEffect(() => {
    fetchProducts()
    fetchIngredients()
    fetchBases()
    loadCategories()
    
    // Atualiza categorias periodicamente (a cada 30 segundos)
    const intervalId = setInterval(() => {
      loadCategories()
    }, 30000)
    
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/products/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.map((cat: { id: string; name: string }) => cat.name))
      } else {
        // Fallback para categorias padrão em caso de erro
        setCategories(['Bolo', 'Cupcake', 'Cookie', 'Torta', 'Outro'])
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      // Fallback para categorias padrão em caso de erro
      setCategories(['Bolo', 'Cupcake', 'Cookie', 'Torta', 'Outro'])
    }
  }

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
        image: null,
        items: []
      })
      setImagePreview(null)
      setNewItem({ item_type: 'base_recipe', item_id: '', quantity: '' })
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

  // Aplica filtro de categoria
  if (categoryFilter.length > 0) {
    filteredProducts = filteredProducts.filter(product =>
      categoryFilter.includes(product.category)
    )
  }

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
    
    setSaving(true)
    
    try {
      const url = editingId 
        ? `/api/products/pricing?id=${editingId}`
        : '/api/products/pricing'
      
      const dataToSend = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        loss_factor: formData.loss_factor,
        selling_price: formData.selling_price,
        profit_margin: formData.profit_margin,
        image_url: imagePreview,
        items: formData.items
      }
      
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        const savedProduct = await response.json()
        
        if (editingId) {
          setProducts(products.map(prod => 
            prod.id === editingId ? savedProduct : prod
          ))
          showToast({
            title: 'Produto atualizado!',
            message: 'O produto foi atualizado com sucesso.',
            variant: 'success',
            duration: 3000,
          })
        } else {
          setProducts([savedProduct, ...products])
          showToast({
            title: 'Produto criado!',
            message: `${savedProduct.name} foi adicionado com sucesso.`,
            variant: 'success',
            duration: 3000,
          })
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
          image: null,
          items: []
        })
        setImagePreview(null)
      } else {
        const error = await response.json()
        showToast({
          title: 'Erro ao salvar produto',
          message: error.error || 'Não foi possível salvar o produto. Tente novamente.',
          variant: 'error',
          duration: 4000,
        })
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      showToast({
        title: 'Erro ao salvar produto',
        message: 'Não foi possível salvar o produto. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    } finally {
      setSaving(false)
    }
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
      image: null,
      items: []
    })
    setImagePreview(null)
  }

  const getItemName = (item: any) => {
    if (item.item_type === 'material') {
      const ing = ingredients.find(i => i.id === item.item_id)
      return ing?.name || 'Item não encontrado'
    } else {
      const base = bases.find(b => b.id === item.item_id)
      return base?.name || 'Item não encontrado'
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
      image: null,
      items: (product.final_product_items || []).map(item => ({
        item_type: item.item_type,
        item_id: item.item_type === 'material' ? item.ingredients?.id || item.ingredient_id : item.base_recipes?.id || item.base_recipe_id,
        quantity: item.quantity.toString()
      }))
    })
    if (product.image_url) {
      setImagePreview(product.image_url)
    }
    setIsModalOpen(true)
  }

  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Editar Produto Final" : "Novo Produto Final"} maxWidth="750px">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-4">
            {/* Foto do Produto */}
            {settings.showProductPhoto && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <label className="cursor-pointer group">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                      {imagePreview ? (
                        <>
                          <Image 
                            src={imagePreview} 
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
                          <ShoppingBag className="w-12 h-12 text-gray-400 group-hover:text-gray-500 transition-colors" />
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
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setFormData(prev => ({ ...prev, image: file }))
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setImagePreview(reader.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null)
                        setFormData(prev => ({ ...prev, image: null }))
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

            {/* 1. Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
              <input
                type="text"
                placeholder="Ex: Bolo de Chocolate"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
              />
            </div>
            
            {/* 2. Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-500 bg-white"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Composição do Produto */}
          <div className="mb-4 pt-4 border-t border-gray-300">
            <h4 className="font-medium text-gray-900 mb-3">Composição do Produto</h4>
            
            {/* Added items list */}
            {formData.items.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-900">
                      {item.item_type === 'base_recipe' ? '🥄 Base' : '📦 Material'}: {getItemName(item)} - {item.quantity}
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-500 bg-white"
                >
                  <option value="base_recipe">Base</option>
                  <option value="material">Material</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <select 
                  value={newItem.item_id}
                  onChange={(e) => setNewItem({ ...newItem, item_id: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-500 bg-white"
                >
                  <option value="">Selecione</option>
                  {newItem.item_type === 'material' 
                    ? ingredients.filter(ing => ing.type === 'materiais').map((ing) => (
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500 bg-white"
                />
              </div>
              <div>
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="w-full btn-success"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* 4. Preço de Venda */}
          <div className="mb-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
            />
          </div>

          {/* 5. Fator de Perda */}
          {settings.showLossFactorProducts && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fator de Perda (%) *</label>
              <input
                type="number"
                step="0.1"
                placeholder="2"
                value={formData.loss_factor}
                onChange={(e) => setFormData({ ...formData, loss_factor: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
              />
            </div>
          )}

          {/* 6. Descrição */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              placeholder="Descrição do produto"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B3736B] focus:border-transparent text-gray-900 placeholder:text-gray-500 bg-white"
            />
          </div>

          <div className="flex gap-2 mt-6 justify-end">
            {editingId && (
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(true)}
                className="btn-outline-danger"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Produto
              </button>
            )}
            <button 
              type="submit"
              disabled={saving}
              className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Spinner size="small" className="text-white" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {editingId ? 'Atualizar Produto' : 'Salvar Produto'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Alert Dialog para Excluir Produto */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-outline-grey">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="btn-danger"
              onClick={async () => {
                if (editingId) {
                  try {
                    const response = await fetch(`/api/products/pricing?id=${editingId}`, {
                      method: 'DELETE',
                    })
                    if (response.ok) {
                      showToast({
                        title: 'Produto excluído!',
                        message: 'O produto foi removido com sucesso.',
                        variant: 'success',
                        duration: 3000,
                      })
                      setIsModalOpen(false)
                      setDeleteDialogOpen(false)
                      fetchProducts()
                    } else {
                      throw new Error('Erro ao excluir produto')
                    }
                  } catch (error) {
                    console.error('Erro ao excluir:', error)
                    showToast({
                      title: 'Erro',
                      message: 'Não foi possível excluir o produto.',
                      variant: 'error',
                      duration: 3000,
                    })
                  }
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Products List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="large" className="text-[var(--color-clay-500)]" />
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
              <div 
                key={product.id} 
                className="bg-white border border-gray-200 rounded-lg p-5 mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
                onClick={() => handleEdit(product)}
              >
                <div className="flex justify-between items-start gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Foto do Produto */}
                    {settings.showProductPhoto && product.image_url && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-500">
                        Categoria: {product.category} | Perda: {formatSmartNumber(product.loss_factor, 2, true)}%
                      </p>
                      {product.description && <p className="text-sm text-gray-600 mt-1">{product.description}</p>}
                      
                      {/* Tabela de itens integrada */}
                      {product.final_product_items && product.final_product_items.length > 0 && (
                        <div className="mt-4">
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
                                  {item.item_type === 'base_recipe' ? 'Base' : 'Material'}
                                </td>
                                <td className="py-2 px-2 text-gray-900">
                                  {item.item_type === 'material' 
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
                    </div>
                  </div>
                  
                  {/* Coluna consolidada de valores */}
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 min-w-[240px] self-start">
                    {product.selling_price ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center pb-2 border-b border-pink-200">
                          <span className="text-xs font-medium text-gray-600">Preço de Venda</span>
                          <span className="text-lg font-bold text-pink-600">R$ {formatBRL(product.selling_price, 2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Custo Total</span>
                          <span className="font-semibold text-gray-900">R$ {formatBRL(product.total_cost || 0, 2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-pink-100">
                          <span className="text-gray-600">Lucro</span>
                          <span className="font-semibold text-green-600">R$ {formatBRL(profit, 2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Margem</span>
                          <span className="font-bold text-blue-600">{formatBRL(margin, 1)}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Sem preço definido</p>
                        <p className="text-xs text-gray-400 mt-1">Configure o preço para ver os dados</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
