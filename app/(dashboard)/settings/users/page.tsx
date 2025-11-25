'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, User, Users, Crown, UserCheck, Info, X, Check, UserRound } from 'lucide-react'
import { showToast } from '@/app/(dashboard)/layout'
import { createClient } from '@/lib/supabase/client'
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

interface Member {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  role: string
  permissions: UserPermissions | null
  created_at: string
}

interface UserPermissions {
  dashboard: boolean
  products: boolean
  menus: boolean
  orders: boolean
  financial: boolean
  messages: boolean
  support: boolean
  customers: boolean
  agenda: boolean
  activities: boolean
}

const defaultPermissions: UserPermissions = {
  dashboard: false,
  products: false,
  menus: false,
  orders: false,
  financial: false,
  messages: false,
  support: false,
  customers: false,
  agenda: false,
  activities: false,
}

const permissionLabels: Record<keyof UserPermissions, string> = {
  dashboard: 'Dashboard',
  products: 'Produtos',
  menus: 'Cardápios',
  orders: 'Pedidos',
  financial: 'Financeiro',
  messages: 'Mensagens',
  support: 'Atendimento',
  customers: 'Clientes',
  agenda: 'Agenda',
  activities: 'Atividades',
}

export default function UsersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState<'admin' | 'member'>('member')
  const [userPermissions, setUserPermissions] = useState<UserPermissions>(defaultPermissions)
  const [creating, setCreating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<{ id: string, name: string } | null>(null)
  
  // Estados para edição de permissões
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [editPermissions, setEditPermissions] = useState<UserPermissions>(defaultPermissions)
  const [originalPermissions, setOriginalPermissions] = useState<UserPermissions>(defaultPermissions)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  // Fechar modais com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false)
          setUserEmail('')
          setUserName('')
          setUserRole('member')
          setUserPermissions(defaultPermissions)
        }
        if (isEditModalOpen) {
          setIsEditModalOpen(false)
          setEditingMember(null)
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isModalOpen, isEditModalOpen])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/users/members')
      if (response.ok) {
        const data = await response.json()
        
        // Buscar URLs públicas dos avatares
        const supabase = createClient()
        const membersWithAvatars = data.map((member: Member) => {
          if (member.avatar_url) {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(member.avatar_url)
            return { ...member, avatar_url: publicUrl }
          }
          return member
        })
        
        setMembers(membersWithAvatars)
      }
    } catch (error) {
      console.error('Erro ao buscar membros:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userEmail || !userEmail.includes('@')) {
      showToast({
        title: 'E-mail inválido',
        message: 'Por favor, insira um e-mail válido',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/users/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userEmail, 
          role: userRole,
          full_name: userName || userEmail.split('@')[0],
          permissions: userRole === 'admin' ? null : userPermissions
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        showToast({
          title: 'Usuário criado!',
          message: `${userName || userEmail} foi adicionado. Senha temporária: ${data.temporaryPassword}`,
          variant: 'success',
          duration: 10000,
        })
        setUserEmail('')
        setUserName('')
        setUserRole('member')
        setUserPermissions(defaultPermissions)
        setIsModalOpen(false)
        fetchMembers()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar usuário')
      }
    } catch (error: any) {
      showToast({
        title: 'Erro ao criar usuário',
        message: error.message,
        variant: 'error',
        duration: 4000,
      })
    } finally {
      setCreating(false)
    }
  }

  const togglePermission = (permission: keyof UserPermissions) => {
    setUserPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }))
  }

  const toggleAllPermissions = () => {
    const allEnabled = Object.values(userPermissions).every(v => v)
    const newPermissions = (Object.keys(permissionLabels) as Array<keyof UserPermissions>).reduce((acc, key) => ({
      ...acc,
      [key]: !allEnabled
    }), {} as UserPermissions)
    setUserPermissions(newPermissions)
  }

  const handleDeleteMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/users/members?id=${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast({
          title: 'Membro removido!',
          message: 'O membro foi removido do workspace',
          variant: 'success',
          duration: 3000,
        })
        fetchMembers()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao remover membro')
      }
    } catch (error: any) {
      showToast({
        title: 'Erro ao remover membro',
        message: error.message,
        variant: 'error',
        duration: 4000,
      })
    }
  }

  const confirmDelete = () => {
    if (!memberToDelete) return

    handleDeleteMember(memberToDelete.id)
    setDeleteDialogOpen(false)
    setMemberToDelete(null)
  }

  const handleEditPermissions = (member: Member) => {
    setEditingMember(member)
    // Garantir que todas as permissões existam, mesmo que não estejam no banco
    const currentPermissions = member.permissions || {}
    const completePermissions = {
      ...defaultPermissions,
      ...currentPermissions
    }
    setEditPermissions(completePermissions)
    setOriginalPermissions(completePermissions)
    setIsEditModalOpen(true)
  }

  const hasPermissionChanges = () => {
    return JSON.stringify(editPermissions) !== JSON.stringify(originalPermissions)
  }

  const handleUpdatePermissions = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingMember) return


    setUpdating(true)

    try {
      const response = await fetch(`/api/users/members/${editingMember.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: editPermissions })
      })

      const result = await response.json()

      if (response.ok) {
        showToast({
          title: 'Permissões atualizadas!',
          message: `Permissões de ${editingMember.full_name || editingMember.email} foram atualizadas`,
          variant: 'success',
          duration: 3000,
        })
        setIsEditModalOpen(false)
        setEditingMember(null)
        fetchMembers()
      } else {
        throw new Error(result.error || 'Erro ao atualizar permissões')
      }
    } catch (error: any) {
      console.error('Erro capturado:', error)
      showToast({
        title: 'Erro ao atualizar permissões',
        message: error.message,
        variant: 'error',
        duration: 4000,
      })
    } finally {
      setUpdating(false)
    }
  }

  const toggleEditPermission = (permission: keyof UserPermissions) => {
    setEditPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }))
  }

  const toggleAllEditPermissions = () => {
    const allEnabled = Object.values(editPermissions).every(v => v)
    const newPermissions = (Object.keys(permissionLabels) as Array<keyof UserPermissions>).reduce((acc, key) => ({
      ...acc,
      [key]: !allEnabled
    }), {} as UserPermissions)
    setEditPermissions(newPermissions)
  }

  const getPermissionsSummary = (permissions: UserPermissions | null, role: string) => {
    if (role === 'admin' || role === 'superadmin') {
      return 'Acesso Total'
    }
    
    if (!permissions) {
      return 'Sem permissões'
    }

    const activePermissions = Object.entries(permissions)
      .filter(([_, value]) => value)
      .map(([key]) => permissionLabels[key as keyof UserPermissions])

    if (activePermissions.length === 0) {
      return 'Sem permissões'
    }

    if (activePermissions.length === Object.keys(permissionLabels).length) {
      return 'Todas as permissões'
    }

    return activePermissions.slice(0, 3).join(', ') + (activePermissions.length > 3 ? ` +${activePermissions.length - 3}` : '')
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Crown className="w-3 h-3" />
            Super Admin
          </span>
        )
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <UserCheck className="w-3 h-3" />
            Administrador
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <User className="w-3 h-3" />
            Membro
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Botão para abrir modal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Adicionar Usuário</h2>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
                  Adicione pessoas para colaborar no seu workspace com permissões específicas para cada área.
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-success"
          >
            <Plus className="w-4 h-4 mr-1" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Modal de criação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setIsModalOpen(false)
              setUserEmail('')
              setUserName('')
              setUserRole('member')
              setUserPermissions(defaultPermissions)
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-[var(--color-bg-modal)] rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden" style={{ maxWidth: '600px' }}>
            {/* Header */}
            <div className="sticky top-0 bg-[var(--color-bg-modal)] border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Novo Usuário</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setUserEmail('')
                  setUserName('')
                  setUserRole('member')
                  setUserPermissions(defaultPermissions)
                }}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500 transition-colors bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Nome"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500 transition-colors bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Acesso
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 overflow-hidden" style={{ borderColor: userRole === 'admin' ? 'var(--color-clay-500)' : '#e5e7eb', backgroundColor: userRole === 'admin' ? 'white' : 'transparent' }}>
                    <input
                      type="radio"
                      name="userRole"
                      value="admin"
                      checked={userRole === 'admin'}
                      onChange={(e) => setUserRole(e.target.value as 'admin')}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="font-medium text-gray-900">Administrador</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Acesso total: Planos, Usuários, Perfil (Estabelecimento e Horários), além de todas as funcionalidades</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 overflow-hidden" style={{ borderColor: userRole === 'member' ? 'var(--color-clay-500)' : '#e5e7eb', backgroundColor: userRole === 'member' ? 'white' : 'transparent' }}>
                    <input
                      type="radio"
                      name="userRole"
                      value="member"
                      checked={userRole === 'member'}
                      onChange={(e) => setUserRole(e.target.value as 'member')}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span className="font-medium text-gray-900">Membro</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Acesso personalizado com permissões específicas para cada área</p>
                    </div>
                  </label>
                </div>
              </div>

              {userRole === 'member' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Permissões de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={toggleAllPermissions}
                      className="text-xs text-[var(--color-clay-500)] hover:text-[var(--color-clay-600)] font-medium"
                    >
                      {Object.values(userPermissions).every(v => v) ? 'Desmarcar todas' : 'Marcar todas'}
                    </button>
                  </div>
                  <div>
                    {(Object.keys(permissionLabels) as Array<keyof UserPermissions>).map((permission, index, array) => (
                      <label
                        key={permission}
                        className={`flex items-center gap-3 pr-2 py-1.5 cursor-pointer transition-colors ${index !== array.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={userPermissions[permission]}
                          onChange={() => togglePermission(permission)}
                          className="w-4 h-4 text-[var(--color-clay-500)] border-gray-300 rounded focus:ring-[var(--color-clay-500)]"
                        />
                        <span className="text-sm text-gray-700 flex-1">{permissionLabels[permission]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={creating || !userEmail}
                  className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Salvar Usuário
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de membros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Membros</h2>
          <span className="text-sm text-gray-500">({members.length})</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum membro encontrado</div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                onClick={() => {
                  if (member.role === 'member') {
                    handleEditPermissions(member)
                  }
                }}
                className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg transition-colors ${
                  member.role === 'member' 
                    ? 'cursor-pointer hover:bg-gray-50' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <UserRound className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{member.full_name || 'Sem nome'}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                    {member.role === 'member' && (
                      <div className="text-xs text-gray-600 mt-1 hover:text-[var(--color-clay-500)] transition-colors">
                        {getPermissionsSummary(member.permissions, member.role)}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {getRoleBadge(member.role)}
                  </div>
                </div>
                
                {member.role !== 'admin' && member.role !== 'superadmin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMemberToDelete({
                        id: member.id,
                        name: member.full_name || member.email
                      })
                      setDeleteDialogOpen(true)
                    }}
                    className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Remover membro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {memberToDelete?.name} do workspace? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-outline-grey">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="btn-danger"
              onClick={confirmDelete}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de edição de permissões */}
      {isEditModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setIsEditModalOpen(false)
              setEditingMember(null)
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-[var(--color-bg-modal)] rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden" style={{ maxWidth: '600px' }}>
            {/* Header */}
            <div className="sticky top-0 bg-[var(--color-bg-modal)] border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Editar Permissões</h2>
                <p className="text-sm text-gray-500 mt-1">{editingMember.full_name || editingMember.email}</p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingMember(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdatePermissions} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Permissões de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={toggleAllEditPermissions}
                    className="text-xs text-[var(--color-clay-500)] hover:text-[var(--color-clay-600)] font-medium"
                  >
                    {Object.values(editPermissions).every(v => v) ? 'Desmarcar todas' : 'Marcar todas'}
                  </button>
                </div>
                <div>
                  {(Object.keys(permissionLabels) as Array<keyof UserPermissions>).map((permission, index, array) => (
                    <label
                      key={permission}
                      className={`flex items-center gap-3 pr-2 py-1.5 cursor-pointer transition-colors ${index !== array.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={editPermissions[permission]}
                        onChange={() => toggleEditPermission(permission)}
                        className="w-4 h-4 text-[var(--color-clay-500)] border-gray-300 rounded focus:ring-[var(--color-clay-500)]"
                      />
                      <span className="text-sm text-gray-700 flex-1">{permissionLabels[permission]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                {hasPermissionChanges() && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setEditingMember(null)
                    }}
                    className="btn-secondary-outline"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={updating || !hasPermissionChanges()}
                  className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Salvar Permissões
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
