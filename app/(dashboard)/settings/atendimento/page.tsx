'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { KnowledgeBaseEditor } from '@/components/KnowledgeBaseEditor'

interface KnowledgeEntry {
  id: string
  name: string
  content: string
  created_at: string
}

export default function AtendimentoSettingsPage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadEntries = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/knowledge-base/context')
      const data = response.ok ? await response.json() : { contexts: [] }
      
      setEntries(data.contexts || [])
    } catch (error) {
      console.error('Erro ao carregar conhecimento:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEntries()
  }, [])

  return (
    <div className="space-y-6">
      {/* Knowledge Base Editor */}
      {isLoading ? (
        <Card className="p-12 border-0 shadow-sm">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </Card>
      ) : (
        <KnowledgeBaseEditor entries={entries} onRefresh={loadEntries} />
      )}
    </div>
  )
}
