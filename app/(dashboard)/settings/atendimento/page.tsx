'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, Trash2, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface KnowledgeFile {
  id: string
  name: string
  size: number
  uploadedAt: Date
  status: 'processing' | 'completed' | 'failed'
  type: 'file' | 'context'
  content?: string
}

export default function AtendimentoSettingsPage() {
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [textContent, setTextContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [isSavingText, setIsSavingText] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      
      // Busca arquivos
      const filesResponse = await fetch('/api/knowledge-base')
      const filesData = filesResponse.ok ? await filesResponse.json() : { files: [] }
      
      // Busca contextos
      const contextsResponse = await fetch('/api/knowledge-base/context')
      const contextsData = contextsResponse.ok ? await contextsResponse.json() : { contexts: [] }
      
      // Combina arquivos e contextos
      const allItems = [
        ...(filesData.files || []).map((f: KnowledgeFile) => ({ ...f, type: 'file' as const })),
        ...(contextsData.contexts || []).map((c: { id: string; name: string; content: string; created_at: string }) => ({
          id: c.id,
          name: c.name,
          size: c.content.length,
          uploadedAt: new Date(c.created_at),
          status: 'completed' as const,
          type: 'context' as const,
          content: c.content
        }))
      ]
      
      setFiles(allItems)
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    Array.from(selectedFiles).forEach((file) => {
      formData.append('files', file)
    })

    try {
      const response = await fetch('/api/knowledge-base/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erro ao fazer upload')
      }

      await response.json()
      setUploadProgress(100)
      
      // Recarrega a lista de arquivos
      await loadFiles()
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload dos arquivos. Por favor, tente novamente.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      // Limpa o input
      event.target.value = ''
    }
  }

  const handleDeleteFile = async (item: KnowledgeFile) => {
    const itemType = item.type === 'context' ? 'contexto' : 'arquivo'
    if (!confirm(`Tem certeza que deseja remover este ${itemType} da base de conhecimento?`)) {
      return
    }

    try {
      const endpoint = item.type === 'context' 
        ? `/api/knowledge-base/context/${item.id}`
        : `/api/knowledge-base/${item.id}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Erro ao deletar ${itemType}`)
      }

      // Recarrega a lista
      await loadFiles()
      
      // Mensagem de sucesso
      alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} removido com sucesso!`)
    } catch (error) {
      console.error(`Erro ao deletar ${itemType}:`, error)
      alert(`Erro ao deletar ${itemType}. Por favor, tente novamente.`)
    }
  }

  const handleSaveText = async () => {
    if (!textContent.trim()) {
      alert('Por favor, insira algum conteúdo.')
      return
    }

    if (!fileName.trim()) {
      alert('Por favor, insira um nome para o contexto.')
      return
    }

    setIsSavingText(true)

    try {
      // Envia o texto como contexto para o assistente
      const response = await fetch('/api/knowledge-base/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fileName,
          content: textContent,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar contexto')
      }

      // Limpa os campos
      setTextContent('')
      setFileName('')
      
      // Recarrega a lista
      await loadFiles()

      alert('Contexto adicionado com sucesso! O assistente já pode usar essas informações.')
    } catch (error) {
      console.error('Erro ao salvar contexto:', error)
      alert('Erro ao salvar contexto. Por favor, tente novamente.')
    } finally {
      setIsSavingText(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: KnowledgeFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getStatusText = (status: KnowledgeFile['status']) => {
    switch (status) {
      case 'completed':
        return 'Processado'
      case 'processing':
        return 'Processando...'
      case 'failed':
        return 'Erro'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-melon)] to-[var(--color-clay-500)] flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Base de Conhecimento</h2>
            <p className="text-sm text-gray-600 mt-1">
              Faça upload de documentos, PDFs, planilhas e arquivos de texto para treinar o assistente de atendimento. 
              O assistente usará essas informações para responder perguntas de forma mais precisa e contextualizada.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">Formatos suportados:</p>
            <p className="mt-1">PDF, DOCX, TXT, MD, CSV, XLSX - Tamanho máximo: 20MB por arquivo</p>
          </div>
        </div>
      </Card>

      {/* Text Input Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Contexto Direto</h3>
        <p className="text-sm text-gray-600 mb-4">
          Cole ou escreva informações que o assistente deve conhecer (processamento instantâneo)
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-2">
              Nome do contexto
            </label>
            <Input
              id="fileName"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Ex: sobre_duda_berger"
              className="w-full"
              disabled={isSavingText}
            />
          </div>

          <div>
            <label htmlFor="textContent" className="block text-sm font-medium text-gray-700 mb-2">
              Informações
            </label>
            <textarea
              id="textContent"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Cole ou digite as informações aqui...&#10;&#10;Exemplo:&#10;Quem é a Duda Berger?&#10;Duda Berger é confeiteira há anos, especializada em bolos artesanais.&#10;Já produziu centenas de encomendas e trabalha com visão estratégica."
              rows={10}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent resize-y text-sm"
              disabled={isSavingText}
            />
            <p className="text-xs text-gray-500 mt-2">
              {textContent.length} caracteres
            </p>
          </div>

          <Button
            onClick={handleSaveText}
            disabled={!textContent.trim() || !fileName.trim() || isSavingText}
            className="w-full bg-gradient-to-r from-[var(--color-clay-500)] to-[var(--color-melon)] hover:from-[var(--color-clay-600)] hover:to-[var(--color-clay-500)] text-white"
          >
            {isSavingText ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Adicionar ao Conhecimento
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ou Fazer Upload de Arquivos</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[var(--color-clay-500)] transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Clique para selecionar arquivos
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ou arraste e solte aqui
              </p>
            </div>
          </label>
        </div>

        {isUploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Enviando arquivos...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[var(--color-clay-500)] to-[var(--color-melon)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </Card>

      {/* Files List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Arquivos na Base de Conhecimento
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum arquivo adicionado ainda</p>
            <p className="text-sm text-gray-400 mt-1">
              Faça upload de documentos para começar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      {file.type === 'context' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                          Contexto
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(file.uploadedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.status)}
                    <span className="text-sm text-gray-600">
                      {getStatusText(file.status)}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFile(file)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info Footer */}
      <Card className="p-6 bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Como funciona?</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2">
            <span className="text-[var(--color-clay-500)] font-bold">1.</span>
            <span>Faça upload dos seus documentos (manuais, FAQs, políticas, catálogos, etc.)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--color-clay-500)] font-bold">2.</span>
            <span>O sistema processa e indexa o conteúdo automaticamente</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--color-clay-500)] font-bold">3.</span>
            <span>O assistente usa essas informações para responder perguntas com precisão</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
