'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Bold, Italic, Underline, Link as LinkIcon, Smile, MessageSquare } from 'lucide-react'

interface Comment {
  id: string
  feedback_id: string
  user_id: string
  user_name: string
  comment: string
  created_at: string
  updated_at: string
}

interface FeedbackCommentsProps {
  feedbackId: string
  userId?: string
  userName?: string
}

export function FeedbackComments({ feedbackId, userId, userName }: FeedbackCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadComments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('feedback_comments')
        .select('*')
        .eq('feedback_id', feedbackId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId) {
      alert('Você precisa estar logado para comentar')
      return
    }

    if (!newComment.trim()) return

    try {
      setIsSubmitting(true)
      const { error } = await supabase
        .from('feedback_comments')
        .insert({
          feedback_id: feedbackId,
          user_id: userId,
          user_name: userName || 'Usuário',
          comment: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      loadComments()
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
      alert('Erro ao enviar comentário')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-[var(--color-clay-500)]" />
        <span className="text-lg font-semibold text-gray-900">
          Comentários ({comments.length})
        </span>
      </div>

      {/* Comments List */}
      <div className="space-y-6 mb-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Carregando comentários...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Seja o primeiro a comentar!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-clay-100)] flex items-center justify-center">
                  <span className="text-[var(--color-clay-600)] font-semibold text-sm">
                    {comment.user_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{comment.user_name}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {formatDate(comment.created_at)}
                  </div>
                </div>
              </div>

              {/* Comment Content */}
              <p className="text-gray-700 text-sm leading-relaxed pl-[52px]">
                {comment.comment}
              </p>

              {/* Divider */}
              {comments.indexOf(comment) < comments.length - 1 && (
                <hr className="border-gray-100 mt-4" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Comment Form */}
      {userId ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva seu comentário..."
              rows={3}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clay-500 focus:border-transparent resize-none text-sm"
            />
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isSubmitting}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                title="Negrito"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                title="Itálico"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                title="Sublinhado"
              >
                <Underline className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                title="Link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                title="Emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-sm">
            Faça login para comentar
          </p>
        </div>
      )}
    </div>
  )
}
