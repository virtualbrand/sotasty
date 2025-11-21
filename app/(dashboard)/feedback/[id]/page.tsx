'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UpvoteButton } from '@/components/ui/upvote-button'
import { FeedbackComments } from '@/components/ui/feedback-comments'
import { ArrowLeft, Calendar, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Feedback {
  id: string
  title: string
  description: string
  category: 'improvement' | 'new' | 'bug' | 'other'
  status: 'pending' | 'approved' | 'in-progress' | 'completed' | 'rejected'
  votes: number
  comments_count: number
  created_at: string
  user_id: string
  user_name: string
  user_votes?: { vote_type: 'up' | 'down' }[]
}

const categories = [
  { id: 'improvement', label: 'Melhoria', color: 'blue' },
  { id: 'new', label: 'Novo Recurso', color: 'green' },
  { id: 'bug', label: 'Bug', color: 'red' },
  { id: 'other', label: 'Outro', color: 'purple' }
]

export default function FeedbackDetailPage({ params }: { params: { id: string } }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string; name?: string } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', authUser.id)
          .single()
        
        setUser({ 
          id: authUser.id, 
          email: authUser.email,
          name: profile?.name || authUser.email?.split('@')[0] || 'Usuário'
        })
      }
    }
    getUser()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase.auth])

  useEffect(() => {
    loadFeedback()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const loadFeedback = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('feedbacks')
        .select(`
          *,
          user_votes:feedback_votes(vote_type)
        `)
        .eq('id', params.id)
        .eq('status', 'approved')
        .single()

      if (error) throw error
      setFeedback(data)
    } catch (error) {
      console.error('Erro ao carregar feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user || !feedback) {
      alert('Você precisa estar logado para votar')
      return
    }

    try {
      const existingVote = feedback.user_votes?.[0]
      
      if (existingVote?.vote_type === voteType) {
        // Remove voto
        await supabase
          .from('feedback_votes')
          .delete()
          .eq('feedback_id', feedback.id)
          .eq('user_id', user.id)

        const newVotes = voteType === 'up' ? feedback.votes - 1 : feedback.votes + 1
        await supabase
          .from('feedbacks')
          .update({ votes: newVotes })
          .eq('id', feedback.id)

      } else {
        if (existingVote) {
          await supabase
            .from('feedback_votes')
            .update({ vote_type: voteType })
            .eq('feedback_id', feedback.id)
            .eq('user_id', user.id)

          const voteDiff = voteType === 'up' ? 2 : -2
          await supabase
            .from('feedbacks')
            .update({ votes: feedback.votes + voteDiff })
            .eq('id', feedback.id)

        } else {
          await supabase
            .from('feedback_votes')
            .insert({
              feedback_id: feedback.id,
              user_id: user.id,
              vote_type: voteType
            })

          const newVotes = voteType === 'up' ? feedback.votes + 1 : feedback.votes - 1
          await supabase
            .from('feedbacks')
            .update({ votes: newVotes })
            .eq('id', feedback.id)
        }
      }

      loadFeedback()
    } catch (error) {
      console.error('Erro ao votar:', error)
    }
  }

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category)
    return cat?.color || 'gray'
  }

  const getCategoryStyles = (category: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-info-500 text-white',
      green: 'bg-success-500 text-white',
      red: 'bg-danger-500 text-white',
      purple: 'bg-purple-500 text-white',
      gray: 'bg-gray-500 text-white'
    }
    return colorMap[getCategoryColor(category)] || colorMap.gray
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-clay-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-4">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!feedback) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Feedback não encontrado</h2>
          <p className="text-gray-600 mb-6">Este feedback não existe ou não está mais disponível.</p>
          <button onClick={() => router.push('/feedback')} className="btn-primary">
            Voltar para Feedbacks
          </button>
        </div>
      </div>
    )
  }

  const hasUpvoted = feedback.user_votes?.some(v => v.vote_type === 'up')
  const hasDownvoted = feedback.user_votes?.some(v => v.vote_type === 'down')

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.push('/feedback')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Feedbacks
      </button>

      {/* Feedback Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex gap-4">
          {/* Upvote Button */}
          <div className="flex-shrink-0">
            <UpvoteButton
              votes={feedback.votes}
              hasUpvoted={hasUpvoted}
              hasDownvoted={hasDownvoted}
              onUpvote={() => handleVote('up')}
              onDownvote={() => handleVote('down')}
              disabled={!user}
            />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${getCategoryStyles(
                    feedback.category
                  )}`}
                >
                  {categories.find(c => c.id === feedback.category)?.label}
                </span>
                <span className="text-xs text-gray-500">
                  {feedback.user_name || 'Usuário'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {feedback.title}
              </h1>
              <p className="text-gray-700 text-base leading-relaxed">
                {feedback.description}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(feedback.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {feedback.comments_count || 0} comentários
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <FeedbackComments 
        feedbackId={feedback.id}
        userId={user?.id}
        userName={user?.name}
      />
    </div>
  )
}
