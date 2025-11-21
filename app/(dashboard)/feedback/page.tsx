'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UpvoteButton } from '@/components/ui/upvote-button'
import { FeedbackModerationPanel } from '@/components/FeedbackModerationPanel'
import { useRouter } from 'next/navigation'
import { 
  Filter,
  Search,
  MessageSquare,
  Calendar,
  Info,
  Megaphone
} from 'lucide-react'

// Tipos
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

const statusOptions = [
  { id: 'in-progress', label: 'Em Desenvolvimento', color: 'blue' },
  { id: 'completed', label: 'Concluído', color: 'green' }
]

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('feedbacks')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewFeedbackModal, setShowNewFeedbackModal] = useState(false)
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes')
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all'])
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all'])
  const [newFeedback, setNewFeedback] = useState({
    title: '',
    description: '',
    category: 'improvement' as 'improvement' | 'new' | 'bug' | 'other'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  // Carregar usuário
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  // Carregar feedbacks
  useEffect(() => {
    loadFeedbacks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false)
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false)
      }
    }

    if (showCategoryDropdown || showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCategoryDropdown, showStatusDropdown])

  // Fechar dropdown ao pressionar ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCategoryDropdown(false)
        setShowStatusDropdown(false)
        setShowNewFeedbackModal(false)
      }
    }

    if (showCategoryDropdown || showStatusDropdown || showNewFeedbackModal) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showCategoryDropdown, showStatusDropdown, showNewFeedbackModal])

  // Filtrar e ordenar feedbacks
  useEffect(() => {
    let filtered = [...feedbacks]

    // Filtrar por aba
    if (activeTab === 'feedbacks') {
      // Aba feedbacks: apenas approved
      filtered = filtered.filter(f => f.status === 'approved')
      
      // Filtrar por categoria
      if (selectedCategories.length > 0 && !selectedCategories.includes('all')) {
        filtered = filtered.filter(f => selectedCategories.includes(f.category))
      }
    } else {
      // Aba atualizações: in-progress ou completed
      filtered = filtered.filter(f => f.status === 'in-progress' || f.status === 'completed')
      
      // Filtrar por status
      if (selectedStatuses.length > 0 && !selectedStatuses.includes('all')) {
        filtered = filtered.filter(f => selectedStatuses.includes(f.status))
      }
    }

    // Filtrar por busca
    if (searchQuery) {
      filtered = filtered.filter(f =>
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Ordenar
    filtered.sort((a, b) => {
      if (sortBy === 'votes') {
        return b.votes - a.votes
      } else { // recent
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredFeedbacks(filtered)
  }, [feedbacks, selectedCategories, selectedStatuses, searchQuery, sortBy, activeTab])

  const loadFeedbacks = async () => {
    try {
      setLoading(true)
      
      // Buscar todos os feedbacks aprovados, em desenvolvimento ou concluídos
      const { data, error } = await supabase
        .from('feedbacks')
        .select(`
          *,
          user_votes:feedback_votes(vote_type)
        `)
        .in('status', ['approved', 'in-progress', 'completed'])
        .order('votes', { ascending: false })

      if (error) throw error

      setFeedbacks(data || [])
    } catch (error) {
      console.error('Erro ao carregar feedbacks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (feedbackId: string, voteType: 'up' | 'down') => {
    if (!user) {
      alert('Você precisa estar logado para votar')
      return
    }

    try {
      const feedback = feedbacks.find(f => f.id === feedbackId)
      if (!feedback) return

      const existingVote = feedback.user_votes?.[0]
      
      if (existingVote?.vote_type === voteType) {
        // Remove voto
        await supabase
          .from('feedback_votes')
          .delete()
          .eq('feedback_id', feedbackId)
          .eq('user_id', user.id)

        // Atualizar contagem
        const newVotes = voteType === 'up' ? feedback.votes - 1 : feedback.votes + 1
        await supabase
          .from('feedbacks')
          .update({ votes: newVotes })
          .eq('id', feedbackId)

      } else {
        // Adicionar ou atualizar voto
        if (existingVote) {
          await supabase
            .from('feedback_votes')
            .update({ vote_type: voteType })
            .eq('feedback_id', feedbackId)
            .eq('user_id', user.id)

          // Atualizar contagem (inverter voto)
          const voteDiff = voteType === 'up' ? 2 : -2
          await supabase
            .from('feedbacks')
            .update({ votes: feedback.votes + voteDiff })
            .eq('id', feedbackId)

        } else {
          await supabase
            .from('feedback_votes')
            .insert({
              feedback_id: feedbackId,
              user_id: user.id,
              vote_type: voteType
            })

          // Atualizar contagem
          const newVotes = voteType === 'up' ? feedback.votes + 1 : feedback.votes - 1
          await supabase
            .from('feedbacks')
            .update({ votes: newVotes })
            .eq('id', feedbackId)
        }
      }

      loadFeedbacks()
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

  const handleSubmitFeedback = async () => {
    if (!user) {
      alert('Você precisa estar logado para enviar feedback')
      return
    }

    if (!newFeedback.title.trim() || !newFeedback.description.trim()) {
      alert('Por favor, preencha título e descrição')
      return
    }

    try {
      setIsSubmitting(true)

      // Buscar nome do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      const { error } = await supabase
        .from('feedbacks')
        .insert({
          user_id: user.id,
          user_name: profile?.name || user.email?.split('@')[0] || 'Usuário',
          title: newFeedback.title.trim(),
          description: newFeedback.description.trim(),
          category: newFeedback.category,
          status: 'pending'
        })

      if (error) throw error

      // Resetar form
      setNewFeedback({
        title: '',
        description: '',
        category: 'improvement'
      })
      setShowNewFeedbackModal(false)
      
      alert('Feedback enviado com sucesso! Aguarde a moderação.')
      
    } catch (error) {
      console.error('Erro ao enviar feedback:', error)
      alert('Erro ao enviar feedback. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
                Compartilhe suas ideias e vote nas sugestões da comunidade. Sugestões aprovadas aparecem aqui e podem ser votadas por todos os usuários.
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowNewFeedbackModal(true)}
          className="bg-[var(--color-clay-500)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--color-clay-600)] transition font-semibold cursor-pointer"
        >
          + Novo Feedback
        </button>
      </div>

      {/* Moderation Panel - Only for SuperAdmins */}
      <FeedbackModerationPanel />

      {/* Filters and Search */}
      <div className="mb-4 flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar feedbacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
          />
        </div>

        {/* Sort Button with Tooltip */}
        <button
          onClick={() => {
            setSortBy(sortBy === 'votes' ? 'recent' : 'votes')
          }}
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 filter-button h-10 cursor-pointer group relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down-wide-narrow w-5 h-5 opacity-80" aria-hidden="true">
            <path d="m3 16 4 4 4-4"></path>
            <path d="M7 20V4"></path>
            <path d="M11 4h10"></path>
            <path d="M11 8h7"></path>
            <path d="M11 12h4"></path>
          </svg>
          <div className="invisible group-hover:visible absolute right-0 top-full mt-2 bg-white text-[var(--color-licorice)] text-xs rounded-lg shadow-lg z-50 border border-gray-200 px-2 py-1 whitespace-nowrap">
            {sortBy === 'votes' ? 'Mais Votados' : 'Mais Recentes'}
          </div>
        </button>

        {/* Category Filter Button with Dropdown - Only on Feedbacks tab */}
        {activeTab === 'feedbacks' && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 filter-button h-10 cursor-pointer"
            >
              <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
              Tipo de feedback
              {selectedCategories.length > 0 && !selectedCategories.includes('all') && (
                <div className="inline-flex items-center rounded-full border py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground ml-2 h-5 px-1.5 text-xs">
                  {selectedCategories.length}
                </div>
              )}
            </button>
            {showCategoryDropdown && (
              <div className="filter-dropdown absolute top-full mt-2 right-0 bg-[var(--color-bg-modal)] border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[220px]">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      let newCategories: string[]
                      if (selectedCategories.includes(category.id)) {
                        // Remove a categoria
                        newCategories = selectedCategories.filter(c => c !== category.id)
                      } else {
                        // Adiciona a categoria e remove 'all'
                        newCategories = [...selectedCategories.filter(c => c !== 'all'), category.id]
                      }
                      // Se não tiver nenhuma categoria, volta para 'all'
                      if (newCategories.length === 0) {
                        newCategories = ['all']
                      }
                      setSelectedCategories(newCategories)
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50 rounded"
                  >
                    <span className="text-sm">{category.label}</span>
                    {selectedCategories.includes(category.id) && (
                      <span className="text-xs text-green-600 font-semibold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status Filter Button with Dropdown - Only on Atualizações tab */}
        {activeTab === 'updates' && (
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 filter-button h-10 cursor-pointer"
            >
              <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
              Status
              {selectedStatuses.length > 0 && !selectedStatuses.includes('all') && (
                <div className="inline-flex items-center rounded-full border py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground ml-2 h-5 px-1.5 text-xs">
                  {selectedStatuses.length}
                </div>
              )}
            </button>
            {showStatusDropdown && (
              <div className="filter-dropdown absolute top-full mt-2 right-0 bg-[var(--color-bg-modal)] border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[220px]">
                {statusOptions.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => {
                      let newStatuses: string[]
                      if (selectedStatuses.includes(status.id)) {
                        // Remove o status
                        newStatuses = selectedStatuses.filter(s => s !== status.id)
                      } else {
                        // Adiciona o status e remove 'all'
                        newStatuses = [...selectedStatuses.filter(s => s !== 'all'), status.id]
                      }
                      // Se não tiver nenhum status, volta para 'all'
                      if (newStatuses.length === 0) {
                        newStatuses = ['all']
                      }
                      setSelectedStatuses(newStatuses)
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-gray-50 rounded"
                  >
                    <span className="text-sm">{status.label}</span>
                    {selectedStatuses.includes(status.id) && (
                      <span className="text-xs text-green-600 font-semibold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Clear Button - Show based on active tab */}
        {activeTab === 'feedbacks' && selectedCategories.length > 0 && !selectedCategories.includes('all') && (
          <button
            onClick={() => setSelectedCategories(['all'])}
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground rounded-md px-3 h-10 cursor-pointer"
          >
            Limpar
          </button>
        )}
        {activeTab === 'updates' && selectedStatuses.length > 0 && !selectedStatuses.includes('all') && (
          <button
            onClick={() => setSelectedStatuses(['all'])}
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground rounded-md px-3 h-10 cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Active Filters - Categories */}
      {activeTab === 'feedbacks' && selectedCategories.length > 0 && !selectedCategories.includes('all') && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-600">Filtros ativos:</span>
          {selectedCategories.map((catId) => {
            const category = categories.find(c => c.id === catId)
            return (
              <div
                key={catId}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-[var(--color-lavender-blush)] text-[var(--color-clay-500)] border-[var(--color-clay-500)]"
              >
                <span className="text-xs font-medium">{category?.label}</span>
                <button
                  onClick={() => {
                    const newCategories = selectedCategories.filter(c => c !== catId)
                    setSelectedCategories(newCategories.length === 0 ? ['all'] : newCategories)
                  }}
                  className="hover:opacity-70"
                  title="Remover filtro"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-3 h-3" aria-hidden="true">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Active Filters - Status */}
      {activeTab === 'updates' && selectedStatuses.length > 0 && !selectedStatuses.includes('all') && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-600">Filtros ativos:</span>
          {selectedStatuses.map((statusId) => {
            const status = statusOptions.find(s => s.id === statusId)
            return (
              <div
                key={statusId}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-[var(--color-lavender-blush)] text-[var(--color-clay-500)] border-[var(--color-clay-500)]"
              >
                <span className="text-xs font-medium">{status?.label}</span>
                <button
                  onClick={() => {
                    const newStatuses = selectedStatuses.filter(s => s !== statusId)
                    setSelectedStatuses(newStatuses.length === 0 ? ['all'] : newStatuses)
                  }}
                  className="hover:opacity-70"
                  title="Remover filtro"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-3 h-3" aria-hidden="true">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab('feedbacks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md h-9 text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'feedbacks'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'bg-transparent text-gray-600 hover:bg-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          Feedbacks
        </button>
        <button
          onClick={() => setActiveTab('updates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md h-9 text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'updates'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'bg-transparent text-gray-600 hover:bg-white'
          }`}
        >
          <Megaphone className="w-4 h-4" aria-hidden="true" />
          Atualizações
        </button>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-clay-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-4">Carregando feedbacks...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum feedback encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            Seja o primeiro a compartilhar uma ideia!
          </p>
          <button
            onClick={() => setShowNewFeedbackModal(true)}
            className="btn-primary"
          >
            Criar Primeiro Feedback
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => {
            const hasUpvoted = feedback.user_votes?.some(v => v.vote_type === 'up')
            const hasDownvoted = feedback.user_votes?.some(v => v.vote_type === 'down')

            return (
              <div
                key={feedback.id}
                onClick={() => router.push(`/feedback/${feedback.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex gap-4">
                  {/* Upvote Button */}
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <UpvoteButton
                      votes={feedback.votes}
                      hasUpvoted={hasUpvoted}
                      hasDownvoted={hasDownvoted}
                      onUpvote={() => handleVote(feedback.id, 'up')}
                      onDownvote={() => handleVote(feedback.id, 'down')}
                      disabled={!user}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {feedback.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {feedback.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(feedback.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
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
            )
          })}
        </div>
      )}

      {/* Modal de Novo Feedback */}
      {showNewFeedbackModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewFeedbackModal(false)
              setNewFeedback({ title: '', description: '', category: 'improvement' })
            }
          }}
        >
          <div className="bg-[var(--color-bg-app)] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[var(--color-bg-app)] border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Novo Feedback</h2>
              <button
                onClick={() => {
                  setShowNewFeedbackModal(false)
                  setNewFeedback({ title: '', description: '', category: 'improvement' })
                }}
                className="text-gray-400 hover:text-gray-600 transition"
                disabled={isSubmitting}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-5 h-5" aria-hidden="true">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitFeedback(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  placeholder="Ex: Adicionar suporte para múltiplas moedas"
                  value={newFeedback.title}
                  onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-colors bg-white"
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <textarea
                  placeholder="Descreva sua sugestão em detalhes..."
                  rows={4}
                  value={newFeedback.description}
                  onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-gray-900 placeholder:text-gray-500 transition-colors resize-none bg-white"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-gray-900 transition-colors bg-white"
                  value={newFeedback.category}
                  onChange={(e) => setNewFeedback({ ...newFeedback, category: e.target.value as 'improvement' | 'new' | 'bug' | 'other' })}
                  disabled={isSubmitting}
                  required
                >
                  <option value="improvement">Melhoria</option>
                  <option value="new">Novo Recurso</option>
                  <option value="bug">Reportar Bug</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewFeedbackModal(false)
                    setNewFeedback({ title: '', description: '', category: 'improvement' })
                  }}
                  className="btn-secondary-outline flex-1"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
