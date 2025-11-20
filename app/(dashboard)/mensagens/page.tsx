'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Send, Phone, Search, Info, AlertCircle, Settings, Mic } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import PageLoading from '@/components/PageLoading'
import Link from 'next/link'

type Contact = {
  id: string
  name: string
  phone: string
  rawPhone?: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: string
  lastMessageTimestamp?: number
  unreadCount?: number
  isOnline?: boolean
}

type Message = {
  id: string
  content: string
  timestamp: string
  fromMe: boolean
  status?: 'sent' | 'delivered' | 'read'
  mediaUrl?: string
  mediaType?: string
}

export default function MensagensPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [instanceName] = useState('sotasty-whatsapp') // Nome padrão da instância
  const imageCacheRef = useRef<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto scroll para última mensagem (instantâneo no carregamento inicial)
  const scrollToBottom = (instant = false) => {
    if (instant && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    // Scroll instantâneo quando as mensagens carregam pela primeira vez
    if (messages.length > 0) {
      scrollToBottom(true)
    }
  }, [messages.length])

  // Buscar contatos
  useEffect(() => {
    const init = async () => {
      await checkConnection()
      await fetchContacts()
      setInitialLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch(`/api/whatsapp/status?instance=${instanceName}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Verificando status da instância:', instanceName);
        console.log('Status:', data);
        setConnected(data.connected && data.state === 'open')
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error)
      setConnected(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await fetch(`/api/whatsapp/contacts?instance=${instanceName}`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch {
      // Silencioso - não mostrar erro
    }
  }

  const fetchMessages = async (contactId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/whatsapp/messages?contactId=${contactId}&instance=${instanceName}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact)
    fetchMessages(contact.id)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !selectedContact) return

    try {
      const phoneNumber = selectedContact.rawPhone || selectedContact.phone.replace(/\D/g, '')
      
      console.log('Enviando mensagem para:', {
        to: phoneNumber,
        message: newMessage,
        instance: instanceName,
        selectedContact
      })
      
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          message: newMessage,
          instance: instanceName
        })
      })

      if (response.ok) {
        const sentMessage: Message = {
          id: Date.now().toString(),
          content: newMessage,
          timestamp: new Date().toISOString(),
          fromMe: true,
          status: 'sent'
        }
        
        setMessages([...messages, sentMessage])
        setNewMessage('')
        
        // Atualizar último contato
        setContacts(contacts.map(c => 
          c.id === selectedContact.id 
            ? { ...c, lastMessage: newMessage, lastMessageTime: 'Agora' }
            : c
        ))
      } else {
        let errorMessage = 'Erro desconhecido';
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || JSON.stringify(errorData)
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }
        console.error('Erro ao enviar mensagem:', errorMessage)
        alert(`Erro ao enviar mensagem: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem')
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  )

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateLabel = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Resetar horas para comparação apenas de data
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
    
    if (messageDate.getTime() === todayDate.getTime()) {
      return 'Hoje'
    } else if (messageDate.getTime() === yesterdayDate.getTime()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
    }
  }

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage: Message | null) => {
    if (!previousMessage) return true
    
    const currentDate = new Date(currentMessage.timestamp)
    const previousDate = new Date(previousMessage.timestamp)
    
    return currentDate.toDateString() !== previousDate.toDateString()
  }

  const formatWhatsAppText = (text: string) => {
    let formatted = text
    
    // Detectar e formatar URLs (http, https, www)
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g
    formatted = formatted.replace(urlRegex, (url) => {
      const href = url.startsWith('http') ? url : `https://${url}`
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="underline hover:opacity-80 transition-opacity">${url}</a>`
    })
    
    // *negrito* -> <strong>
    formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    
    // _itálico_ -> <em>
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>')
    
    // ~tachado~ -> <del>
    formatted = formatted.replace(/~([^~]+)~/g, '<del>$1</del>')
    
    // ```código``` -> <code>
    formatted = formatted.replace(/```([^`]+)```/g, '<code class="bg-gray-200 px-1 rounded">$1</code>')
    
    return formatted
  }

  const loadImageBase64 = useCallback(async (messageId: string) => {
    if (imageCacheRef.current[messageId]) {
      return imageCacheRef.current[messageId]
    }

    try {
      const response = await fetch(
        `/api/whatsapp/media?messageId=${messageId}&instance=sotasty-whatsapp`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.base64) {
          const base64Url = `data:${data.mimetype || 'image/jpeg'};base64,${data.base64}`
          imageCacheRef.current[messageId] = base64Url
          return base64Url
        }
      }
    } catch (error) {
      console.error('Erro ao carregar imagem:', error)
    }
    
    return null
  }, [])

  const WhatsAppImage = ({ messageId }: { messageId: string }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      let isMounted = true
      
      loadImageBase64(messageId).then(src => {
        if (isMounted) {
          setImageSrc(src)
          setLoading(false)
        }
      })
      
      return () => {
        isMounted = false
      }
    }, [messageId])

    if (loading) {
      return (
        <div className="w-full flex items-center justify-center bg-gray-100 rounded-lg" style={{ aspectRatio: '4/3' }}>
          <Spinner size="large" className="text-[var(--color-clay-500)]" />
        </div>
      )
    }

    if (!imageSrc) {
      return (
        <div className="w-full flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 text-sm" style={{ aspectRatio: '4/3' }}>
          Imagem não disponível
        </div>
      )
    }

    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img 
        src={imageSrc} 
        alt="Imagem"
        className="rounded-lg w-full cursor-pointer"
        style={{ display: 'block' }}
        onClick={() => window.open(imageSrc, '_blank')}
      />
    )
  }

  const WhatsAppAudio = ({ messageId, fromMe }: { messageId: string; fromMe: boolean }) => {
    const [audioSrc, setAudioSrc] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [playbackRate, setPlaybackRate] = useState(1)
    const audioRef = useRef<HTMLAudioElement>(null)
    
    // Gerar alturas fixas das barras uma única vez
    const waveformHeights = useRef<number[]>(
      [...Array(40)].map(() => Math.random() * 16 + 8)
    )

    useEffect(() => {
      let isMounted = true
      
      loadImageBase64(messageId).then(src => {
        if (isMounted) {
          setAudioSrc(src)
          setLoading(false)
        }
      })
      
      return () => {
        isMounted = false
      }
    }, [messageId])

    useEffect(() => {
      const audio = audioRef.current
      if (!audio) return

      const updateTime = () => setCurrentTime(audio.currentTime)
      const updateDuration = () => setDuration(audio.duration)
      const handleEnded = () => setIsPlaying(false)

      audio.addEventListener('timeupdate', updateTime)
      audio.addEventListener('loadedmetadata', updateDuration)
      audio.addEventListener('ended', handleEnded)

      return () => {
        audio.removeEventListener('timeupdate', updateTime)
        audio.removeEventListener('loadedmetadata', updateDuration)
        audio.removeEventListener('ended', handleEnded)
      }
    }, [audioSrc])

    // Atualizar velocidade do áudio quando playbackRate mudar
    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackRate
      }
    }, [playbackRate])

    const togglePlay = () => {
      if (!audioRef.current) return
      
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }

    const togglePlaybackRate = () => {
      setPlaybackRate(current => {
        if (current === 1) return 1.5
        if (current === 1.5) return 2
        return 1
      })
    }

    const formatTime = (seconds: number) => {
      if (!seconds || isNaN(seconds)) return '0:00'
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (loading) {
      return (
        <div className="flex items-center gap-2 min-w-[200px]">
          <Spinner size="large" className="text-[var(--color-clay-500)]" />
          <span className="text-sm">Carregando áudio...</span>
        </div>
      )
    }

    if (!audioSrc) {
      return (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          Áudio não disponível
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 min-w-[200px]">
        {/* Botão Play/Pause */}
        <button
          onClick={togglePlay}
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            fromMe 
              ? 'bg-white/20 hover:bg-white/30' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {isPlaying ? (
            <svg className={`w-4 h-4 ${fromMe ? 'text-white' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className={`w-4 h-4 ${fromMe ? 'text-white' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Waveform visual */}
        <div className="flex-1 flex items-center gap-0.5 h-8">
          {waveformHeights.current.map((height, i) => {
            const progress = duration > 0 ? currentTime / duration : 0
            const barProgress = i / waveformHeights.current.length
            const isActive = barProgress <= progress
            
            return (
              <div
                key={i}
                className={`w-0.5 rounded-full transition-colors ${
                  isActive 
                    ? fromMe ? 'bg-white' : 'bg-[var(--color-clay-500)]'
                    : fromMe ? 'bg-white/30' : 'bg-gray-300'
                }`}
                style={{ height: `${height}px` }}
              />
            )
          })}
        </div>

        {/* Duração */}
        <span className={`text-xs font-mono ${fromMe ? 'text-white/90' : 'text-gray-600'}`}>
          {formatTime(isPlaying ? currentTime : duration)}
        </span>

        {/* Botão de velocidade */}
        <button
          onClick={togglePlaybackRate}
          className={`text-xs font-semibold px-1.5 py-0.5 rounded transition-colors ${
            fromMe 
              ? 'text-white/90 hover:bg-white/10' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {playbackRate}x
        </button>

        {/* Audio element (hidden) */}
        {audioSrc && (
          <audio ref={audioRef} src={audioSrc} />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden -m-8 p-8" style={{ height: '100vh' }}>
      {/* Header */}
      <div className="mb-8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Mensagens</h1>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
              Gerencie suas conversas do WhatsApp integrado com a API Evolution. Envie e receba mensagens diretamente pela plataforma.
            </div>
          </div>
        </div>
      </div>

      {/* Loading inicial */}
      {initialLoading ? (
        <div className="flex items-center justify-center flex-1">
          <PageLoading />
        </div>
      ) : (
        <>
          {/* Banner de aviso se não conectado */}
          {!connected && (
        <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-4 flex-shrink-0">
          <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 mb-2 text-lg">WhatsApp não conectado</h3>
            <p className="text-sm text-yellow-800 mb-4">
              Para enviar e receber mensagens, você precisa conectar seu WhatsApp primeiro. 
              Acesse as configurações e escaneie o QR Code com seu celular.
            </p>
            <Link 
              href="/settings/whatsapp"
              className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              Conectar WhatsApp
            </Link>
          </div>
        </div>
      )}

      {/* Layout Principal */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Lista de Contatos */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {/* Busca */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar contatos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Contatos */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm font-medium mb-1">
                  {searchQuery ? 'Nenhum contato encontrado' : connected ? 'Nenhuma conversa ainda' : 'Conecte o WhatsApp para ver contatos'}
                </p>
                {!connected && (
                  <Link 
                    href="/settings/whatsapp"
                    className="text-[var(--old-rose)] text-xs hover:underline mt-2"
                  >
                    Ir para configurações
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredContacts.map((contact, index) => (
                  <button
                    key={contact.id || `contact-${index}`}
                    onClick={() => handleContactSelect(contact)}
                    className={`w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors text-left cursor-pointer ${
                      selectedContact?.id === contact.id ? 'bg-[var(--color-lavender-blush)]' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-melon)] to-[var(--color-clay-500)] flex items-center justify-center overflow-hidden">
                        {contact.avatar ? (
                          <img 
                            src={contact.avatar} 
                            alt={contact.name} 
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              // Se a imagem falhar ao carregar, mostra a inicial
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        {!contact.avatar && (
                          <span className="text-white font-semibold text-lg">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {contact.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {contact.lastMessageTime || ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                        {contact.lastMessage?.includes('🎵') && (
                          <Mic className="w-3.5 h-3.5 flex-shrink-0" />
                        )}
                        {contact.lastMessage?.replace('🎵 ', '') || contact.phone}
                      </p>
                    </div>

                    {/* Badge de não lidas */}
                    {contact.unreadCount && contact.unreadCount > 0 && (
                      <div className="flex-shrink-0 bg-[var(--color-clay-500)] text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                        {contact.unreadCount}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Área de Chat */}
        <div className="col-span-8 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {selectedContact ? (
            <>
              {/* Header do Chat */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-melon)] to-[var(--color-clay-500)] flex items-center justify-center overflow-hidden relative">
                    {selectedContact.avatar ? (
                      <img 
                        src={selectedContact.avatar} 
                        alt={selectedContact.name} 
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    {!selectedContact.avatar && (
                      <span className="text-white font-semibold">
                        {selectedContact.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedContact.name}</h3>
                    <p className="text-xs text-gray-500">{selectedContact.phone}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Mensagens */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Spinner size="large" className="text-[var(--color-clay-500)]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">Nenhuma mensagem ainda</p>
                    <p className="text-gray-400 text-xs mt-1">Envie uma mensagem para começar a conversa</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const previousMessage = index > 0 ? messages[index - 1] : null
                      const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
                      
                      return (
                        <div key={message.id || `message-${index}`} className="mb-2">
                          {showDateSeparator && (
                            <div className="flex items-center justify-center my-6">
                              <div className="bg-white/90 backdrop-blur-sm shadow-sm px-4 py-1.5 rounded-lg text-xs font-medium text-gray-700 border border-gray-100">
                                {formatDateLabel(message.timestamp)}
                              </div>
                            </div>
                          )}
                          <div
                            className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`inline-block ${
                                message.mediaType === 'image' ? 'max-w-sm' : 'max-w-[70%]'
                              } ${
                                message.mediaType === 'image' || message.mediaType === 'audio' ? 'px-1 py-1' : 'px-4 py-2'
                              } ${
                                message.fromMe
                                  ? 'bg-[var(--color-clay-500)] text-white rounded-lg rounded-br-sm'
                                  : 'bg-white text-gray-900 border border-gray-200 rounded-lg rounded-bl-sm'
                              }`}
                            >
                              {message.mediaType === 'image' && message.id && (
                                <div className="mb-2 relative w-full max-w-sm">
                                  <WhatsAppImage messageId={message.id} />
                                </div>
                              )}

                              {message.mediaType === 'audio' && message.id && (
                                <div className="mb-2">
                                  <WhatsAppAudio messageId={message.id} fromMe={message.fromMe} />
                                </div>
                              )}
                              
                              {message.content !== '📷 Imagem' && message.content !== '🎵 Áudio' && (
                                <div 
                                  className={`text-sm whitespace-pre-wrap ${message.mediaType === 'image' ? 'px-3 py-2' : ''}`}
                                  dangerouslySetInnerHTML={{ __html: formatWhatsAppText(message.content) }}
                                />
                              )}
                              
                              <div className={`flex items-center gap-1 justify-end mt-1 ${
                                message.mediaType === 'image' || message.mediaType === 'audio' ? 'px-3 pb-2' : ''
                              } ${
                                message.fromMe ? 'text-white/70' : 'text-gray-400'
                              }`}>
                                <span className="text-xs">{formatTime(message.timestamp)}</span>
                                {message.fromMe && message.status === 'read' && (
                                  <span className="text-xs">✓✓</span>
                                )}
                                {message.fromMe && message.status === 'delivered' && (
                                  <span className="text-xs">✓✓</span>
                                )}
                                {message.fromMe && message.status === 'sent' && (
                                  <span className="text-xs">✓</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input de Mensagem */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    disabled={!connected}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || !connected}
                    className="bg-[var(--color-clay-500)] text-white p-2.5 rounded-full hover:bg-[var(--color-clay-600)] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-lavender-blush)] to-[var(--color-melon)] rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-[var(--color-clay-500)]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {connected ? 'Selecione uma conversa' : 'WhatsApp não conectado'}
              </h3>
              <p className="text-gray-500 text-sm max-w-md">
                {connected 
                  ? 'Escolha um contato na lista ao lado para visualizar e enviar mensagens' 
                  : 'Conecte seu WhatsApp para começar a conversar com seus clientes'
                }
              </p>
              {!connected && (
                <Link 
                  href="/settings/whatsapp"
                  className="mt-4 inline-flex items-center gap-2 bg-[var(--old-rose)] hover:bg-[var(--rosy-brown)] text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Configurar WhatsApp
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  )
}
