'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { X, Plus, Info } from 'lucide-react'
import { showToast } from '@/app/(dashboard)/layout'

interface Category {
  id: string
  name: string
  color?: string
}

export default function ProductsSettingsPage() {
  // Categorias do banco de dados
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await fetch('/api/products/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      showToast({
        title: 'Erro',
        message: 'Erro ao carregar categorias',
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setLoadingCategories(false)
    }
  }

  // Inicializar com valores do localStorage
  const [showLossFactorIngredients, setShowLossFactorIngredients] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        return settings.showLossFactorIngredients ?? true
      }
    }
    return true
  })

  const [showLossFactorBases, setShowLossFactorBases] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        return settings.showLossFactorBases ?? true
      }
    }
    return true
  })

  const [showLossFactorProducts, setShowLossFactorProducts] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        return settings.showLossFactorProducts ?? true
      }
    }
    return true
  })

  const [showProductPhoto, setShowProductPhoto] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        return settings.showProductPhoto ?? true
      }
    }
    return true
  })

  const [showIngredientPhoto, setShowIngredientPhoto] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        return settings.showIngredientPhoto ?? true
      }
    }
    return true
  })

  const [showBasePhoto, setShowBasePhoto] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        return settings.showBasePhoto ?? true
      }
    }
    return true
  })

  const [measurementUnit, setMeasurementUnit] = useState<'metric-large' | 'metric-small'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('productSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        return settings.measurementUnit ?? 'metric-small'
      }
    }
    return 'metric-small'
  })

  // Salvar configurações no localStorage quando houver mudanças
  const updateSetting = (key: string, value: boolean | string) => {
    const currentSettings = localStorage.getItem('productSettings')
    const settings = currentSettings ? JSON.parse(currentSettings) : {}
    settings[key] = value
    localStorage.setItem('productSettings', JSON.stringify(settings))
  }

  const handleIngredientsToggle = (checked: boolean) => {
    setShowLossFactorIngredients(checked)
    updateSetting('showLossFactorIngredients', checked)
    
    showToast({
      title: checked ? 'Fator de perda ativado' : 'Fator de perda desativado',
      message: checked 
        ? 'O campo de fator de perda será exibido ao cadastrar insumos'
        : 'O campo de fator de perda foi ocultado para insumos',
      variant: 'success',
      duration: 3000,
    })
  }

  const handleBasesToggle = (checked: boolean) => {
    setShowLossFactorBases(checked)
    updateSetting('showLossFactorBases', checked)
    
    showToast({
      title: checked ? 'Fator de perda ativado' : 'Fator de perda desativado',
      message: checked 
        ? 'O campo de fator de perda será exibido ao cadastrar bases de preparo'
        : 'O campo de fator de perda foi ocultado para bases de preparo',
      variant: 'success',
      duration: 3000,
    })
  }

  const handleProductsToggle = (checked: boolean) => {
    setShowLossFactorProducts(checked)
    updateSetting('showLossFactorProducts', checked)
    
    showToast({
      title: checked ? 'Fator de perda ativado' : 'Fator de perda desativado',
      message: checked 
        ? 'O campo de fator de perda será exibido ao cadastrar produtos finais'
        : 'O campo de fator de perda foi ocultado para produtos finais',
      variant: 'success',
      duration: 3000,
    })
  }

  const handleProductPhotoToggle = (checked: boolean) => {
    setShowProductPhoto(checked)
    updateSetting('showProductPhoto', checked)
    
    showToast({
      title: checked ? 'Campo de foto ativado' : 'Campo de foto desativado',
      message: checked 
        ? 'O campo de foto será exibido ao cadastrar produtos'
        : 'O campo de foto foi ocultado no cadastro de produtos',
      variant: 'success',
      duration: 3000,
    })
  }

  const handleIngredientPhotoToggle = (checked: boolean) => {
    setShowIngredientPhoto(checked)
    updateSetting('showIngredientPhoto', checked)
    
    showToast({
      title: checked ? 'Campo de foto ativado' : 'Campo de foto desativado',
      message: checked 
        ? 'O campo de foto será exibido ao cadastrar insumos'
        : 'O campo de foto foi ocultado no cadastro de insumos',
      variant: 'success',
      duration: 3000,
    })
  }

  const handleBasePhotoToggle = (checked: boolean) => {
    setShowBasePhoto(checked)
    updateSetting('showBasePhoto', checked)
    
    showToast({
      title: checked ? 'Campo de foto ativado' : 'Campo de foto desativado',
      message: checked 
        ? 'O campo de foto será exibido ao cadastrar bases de preparo'
        : 'O campo de foto foi ocultado no cadastro de bases',
      variant: 'success',
      duration: 3000,
    })
  }

  const handleMeasurementUnitChange = (unit: 'metric-large' | 'metric-small') => {
    setMeasurementUnit(unit)
    updateSetting('measurementUnit', unit)
    
    showToast({
      title: 'Unidade de medida alterada',
      message: unit === 'metric-large' 
        ? 'Unidades alteradas para Kg/L'
        : 'Unidades alteradas para g/ml',
      variant: 'success',
      duration: 3000,
    })
  }

  // Funções para gerenciar categorias
  const addCategory = async () => {
    if (!newCategory.trim()) return
    
    // Verifica se já existe
    if (categories.some(cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      showToast({
        title: 'Atenção',
        message: 'Esta categoria já existe',
        variant: 'error',
        duration: 3000,
      })
      return
    }
    
    try {
      const response = await fetch('/api/products/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() })
      })
      
      if (response.ok) {
        const newCat = await response.json()
        setCategories([...categories, newCat])
        setNewCategory('')
        
        showToast({
          title: 'Categoria adicionada!',
          message: `A categoria "${newCat.name}" foi adicionada com sucesso`,
          variant: 'success',
          duration: 3000,
        })
      } else {
        throw new Error('Erro ao adicionar categoria')
      }
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error)
      showToast({
        title: 'Erro',
        message: 'Erro ao adicionar categoria',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  const removeCategory = async (categoryId: string, categoryName: string) => {
    try {
      const response = await fetch(`/api/products/categories?id=${categoryId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setCategories(categories.filter(cat => cat.id !== categoryId))
        
        showToast({
          title: 'Categoria removida!',
          message: `A categoria "${categoryName}" foi removida`,
          variant: 'success',
          duration: 3000,
        })
      } else {
        throw new Error('Erro ao remover categoria')
      }
    } catch (error) {
      console.error('Erro ao remover categoria:', error)
      showToast({
        title: 'Erro',
        message: 'Erro ao remover categoria',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCategory()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Produtos</h2>
        <div className="group relative">
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
            Configure a visibilidade e comportamento dos campos nos formulários de produtos.
          </div>
        </div>
      </div>

      {/* Seção de Categorias */}
      <div className="mb-8">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Categorias de Produtos</h3>
        <p className="text-sm text-gray-600 mb-4">
          Gerencie as categorias disponíveis para classificar seus produtos finais.
        </p>

        {/* Lista de categorias */}
        <div className="flex flex-wrap gap-2 mb-4">
          {loadingCategories ? (
            <p className="text-sm text-gray-500">Carregando categorias...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma categoria cadastrada</p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 py-3 px-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border"
                  style={{ 
                    backgroundColor: `${category.color || '#f97316'}10`,
                    borderColor: `${category.color || '#f97316'}40`
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color || '#f97316' }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">{category.name}</span>
                <button
                  onClick={() => removeCategory(category.id, category.name)}
                  className="hover:opacity-70 ml-2"
                  title="Remover categoria"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Adicionar nova categoria */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nova categoria"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 text-sm bg-white"
          />
          <button
            onClick={addCategory}
            disabled={!newCategory.trim() || categories.some(cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase())}
            className="btn-success disabled:opacity-50 disabled:cursor-not-allowed relative top-[-2px]"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Seção de Foto do Produto */}
      <div className="border-t border-gray-200 pt-6 mb-8">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Fotos</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure a visibilidade do campo de foto nos diferentes níveis de cadastro.
        </p>

        <div className="space-y-3">
          {/* Foto de Insumos */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label htmlFor="show-ingredient-photo" className="text-sm font-medium text-gray-900 cursor-pointer">
                Foto de Insumos
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Permite adicionar foto ao cadastrar ou editar insumos
              </p>
            </div>
            <Switch
              id="show-ingredient-photo"
              checked={showIngredientPhoto}
              onCheckedChange={handleIngredientPhotoToggle}
            />
          </div>

          {/* Foto de Bases */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label htmlFor="show-base-photo" className="text-sm font-medium text-gray-900 cursor-pointer">
                Foto de Bases de Preparo
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Permite adicionar foto ao cadastrar ou editar bases de preparo
              </p>
            </div>
            <Switch
              id="show-base-photo"
              checked={showBasePhoto}
              onCheckedChange={handleBasePhotoToggle}
            />
          </div>

          {/* Foto de Produtos */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label htmlFor="show-product-photo" className="text-sm font-medium text-gray-900 cursor-pointer">
                Foto de Produtos Finais
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Permite adicionar foto ao cadastrar ou editar produtos finais
              </p>
            </div>
            <Switch
              id="show-product-photo"
              checked={showProductPhoto}
              onCheckedChange={handleProductPhotoToggle}
            />
          </div>
        </div>
      </div>

      {/* Seção de Unidades de Medida */}
      <div className="border-t border-gray-200 pt-6 mb-8">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Unidades de Medida</h3>
        <p className="text-sm text-gray-600 mb-4">
          Escolha o sistema de unidades que será usado nos formulários e exibições.
        </p>

        <div className="space-y-3">
          <div 
            onClick={() => handleMeasurementUnitChange('metric-small')}
            className={`flex items-center justify-between py-3 px-4 rounded-lg cursor-pointer border-2 transition-all ${
              measurementUnit === 'metric-small' 
                ? 'bg-pink-50 border-[var(--color-clay-500)]' 
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Gramas / Mililitros</div>
              <p className="text-xs text-gray-500 mt-1">
                Usar g (gramas) e ml (mililitros) como unidades padrão
              </p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              measurementUnit === 'metric-small' 
                ? 'border-[var(--color-clay-500)] bg-[var(--color-clay-500)]' 
                : 'border-gray-300'
            }`}>
              {measurementUnit === 'metric-small' && (
                <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
              )}
            </div>
          </div>

          <div 
            onClick={() => handleMeasurementUnitChange('metric-large')}
            className={`flex items-center justify-between py-3 px-4 rounded-lg cursor-pointer border-2 transition-all ${
              measurementUnit === 'metric-large' 
                ? 'bg-pink-50 border-[var(--color-clay-500)]' 
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Quilogramas / Litros</div>
              <p className="text-xs text-gray-500 mt-1">
                Usar kg (quilogramas) e L (litros) como unidades padrão
              </p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              measurementUnit === 'metric-large' 
                ? 'border-[var(--color-clay-500)] bg-[var(--color-clay-500)]' 
                : 'border-gray-300'
            }`}>
              {measurementUnit === 'metric-large' && (
                <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Fator de Perda */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Fator de Perda</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure a visibilidade do campo &quot;Fator de Perda&quot; nos diferentes níveis de cadastro de produtos.
        </p>

        <div className="space-y-4">
          {/* Insumos */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label htmlFor="loss-factor-ingredients" className="text-sm font-medium text-gray-900 cursor-pointer">
                Insumos
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Exibir campo de fator de perda ao cadastrar insumos
              </p>
            </div>
            <Switch
              id="loss-factor-ingredients"
              checked={showLossFactorIngredients}
              onCheckedChange={handleIngredientsToggle}
            />
          </div>

          {/* Base de preparo */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label htmlFor="loss-factor-bases" className="text-sm font-medium text-gray-900 cursor-pointer">
                Base de preparo
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Exibir campo de fator de perda ao cadastrar bases de preparo
              </p>
            </div>
            <Switch
              id="loss-factor-bases"
              checked={showLossFactorBases}
              onCheckedChange={handleBasesToggle}
            />
          </div>

          {/* Produto final */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label htmlFor="loss-factor-products" className="text-sm font-medium text-gray-900 cursor-pointer">
                Produto final
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Exibir campo de fator de perda ao cadastrar produtos finais
              </p>
            </div>
            <Switch
              id="loss-factor-products"
              checked={showLossFactorProducts}
              onCheckedChange={handleProductsToggle}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
