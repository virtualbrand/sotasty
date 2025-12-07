'use client'

import { useState } from 'react'
import { FileText, Plus, Trash2, Loader2, Info, Check, CircleAlert } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BlockNoteEditorComponent as RichTextEditor } from './BlockNoteEditor'
import { MarkdownPreview } from './MarkdownPreview'
import Modal from './Modal'
import { showToast } from '@/app/(dashboard)/layout'
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

interface KnowledgeEntry {
  id: string
  name: string
  content: string
  created_at: string
}

interface KnowledgeBaseEditorProps {
  entries: KnowledgeEntry[]
  onRefresh: () => Promise<void>
}

export function KnowledgeBaseEditor({ entries, onRefresh }: KnowledgeBaseEditorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<{ id: string; name: string } | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [content, setContent] = useState('')

  const handleStartCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setName('')
    setContent('')
  }

  const handleStartEdit = (entry: KnowledgeEntry) => {
    setIsCreating(false)
    setEditingId(entry.id)
    setName(entry.name)
    setContent(entry.content)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setName('')
    setContent('')
  }

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) {
      showToast({
        title: 'Erro',
        message: 'Por favor, preencha o nome e o conteúdo.',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    setIsSaving(true)

    try {
      if (editingId) {
        // Update existing entry
        const response = await fetch(`/api/knowledge-base/context/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, content }),
        })

        if (!response.ok) throw new Error('Erro ao atualizar')
        
        showToast({
          title: 'Conhecimento atualizado!',
          message: 'As alterações foram salvas com sucesso',
          variant: 'success',
          duration: 3000,
        })
      } else {
        // Create new entry
        const response = await fetch('/api/knowledge-base/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, content }),
        })

        if (!response.ok) throw new Error('Erro ao criar')
        
        showToast({
          title: 'Conhecimento criado!',
          message: 'O novo conhecimento foi adicionado com sucesso',
          variant: 'success',
          duration: 3000,
        })
      }

      // Reset form and refresh
      handleCancel()
      await onRefresh()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showToast({
        title: 'Erro',
        message: 'Erro ao salvar conhecimento. Tente novamente.',
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (id: string, name: string) => {
    setEntryToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return

    setIsDeleting(entryToDelete.id)

    try {
      const response = await fetch(`/api/knowledge-base/context/${entryToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir')

      showToast({
        title: 'Conhecimento excluído!',
        message: 'O conhecimento foi removido com sucesso',
        variant: 'success',
        duration: 3000,
      })
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
      await onRefresh()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      showToast({
        title: 'Erro',
        message: 'Erro ao excluir conhecimento. Tente novamente.',
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setEntryToDelete(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Show editor form
  const renderEditorForm = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="knowledge-name" className="block text-sm font-medium text-gray-700 mb-2">
          Nome/Título <span className="text-gray-700">*</span>
        </label>
        <Input
          id="knowledge-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Sobre a empresa, FAQ - Horário de atendimento, Política de devolução"
          disabled={isSaving}
          required
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Conteúdo <span className="text-gray-700">*</span>
          </label>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
              Use o editor rico para formatar seu conteúdo. Selecione o texto e use os botões da toolbar ou atalhos de teclado (Cmd+B para negrito, Cmd+I para itálico). Pressione / para comandos rápidos.
            </div>
          </div>
        </div>
        <RichTextEditor
          value={content}
          onChange={setContent}
          onEscapePress={handleCancel}
        />
        <p className="text-xs text-gray-500 mt-2">
          {content.length} caracteres
        </p>
      </div>

      {editingId ? (
        <div className="flex gap-2 justify-end pt-4">
          <button
            type="button"
            onClick={() => handleDeleteClick(editingId, name)}
            disabled={isSaving || isDeleting === editingId}
            className="btn-outline-danger disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting === editingId ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Excluir Conhecimento
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || !content.trim() || isSaving}
            className="btn-success"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Atualizar Conhecimento
          </button>
        </div>
      ) : (
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            onClick={handleSave}
            disabled={!name.trim() || !content.trim() || isSaving}
            className="btn-success"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Salvar Conhecimento
          </button>
        </div>
      )}
    </div>
  )

  // Show list view
  return (
    <>
      <Modal
        isOpen={isCreating || editingId !== null}
        onClose={handleCancel}
        title={editingId ? 'Editar Conhecimento' : 'Novo Conhecimento'}
        maxWidth="800px"
      >
        {renderEditorForm()}
      </Modal>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
              aria-hidden="true"
            >
              <CircleAlert className="h-4 w-4 opacity-80" aria-hidden="true" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. O conhecimento será permanentemente excluído do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting !== null} className="btn-secondary-outline">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting !== null}
              className="btn-danger flex items-center gap-2"
            >
              {isDeleting !== null ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="p-6 border-0 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Base de Conhecimento</h3>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
                Crie entradas de conhecimento sobre sua empresa, produtos, políticas e FAQs. O assistente usará automaticamente essas informações para responder perguntas de forma precisa e contextualizada.
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {entries.length} {entries.length === 1 ? 'base' : 'bases'} de conhecimento
          </p>
        </div>
        <button
          onClick={handleStartCreate}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-1" />
          Novo Conhecimento
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum conhecimento cadastrado
          </h4>
          <p className="text-gray-600 mb-6">
            Comece criando sua primeira entrada de conhecimento para que o assistente possa responder perguntas.
          </p>
          <button
            onClick={handleStartCreate}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-1" />
            Criar Primeiro Conhecimento
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div 
              key={entry.id} 
              onClick={() => handleStartEdit(entry)}
              className="p-5 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-[var(--color-clay-500)] flex-shrink-0" />
                  <h4 className="font-semibold text-gray-900 truncate">
                    {entry.name}
                  </h4>
                </div>
                <div className="text-sm mb-2 line-clamp-3">
                  <MarkdownPreview content={entry.content} />
                </div>
                <p className="text-xs text-gray-500">
                  Criado em {formatDate(entry.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
    </>
  )
}
