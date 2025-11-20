'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Info, GripVertical, Lightbulb, Cloud, ClipboardList, Shirt, Settings, Plane, Briefcase, 
  Music, Trophy, Newspaper, Sandwich, ChefHat, MessageCircle, Dices, MapPin, 
  Eye, Link, Heart, Flag, Utensils, Camera, Tag, ShoppingCart, Users, 
  Wrench, Home, BarChart, DollarSign, Lock, Car, Coffee, FileText, 
  MoreHorizontal, Palette, CreditCard, User, PawPrint, Shield, Sailboat, Star,
  Sun, Gift, Book, Hospital, Bus, Bird, Package, TreePine, Zap, Droplet,
  Flame, Wallet, PiggyBank, TrendingUp, Receipt, Coins, HandCoins, CircleDollarSign 
} from 'lucide-react'
import { showToast } from '@/app/(dashboard)/layout'
import CategoryModal from '@/components/financeiro/CategoryModal'
import { Sortable, SortableItem, SortableItemHandle } from '@/components/ui/sortable'

const ICON_MAP: Record<string, any> = {
  Lightbulb, Cloud, ClipboardList, Shirt, Settings, Plane, Briefcase,
  Music, Trophy, Newspaper, Sandwich, ChefHat, MessageCircle, Dices, MapPin,
  Eye, Link, Heart, Flag, Utensils, Camera, Tag, ShoppingCart, Users,
  Wrench, Plus, Home, BarChart, DollarSign, Lock, Car, Coffee, FileText,
  MoreHorizontal, Palette, CreditCard, User, PawPrint, Shield, Sailboat, Star,
  Sun, Gift, Book, Hospital, Bus, Bird, Package, TreePine, Zap, Droplet,
  Flame, Wallet, PiggyBank, TrendingUp, Receipt, Coins, HandCoins, CircleDollarSign
}

interface Category {
  id: string
  name: string
  type: 'receita' | 'despesa'
  color: string
  icon?: string
  is_system: boolean
  parent_id?: string | null
  sort_order?: number
}

function TabInitializer({ onTabChange }: { onTabChange: (tab: 'despesas' | 'receitas' | 'contas') => void }) {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'receitas' || tab === 'despesas' || tab === 'contas') {
      onTabChange(tab)
    }
  }, [searchParams, onTabChange])
  
  return null
}

function FinanceiroSettingsContent() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [activeTab, setActiveTab] = useState<'despesas' | 'receitas' | 'contas'>('despesas')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null)
  const [dragOverSubcategory, setDragOverSubcategory] = useState<string | null>(null)
  const [dropPositionSub, setDropPositionSub] = useState<'before' | 'after' | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await fetch('/api/financeiro/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
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

  const addCategory = async () => {
    setEditingCategory(null)
    setShowCategoryModal(true)
  }

  const editCategory = (category: Category) => {
    setEditingCategory(category)
    setShowCategoryModal(true)
  }

  const handleCategorySuccess = () => {
    fetchCategories()
    setEditingCategory(null)
  }

  const removeCategory = async (categoryId: string, categoryName: string) => {
    try {
      const response = await fetch(`/api/financeiro/categories?id=${categoryId}`, {
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

  const filteredCategories = categories.filter(cat => 
    cat.type === (activeTab === 'despesas' ? 'despesa' : 'receita')
  )

  // Separate parent and subcategories
  const parentCategories = filteredCategories.filter(cat => !cat.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  const getSubcategories = (parentId: string) => 
    filteredCategories.filter(cat => cat.parent_id === parentId).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  const handleDragOver = (e: React.DragEvent, categoryId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!categoryId) {
      setDragOverCategory('root')
      setDropPosition(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const mouseY = e.clientY - rect.top
    const height = rect.height
    
    // Determine drop position based on mouse position
    if (mouseY < height * 0.25) {
      // Top 25% - drop before
      setDropPosition('before')
    } else if (mouseY > height * 0.75) {
      // Bottom 25% - drop after
      setDropPosition('after')
    } else {
      // Middle 50% - drop inside (make subcategory)
      setDropPosition('inside')
    }
    
    setDragOverCategory(categoryId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCategory(null)
    setDropPosition(null)
  }

  const handleSubcategoryDragOver = (e: React.DragEvent, subcategoryId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseY = e.clientY - rect.top
    const height = rect.height
    
    // For subcategories, only before/after (no inside)
    if (mouseY < height * 0.5) {
      setDropPositionSub('before')
    } else {
      setDropPositionSub('after')
    }
    
    setDragOverSubcategory(subcategoryId)
  }

  const handleSubcategoryDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverSubcategory(null)
    setDropPositionSub(null)
  }

  const handleSubcategoryDrop = async (e: React.DragEvent, targetSubcategoryId: string, parentId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const position = dropPositionSub
    setDragOverSubcategory(null)
    setDropPositionSub(null)

    const draggedId = e.dataTransfer.getData('categoryId')
    if (!draggedId || draggedId === targetSubcategoryId) return

    const draggedCategory = categories.find(c => c.id === draggedId)
    const targetCategory = categories.find(c => c.id === targetSubcategoryId)
    
    if (!draggedCategory || !targetCategory) return

    try {
      // Get all subcategories of this parent
      const subcategories = filteredCategories
        .filter(cat => cat.parent_id === parentId)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      
      // Find target index
      const targetIndex = subcategories.findIndex(cat => cat.id === targetSubcategoryId)
      const newIndex = position === 'before' ? targetIndex : targetIndex + 1
      
      // Remove dragged from current position if it's in the same parent
      const currentIndex = subcategories.findIndex(cat => cat.id === draggedId)
      if (currentIndex !== -1) {
        subcategories.splice(currentIndex, 1)
      }
      
      // Insert at new position
      subcategories.splice(currentIndex !== -1 && currentIndex < newIndex ? newIndex - 1 : newIndex, 0, draggedCategory)
      
      // Update sort_order for all subcategories
      const updates = subcategories.map((cat, index) => 
        fetch(`/api/financeiro/categories?id=${cat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            parent_id: parentId,
            sort_order: index 
          }),
        })
      )
      
      await Promise.all(updates)
      fetchCategories()
      
      showToast({
        title: 'Subcategoria reordenada!',
        message: `"${draggedCategory.name}" foi movida`,
        variant: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Error reordering subcategory:', error)
      showToast({
        title: 'Erro',
        message: 'Erro ao reordenar subcategoria',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  const handleDrop = async (e: React.DragEvent, targetCategoryId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const position = dropPosition
    setDragOverCategory(null)
    setDropPosition(null)

    const draggedId = e.dataTransfer.getData('categoryId')
    if (!draggedId) return

    const draggedCategory = categories.find(c => c.id === draggedId)
    if (!draggedCategory) return

    // Drop on root area - make it a parent category
    if (!targetCategoryId) {
      if (!draggedCategory.parent_id) return // Already a parent
      
      try {
        const response = await fetch(`/api/financeiro/categories?id=${draggedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parent_id: null }),
        })

        if (response.ok) {
          fetchCategories()
          showToast({
            title: 'Categoria promovida!',
            message: `"${draggedCategory.name}" agora é uma categoria principal`,
            variant: 'success',
            duration: 3000,
          })
        }
      } catch (error) {
        console.error('Error promoting category:', error)
        showToast({
          title: 'Erro',
          message: 'Erro ao promover categoria',
          variant: 'error',
          duration: 3000,
        })
      }
      return
    }

    if (draggedId === targetCategoryId) return

    const targetCategory = categories.find(c => c.id === targetCategoryId)
    if (!targetCategory) return

    // Prevent making a parent its own child
    if (targetCategory.parent_id === draggedId) return

    try {
      // If dropping before/after, reorder at same level
      if (position === 'before' || position === 'after') {
        const targetParentId = targetCategory.parent_id
        
        // Get all categories at the same level
        const sameLevelCategories = filteredCategories
          .filter(cat => cat.parent_id === targetParentId)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        
        // Find target index
        const targetIndex = sameLevelCategories.findIndex(cat => cat.id === targetCategoryId)
        const newIndex = position === 'before' ? targetIndex : targetIndex + 1
        
        // Remove dragged from current position if it's in the same level
        const currentIndex = sameLevelCategories.findIndex(cat => cat.id === draggedId)
        if (currentIndex !== -1) {
          sameLevelCategories.splice(currentIndex, 1)
        }
        
        // Insert at new position
        sameLevelCategories.splice(currentIndex !== -1 && currentIndex < newIndex ? newIndex - 1 : newIndex, 0, draggedCategory)
        
        // Update sort_order for all categories at this level
        const updates = sameLevelCategories.map((cat, index) => 
          fetch(`/api/financeiro/categories?id=${cat.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              parent_id: targetParentId,
              sort_order: index 
            }),
          })
        )
        
        await Promise.all(updates)
        fetchCategories()
        
        showToast({
          title: 'Categoria reordenada!',
          message: `"${draggedCategory.name}" foi movida`,
          variant: 'success',
          duration: 3000,
        })
      } 
      // If dropping inside, make it a subcategory
      else if (position === 'inside') {
        const response = await fetch(`/api/financeiro/categories?id=${draggedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parent_id: targetCategoryId }),
        })

        if (response.ok) {
          fetchCategories()
          showToast({
            title: 'Subcategoria criada!',
            message: `"${draggedCategory.name}" agora é subcategoria de "${targetCategory.name}"`,
            variant: 'success',
            duration: 3000,
          })
        }
      }
    } catch (error) {
      console.error('Error updating category:', error)
      showToast({
        title: 'Erro',
        message: 'Erro ao atualizar categoria',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    e.dataTransfer.setData('categoryId', categoryId)
  }

  const reorderSubcategories = async (parentId: string, subcategories: Category[]) => {
    try {
      // Update sort_order for each subcategory
      const updates = subcategories.map((subcat, index) => 
        fetch(`/api/financeiro/categories?id=${subcat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: index }),
        })
      )
      
      await Promise.all(updates)
      fetchCategories()
    } catch (error) {
      console.error('Error reordering subcategories:', error)
    }
  }

  const makeParentCategory = async (categoryId: string, categoryName: string) => {
    try {
      const response = await fetch(`/api/financeiro/categories?id=${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: null,
        }),
      })

      if (response.ok) {
        fetchCategories()
        showToast({
          title: 'Categoria atualizada!',
          message: `"${categoryName}" agora é uma categoria principal`,
          variant: 'success',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <Suspense fallback={null}>
        <TabInitializer onTabChange={setActiveTab} />
      </Suspense>
      
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Financeiro</h2>
        <div className="group relative">
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
            Gerencie as categorias de receitas e despesas. Categorias do sistema não podem ser removidas.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('despesas')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:outline-none ${
              activeTab === 'despesas'
                ? 'border-[#D67973] text-[#D67973]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Despesas
          </button>
          <button
            onClick={() => setActiveTab('receitas')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:outline-none ${
              activeTab === 'receitas'
                ? 'border-[#85A87E] text-[#85A87E]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Receitas
          </button>
          <button
            onClick={() => setActiveTab('contas')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:outline-none ${
              activeTab === 'contas'
                ? 'border-[var(--color-clay-500)] text-[var(--color-clay-500)]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Contas
          </button>
        </div>
      </div>

      {/* Seção de Categorias */}
      {activeTab !== 'contas' && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-gray-900">
              Categorias de {activeTab === 'despesas' ? 'Despesas' : 'Receitas'}
            </h3>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
              Organize suas transações financeiras em categorias para melhor controle e análise.
            </div>
          </div>
        </div>

        {/* Lista de categorias */}
        <div 
          className={`space-y-2 mb-6 rounded-lg border-2 border-dashed transition-colors p-2 ${
            dragOverCategory === 'root' 
              ? 'border-[var(--color-clay-500)] bg-[var(--color-clay-500)]/5' 
              : 'border-transparent'
          }`}
          onDragOver={(e) => handleDragOver(e)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e)}
        >
          {loadingCategories ? (
            <p className="text-sm text-gray-500 py-8 text-center">Carregando categorias...</p>
          ) : parentCategories.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Nenhuma categoria cadastrada</p>
          ) : (
            <Sortable
              value={parentCategories}
              onValueChange={(newCategories) => {
                setCategories([
                  ...categories.filter(c => c.type !== (activeTab === 'despesas' ? 'despesa' : 'receita') || c.parent_id),
                  ...newCategories
                ])
              }}
              getItemValue={(category) => category.id}
              strategy="vertical"
              className="space-y-2"
            >
              {parentCategories.map((category) => {
                const IconComponent = category.icon ? ICON_MAP[category.icon] : null
                const subcategories = getSubcategories(category.id)
                
                return (
                <div key={category.id} className="relative">
                  {/* Drop indicator before */}
                  {dragOverCategory === category.id && dropPosition === 'before' && (
                    <div className="absolute -top-1 left-0 right-0 h-0.5 bg-[var(--color-clay-500)] z-10 rounded-full" />
                  )}
                  
                  <SortableItem value={category.id}>
                    <div 
                      className={`rounded-lg border transition-all bg-white overflow-hidden ${
                        dragOverCategory === category.id && dropPosition === 'inside'
                          ? 'border-[var(--color-clay-500)] bg-[var(--color-clay-500)]/5 border-2' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onDragOver={(e) => handleDragOver(e, category.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, category.id)}
                    >
                      {/* Parent Category */}
                      <div
                        className="flex items-center gap-3 py-3 px-4 bg-white"
                        draggable
                        onDragStart={(e) => handleDragStart(e, category.id)}
                      >
                        <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        
                        <button
                          onClick={() => editCategory(category)}
                          className="flex items-center gap-3 flex-1 text-left focus:outline-none cursor-pointer"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center border"
                            style={{ 
                              backgroundColor: `${category.color}10`,
                              borderColor: `${category.color}40`
                            }}
                          >
                            {IconComponent ? (
                              <IconComponent className="w-[19px] h-[19px]" style={{ color: category.color }} />
                            ) : (
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        </button>
                        
                        {subcategories.length > 0 && (
                          <span className="text-xs text-gray-500">({subcategories.length})</span>
                        )}
                      </div>
                      
                      {/* Subcategories inside the same box */}
                      {subcategories.length > 0 && (
                        <Sortable
                          value={subcategories}
                          onValueChange={(newSubcategories) => {
                            reorderSubcategories(category.id, newSubcategories)
                          }}
                          getItemValue={(subcat) => subcat.id}
                          strategy="vertical"
                          className="bg-gray-50/50"
                        >
                          {subcategories.map((subcat, index) => {
                            const SubIconComponent = subcat.icon ? ICON_MAP[subcat.icon] : null
                            
                            return (
                              <div key={subcat.id} className="relative">
                                {/* Drop indicator before subcategory */}
                                {dragOverSubcategory === subcat.id && dropPositionSub === 'before' && (
                                  <div className="absolute -top-0.5 left-4 right-4 h-0.5 bg-[var(--color-clay-500)] z-10 rounded-full" />
                                )}
                                
                                <SortableItem value={subcat.id}>
                                  <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, subcat.id)}
                                    onDragOver={(e) => handleSubcategoryDragOver(e, subcat.id)}
                                    onDragLeave={handleSubcategoryDragLeave}
                                    onDrop={(e) => handleSubcategoryDrop(e, subcat.id, category.id)}
                                    className="flex items-center gap-3 py-3 px-4 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-move border-t border-gray-100"
                                  >
                                    <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </div>
                                    
                                    <button
                                      onClick={() => editCategory(subcat)}
                                      className="flex items-center gap-3 flex-1 text-left focus:outline-none cursor-pointer"
                                    >
                                      <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center border"
                                        style={{ 
                                          backgroundColor: `${subcat.color}10`,
                                          borderColor: `${subcat.color}40`
                                        }}
                                      >
                                        {SubIconComponent ? (
                                          <SubIconComponent className="w-4 h-4" style={{ color: subcat.color }} />
                                        ) : (
                                          <div
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ backgroundColor: subcat.color }}
                                          />
                                        )}
                                      </div>
                                      <span className="text-sm text-gray-700">{subcat.name}</span>
                                    </button>
                                  </div>
                                </SortableItem>
                                
                                {/* Drop indicator after subcategory */}
                                {dragOverSubcategory === subcat.id && dropPositionSub === 'after' && (
                                  <div className="absolute -bottom-0.5 left-4 right-4 h-0.5 bg-[var(--color-clay-500)] z-10 rounded-full" />
                                )}
                              </div>
                            )
                          })}
                        </Sortable>
                      )}
                    </div>
                  </SortableItem>
                  
                  {/* Drop indicator after */}
                  {dragOverCategory === category.id && dropPosition === 'after' && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--color-clay-500)] z-10 rounded-full" />
                  )}
                </div>
              )})}
            </Sortable>
          )}
        </div>

        {/* Adicionar nova categoria */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={addCategory}
            className="btn-success w-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Nova Categoria
          </button>
        </div>
        </div>
      )}

      {/* Seção de Contas */}
      {activeTab === 'contas' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              Contas e Cartões de Crédito
            </h3>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
                Gerencie suas contas bancárias e cartões de crédito para controlar melhor suas finanças.
              </div>
            </div>
          </div>

          <div className="text-center py-12 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Funcionalidade em desenvolvimento</p>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {activeTab !== 'contas' && (
        <CategoryModal
          isOpen={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false)
            setEditingCategory(null)
          }}
          type={activeTab === 'despesas' ? 'despesa' : 'receita'}
          onSuccess={handleCategorySuccess}
          category={editingCategory ? {
            id: editingCategory.id,
            name: editingCategory.name,
            color: editingCategory.color,
            icon: editingCategory.icon || 'Lightbulb'
          } : undefined}
        />
      )}
    </div>
  )
}

export default function FinanceiroSettingsPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">Carregando...</div>}>
      <FinanceiroSettingsContent />
    </Suspense>
  )
}
