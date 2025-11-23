'use client'

import { useState, useEffect } from 'react'
import { 
  X, Lightbulb, Cloud, ClipboardList, Shirt, Settings, Plane, Briefcase, 
  Music, Trophy, Newspaper, Sandwich, ChefHat, MessageCircle, Dices, MapPin, 
  Eye, Link, Heart, Flag, Utensils, Camera, Tag, ShoppingCart, Users, 
  Wrench, Plus, Home, BarChart, DollarSign, Lock, Car, Coffee, FileText, 
  MoreHorizontal, Palette, CreditCard, User, PawPrint, Shield, Sailboat, Star,
  Sun, Gift, Book, Hospital, Bus, Bird, Package, TreePine, Zap, Droplet,
  Flame, Wallet, PiggyBank, TrendingUp, Receipt, Coins, HandCoins, CircleDollarSign,
  Trash2, Check
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { showToast } from '@/app/(dashboard)/layout'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'receita' | 'despesa'
  onSuccess: () => void
  category?: {
    id: string
    name: string
    color: string
    icon: string
  }
}

const CATEGORY_ICONS = [
  { icon: Lightbulb, name: 'Lightbulb' },
  { icon: Cloud, name: 'Cloud' },
  { icon: ClipboardList, name: 'ClipboardList' },
  { icon: Shirt, name: 'Shirt' },
  { icon: Settings, name: 'Settings' },
  { icon: Plane, name: 'Plane' },
  { icon: Briefcase, name: 'Briefcase' },
  { icon: Music, name: 'Music' },
  { icon: Trophy, name: 'Trophy' },
  { icon: Newspaper, name: 'Newspaper' },
  { icon: Sandwich, name: 'Sandwich' },
  { icon: ChefHat, name: 'ChefHat' },
  { icon: MessageCircle, name: 'MessageCircle' },
  { icon: Dices, name: 'Dices' },
  { icon: MapPin, name: 'MapPin' },
  { icon: Eye, name: 'Eye' },
  { icon: Link, name: 'Link' },
  { icon: Heart, name: 'Heart' },
  { icon: Flag, name: 'Flag' },
  { icon: Utensils, name: 'Utensils' },
  { icon: Camera, name: 'Camera' },
  { icon: Tag, name: 'Tag' },
  { icon: ShoppingCart, name: 'ShoppingCart' },
  { icon: Users, name: 'Users' },
  { icon: Wrench, name: 'Wrench' },
  { icon: Plus, name: 'Plus' },
  { icon: Home, name: 'Home' },
  { icon: BarChart, name: 'BarChart' },
  { icon: DollarSign, name: 'DollarSign' },
  { icon: Lock, name: 'Lock' },
  { icon: Car, name: 'Car' },
  { icon: Coffee, name: 'Coffee' },
  { icon: FileText, name: 'FileText' },
  { icon: MoreHorizontal, name: 'MoreHorizontal' },
  { icon: Palette, name: 'Palette' },
  { icon: CreditCard, name: 'CreditCard' },
  { icon: User, name: 'User' },
  { icon: PawPrint, name: 'PawPrint' },
  { icon: Shield, name: 'Shield' },
  { icon: Sailboat, name: 'Sailboat' },
  { icon: Star, name: 'Star' },
  { icon: Sun, name: 'Sun' },
  { icon: Gift, name: 'Gift' },
  { icon: Book, name: 'Book' },
  { icon: Hospital, name: 'Hospital' },
  { icon: Bus, name: 'Bus' },
  { icon: Bird, name: 'Bird' },
  { icon: Package, name: 'Package' },
  { icon: TreePine, name: 'TreePine' },
  { icon: Zap, name: 'Zap' },
  { icon: Droplet, name: 'Droplet' },
  { icon: Flame, name: 'Flame' },
  { icon: Wallet, name: 'Wallet' },
  { icon: PiggyBank, name: 'PiggyBank' },
  { icon: TrendingUp, name: 'TrendingUp' },
  { icon: Receipt, name: 'Receipt' },
  { icon: Coins, name: 'Coins' },
  { icon: HandCoins, name: 'HandCoins' },
  { icon: CircleDollarSign, name: 'CircleDollarSign' },
]

const CATEGORY_COLORS = [
  '#E91E63', '#673AB7', '#2196F3', '#03A9F4', '#C2185B', '#F44336', '#FF8A80', '#3F51B5', '#4CAF50', '#FFAB91', '#F8BBD0',
  '#4CAF50', '#FF9800', '#FFC107', '#8B4513', '#90CAF9', '#9E9E9E', '#4DB6AC', '#2E7D32', '#80CBC4', '#C62828', '#795548'
]

export default function CategoryModal({ isOpen, onClose, type, onSuccess, category }: CategoryModalProps) {
  const [categoryName, setCategoryName] = useState(category?.name || '')
  const [selectedIcon, setSelectedIcon] = useState(category?.icon || 'Lightbulb')
  const [selectedColor, setSelectedColor] = useState(category?.color || '#6b7280')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [hasTransactions, setHasTransactions] = useState(false)
  
  // Update state when category prop changes
  useEffect(() => {
    if (category) {
      setCategoryName(category.name)
      setSelectedIcon(category.icon)
      setSelectedColor(category.color)
      // Check if category has transactions
      checkTransactions(category.id)
    } else {
      setCategoryName('')
      setSelectedIcon('Lightbulb')
      setSelectedColor('#6b7280')
      setHasTransactions(false)
    }
    setHasChanges(false)
  }, [category])

  const checkTransactions = async (categoryId: string) => {
    try {
      // Check if there are any orders using this category
      const response = await fetch(`/api/financeiro/categories/check-usage?id=${categoryId}`)
      if (response.ok) {
        const data = await response.json()
        setHasTransactions(data.hasTransactions || false)
      }
    } catch (error) {
      console.error('Error checking transactions:', error)
      setHasTransactions(false)
    }
  }

  // Track changes
  useEffect(() => {
    if (category) {
      const changed = 
        categoryName !== category.name ||
        selectedIcon !== category.icon ||
        selectedColor !== category.color
      setHasChanges(changed)
    }
  }, [categoryName, selectedIcon, selectedColor, category])

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      showToast({
        title: 'Campo obrigatório',
        message: 'Digite o nome da categoria',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const isEdit = !!category
      const url = isEdit ? `/api/financeiro/categories?id=${category.id}` : '/api/financeiro/categories'
      const method = isEdit ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          type,
          color: selectedColor,
          icon: selectedIcon,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao ${isEdit ? 'editar' : 'criar'} categoria`)
      }

      showToast({
        title: isEdit ? 'Categoria atualizada!' : 'Categoria criada!',
        message: `A categoria "${categoryName.trim()}" foi ${isEdit ? 'atualizada' : 'criada'} com sucesso`,
        variant: 'success',
        duration: 3000,
      })

      onSuccess()
      onClose()
      setCategoryName('')
      setSelectedIcon('Lightbulb')
      setSelectedColor('#6b7280')
    } catch (error) {
      console.error('Error saving category:', error)
      showToast({
        title: 'Erro',
        message: `Erro ao ${category ? 'editar' : 'criar'} categoria. Tente novamente.`,
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/financeiro/categories?id=${category!.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        showToast({
          title: 'Categoria excluída!',
          message: `A categoria "${category!.name}" foi excluída com sucesso`,
          variant: 'success',
          duration: 3000,
        })
        onSuccess()
        onClose()
      } else {
        throw new Error('Erro ao excluir categoria')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      showToast({
        title: 'Erro',
        message: 'Erro ao excluir categoria. Tente novamente.',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  if (!isOpen) return null

  const isEdit = !!category
  const title = isEdit 
    ? `Editar categoria de ${type === 'despesa' ? 'despesa' : 'receita'}`
    : type === 'despesa' ? 'Criar categoria de despesa' : 'Criar categoria de receita'
  const IconComponent = CATEGORY_ICONS.find(i => i.name === selectedIcon)?.icon || Lightbulb

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--color-bg-modal)] rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-bg-modal)] flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Tipo de categoria */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={true}
                  readOnly
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Categoria principal</span>
              </label>
              <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                <input
                  type="radio"
                  disabled
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-400">Subcategoria</span>
              </label>
            </div>

            {/* Nome da categoria */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${selectedColor}20` }}
              >
                <IconComponent className="w-7 h-7" style={{ color: selectedColor }} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da categoria
                </label>
                <Input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ex: Energia, Marketing..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-sm text-gray-500 bg-white"
                />
              </div>
            </div>

            {/* Escolha um ícone */}
            <div>
              <button
                type="button"
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-3 hover:text-gray-900 transition"
              >
                <span>Escolha um ícone</span>
              </button>
              <div className="grid grid-cols-10 gap-3 max-h-[200px] overflow-y-auto p-3 bg-gray-50 rounded-lg">
                {CATEGORY_ICONS.map(({ icon: Icon, name }, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedIcon(name)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                      selectedIcon === name
                        ? 'bg-gray-300 ring-2 ring-[var(--color-clay-500)]'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-gray-700" />
                  </button>
                ))}
              </div>
            </div>

            {/* Escolha uma cor */}
            <div>
              <button
                type="button"
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-3 hover:text-gray-900 transition"
              >
                <span>Escolha uma cor</span>
              </button>
              <div className="grid grid-cols-11 gap-3">
                {CATEGORY_COLORS.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                      selectedColor === color
                        ? 'ring-2 ring-gray-900 ring-offset-2'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 mt-6 justify-end p-6 border-t border-gray-200">
          {isEdit && (
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSubmitting || hasTransactions}
              className="btn-outline-danger disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir {type === 'despesa' ? 'Despesa' : 'Receita'}
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !categoryName.trim()}
            className="btn-success disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {isSubmitting 
              ? (isEdit ? 'Salvando...' : 'Criando...') 
              : (isEdit ? `Atualizar ${type === 'despesa' ? 'Despesa' : 'Receita'}` : `Adicionar ${type === 'despesa' ? 'Despesa' : 'Receita'}`)
            }
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {type === 'despesa' ? 'Despesa' : 'Receita'}</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-outline-grey">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="btn-danger">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
