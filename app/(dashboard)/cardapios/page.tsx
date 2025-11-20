'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Modal from '@/components/Modal'
import { showToast } from '@/app/(dashboard)/layout'
import PageLoading from '@/components/PageLoading'
import { 
  Plus, 
  Search,
  Filter,
  BookText,
  Trash2,
  Eye,
  Edit,
  Copy,
  Info,
  X,
  Check,
  ExternalLink,
  Link2,
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
} from "@/components/ui/alert-dialog"

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  image_url?: string
}

interface Menu {
  id: string
  name: string
  description?: string
  url_slug?: string
  items: MenuItem[]
  active: boolean
  created_at: string
  updated_at: string
}

export default function CardapiosPage() {
  const router = useRouter()
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewMenuModal, setShowNewMenuModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null)
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [customUrlSlug, setCustomUrlSlug] = useState<string>('')

  // Form state
  const [menuName, setMenuName] = useState('')
  const [menuDescription, setMenuDescription] = useState('')
  const [menuUrlSlug, setMenuUrlSlug] = useState('')

  // Função para gerar slug da URL
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, '') // Remove hífens do início e fim
  }

  // Atualiza o slug quando o nome muda
  const handleMenuNameChange = (value: string) => {
    setMenuName(value)
    setMenuUrlSlug(generateSlug(value))
  }

  useEffect(() => {
    loadMenus()
    loadProfileSettings()
  }, [])

  const loadProfileSettings = async () => {
    try {
      const response = await fetch('/api/profile-settings')
      if (response.ok) {
        const data = await response.json()
        setCustomUrlSlug(data.custom_url_slug || '')
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const loadMenus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/menus')
      if (response.ok) {
        const data = await response.json()
        setMenus(data)
      } else {
        console.error('Erro ao carregar cardápios')
      }
    } catch (error) {
      console.error('Erro ao carregar cardápios:', error)
      showToast({
        title: 'Erro',
        message: 'Não foi possível carregar os cardápios',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMenu = async () => {
    if (!menuName.trim()) {
      showToast({
        title: 'Atenção',
        message: 'Por favor, preencha o nome do cardápio',
        variant: 'error',
      })
      return
    }

    if (!menuUrlSlug.trim()) {
      showToast({
        title: 'Atenção',
        message: 'A URL do cardápio é obrigatória',
        variant: 'error',
      })
      return
    }

    try {
      const response = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: menuName,
          description: menuDescription || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar cardápio')
      }

      const newMenu = await response.json()
      
      const fullUrl = customUrlSlug 
        ? `sotasty.com.br/${customUrlSlug}/${newMenu.url_slug}`
        : `sotasty.com.br/[sua-url]/${newMenu.url_slug}`
      
      showToast({
        title: 'Sucesso!',
        message: `Cardápio criado: ${fullUrl}`,
        variant: 'success',
        duration: 4000,
      })
      
      setShowNewMenuModal(false)
      resetForm()
      loadMenus() // Recarregar lista
    } catch (error) {
      console.error('Erro ao criar cardápio:', error)
      showToast({
        title: 'Erro',
        message: error instanceof Error ? error.message : 'Não foi possível criar o cardápio',
        variant: 'error',
      })
    }
  }

  const handleDeleteMenu = async () => {
    if (!menuToDelete) return

    try {
      // TODO: Implementar chamada à API
      // await fetch(`/api/menus/${menuToDelete}`, { method: 'DELETE' })
      
      showToast({
        title: 'Sucesso!',
        message: 'Cardápio excluído com sucesso',
        variant: 'success',
      })
      setShowDeleteDialog(false)
      setMenuToDelete(null)
      loadMenus()
    } catch (error) {
      console.error('Erro ao excluir cardápio:', error)
      showToast({
        title: 'Erro',
        message: 'Não foi possível excluir o cardápio',
        variant: 'error',
      })
    }
  }

  const resetForm = () => {
    setMenuName('')
    setMenuDescription('')
    setMenuUrlSlug('')
  }

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const clearFilters = () => {
    setStatusFilters([])
  }

  const activeFiltersCount = statusFilters.length

  const filteredMenus = menus.filter(menu => {
    const matchesSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         menu.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilters.length === 0 || 
                         statusFilters.includes(menu.active ? 'Ativo' : 'Inativo')
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <PageLoading />
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Cardápios</h1>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
              Crie e gerencie seus cardápios digitais. Monte cardápios personalizados com seus produtos para facilitar a visualização e pedidos dos seus clientes.
            </div>
          </div>
        </div>
        <Button
          onClick={() => router.push('/cardapios/novo')}
          className="bg-[var(--color-old-rose)] text-white hover:bg-[var(--color-rosy-brown)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cardápio
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar cardápios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            {/* Status Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 h-10 cursor-pointer"
              >
                <Filter className="h-4 w-4 mr-2" />
                Status
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 h-5 min-w-5 px-1.5 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </button>

              {showStatusDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowStatusDropdown(false)}
                  />
                  <div className="absolute top-full mt-2 right-0 bg-[var(--color-bg-modal)] border border-gray-200 rounded-lg shadow-lg p-2 z-20 min-w-[180px]">
                    <button
                      onClick={() => toggleStatusFilter('Ativo')}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50 rounded"
                    >
                      <span className="text-sm">Ativo</span>
                      {statusFilters.includes('Ativo') && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleStatusFilter('Inativo')}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50 rounded"
                    >
                      <span className="text-sm">Inativo</span>
                      {statusFilters.includes('Inativo') && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 cursor-pointer"
                onClick={clearFilters}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-600">Filtros ativos:</span>
            {statusFilters.map((filter) => (
              <div
                key={filter}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-[var(--color-lavender-blush)] text-[var(--color-old-rose)] border-[var(--color-old-rose)]"
              >
                <span className="text-xs font-medium">{filter}</span>
                <button
                  onClick={() => toggleStatusFilter(filter)}
                  className="hover:opacity-70"
                  title="Remover filtro"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Menus List/Grid */}
      {filteredMenus.length === 0 ? (
        <div className="text-center py-12">
          <BookText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum cardápio encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery
              ? 'Tente ajustar a busca'
              : 'Comece criando seu primeiro cardápio'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenus.map((menu) => (
            <div
              key={menu.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {menu.name}
                  </h3>
                  {menu.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                      {menu.description}
                    </p>
                  )}
                  
                  {/* URL do Cardápio */}
                  {menu.url_slug && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-lg">
                      <Link2 className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600 font-mono truncate">
                        {customUrlSlug ? `sotasty.com.br/${customUrlSlug}/${menu.url_slug}` : `sotasty.com.br/[sua-url]/${menu.url_slug}`}
                      </span>
                      <button
                        onClick={() => {
                          const url = customUrlSlug 
                            ? `https://sotasty.com.br/${customUrlSlug}/${menu.url_slug}`
                            : `https://sotasty.com.br/[sua-url]/${menu.url_slug}`
                          navigator.clipboard.writeText(url)
                          showToast({
                            title: 'URL copiada!',
                            message: 'Link do cardápio copiado para a área de transferência',
                            variant: 'success',
                            duration: 2000,
                          })
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>
                <Badge variant={menu.active ? 'default' : 'secondary'}>
                  {menu.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  {menu.items.length} {menu.items.length === 1 ? 'item' : 'itens'}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Cardápio */}
      <Modal 
        isOpen={showNewMenuModal}
        onClose={() => setShowNewMenuModal(false)}
        title="Novo Cardápio"
      >
        <div className="space-y-4">
          {!customUrlSlug && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800">
                  <strong>Configure sua URL personalizada</strong> em Configurações &gt; Preferências 
                  para ativar o link público do cardápio.
                </p>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Cardápio *
            </label>
            <Input
              value={menuName}
              onChange={(e) => handleMenuNameChange(e.target.value)}
              placeholder="Ex: Cardápio de Bolos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL do Cardápio *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">
                sotasty.com.br/{customUrlSlug || '[sua-url]'}/
              </span>
              <Input
                value={menuUrlSlug}
                onChange={(e) => setMenuUrlSlug(generateSlug(e.target.value))}
                placeholder="cardapio-bolos"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              URL gerada automaticamente. Você pode editá-la se desejar.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={menuDescription}
              onChange={(e) => setMenuDescription(e.target.value)}
              placeholder="Descreva seu cardápio..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewMenuModal(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateMenu}
              className="bg-gradient-to-r from-[var(--color-old-rose)] to-[var(--color-melon)] hover:opacity-90 text-white"
            >
              Criar Cardápio
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cardápio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMenuToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMenu}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
