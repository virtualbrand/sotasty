'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Check, 
  X, 
  Clock
} from 'lucide-react'

interface PendingFeedback {
  id: string
  title: string
  description: string
  category: string
  user_name: string
  created_at: string
}

export function FeedbackModerationPanel() {
  const [pendingFeedbacks, setPendingFeedbacks] = useState<PendingFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    checkSuperAdmin()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isSuperAdmin) {
      loadPendingFeedbacks()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin])

  const checkSuperAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setIsSuperAdmin(profile?.role === 'superadmin')
    }
  }

  const loadPendingFeedbacks = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      setPendingFeedbacks(data || [])
    } catch (error) {
      console.error('Erro ao carregar feedbacks pendentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveFeedback = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('feedbacks')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', feedbackId)

      if (error) throw error

      loadPendingFeedbacks()
    } catch (error) {
      console.error('Erro ao aprovar feedback:', error)
    }
  }

  const rejectFeedback = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('feedbacks')
        .update({
          status: 'rejected'
        })
        .eq('id', feedbackId)

      if (error) throw error

      loadPendingFeedbacks()
    } catch (error) {
      console.error('Erro ao rejeitar feedback:', error)
    }
  }

  if (!isSuperAdmin) {
    return null
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-bold text-gray-900">
            Painel de Moderação
          </h3>
          <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded-full">
            {pendingFeedbacks.length} pendentes
          </span>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : pendingFeedbacks.length === 0 ? (
        <p className="text-gray-600">Nenhum feedback aguardando moderação</p>
      ) : (
        <div className="space-y-3">
          {pendingFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-white rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                      {feedback.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      por {feedback.user_name || 'Usuário'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {feedback.title}
                  </h4>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {feedback.description}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveFeedback(feedback.id)}
                    className="p-2 bg-success-500 hover:bg-success-600 text-white rounded-lg transition-all"
                    title="Aprovar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => rejectFeedback(feedback.id)}
                    className="p-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg transition-all"
                    title="Rejeitar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
