'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { User, Mail, Phone, MapPin, Camera, Check, SwitchCamera, CircleX, CreditCard, Building2, Clock, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/app/(dashboard)/layout'

type BusinessHourInterval = {
  open: string
  close: string
}

type ProfileData = {
  id: string
  email: string
  full_name: string
  phone: string
  cpf_cnpj: string
  address: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  avatar_url: string | null
  always_open: boolean
  business_hours: {
    [key: string]: { 
      closed: boolean
      intervals: BusinessHourInterval[]
    }
  }
}

type TabType = 'personal' | 'establishment' | 'hours'

const formatPhone = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "")
  
  // Se não tem números, retorna vazio
  if (!numbers) return ""
  
  // Se tem apenas 1 dígito, retorna sem formatação
  if (numbers.length === 1) return `(${numbers}`
  
  // Se tem 2 dígitos, adiciona apenas o parêntese inicial
  if (numbers.length === 2) return `(${numbers}`
  
  // A partir de 3 dígitos, adiciona o parêntese e espaço
  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  }
  
  // Entre 7 e 10 dígitos: (99) 9999-9999
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
  }
  
  // Mais de 10 dígitos: (99) 99999-9999
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

const formatCEP = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "")
  
  // Se não tem números, retorna vazio
  if (!numbers) return ""
  
  // Limita a 8 dígitos
  const limited = numbers.slice(0, 8)
  
  // Formata: 00.000-000
  if (limited.length <= 2) {
    return limited
  }
  
  if (limited.length <= 5) {
    return `${limited.slice(0, 2)}.${limited.slice(2)}`
  }
  
  return `${limited.slice(0, 2)}.${limited.slice(2, 5)}-${limited.slice(5, 8)}`
}

const formatCpfCnpj = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "")
  
  // Se não tem números, retorna vazio
  if (!numbers) return ""
  
  // CPF: 000.000.000-00
  if (numbers.length <= 11) {
    if (numbers.length <= 3) {
      return numbers
    }
    if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    }
    if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    }
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  }
  
  // CNPJ: 00.000.000/0000-00
  const cnpj = numbers.slice(0, 14)
  if (cnpj.length <= 2) {
    return cnpj
  }
  if (cnpj.length <= 5) {
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`
  }
  if (cnpj.length <= 8) {
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`
  }
  if (cnpj.length <= 12) {
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`
  }
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('personal')
  const [profileData, setProfileData] = useState<ProfileData>({
    id: '',
    email: '',
    full_name: '',
    phone: '',
    cpf_cnpj: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    avatar_url: null,
    always_open: false,
    business_hours: {
      sunday: { closed: true, intervals: [{ open: '09:00', close: '18:00' }] },
      monday: { closed: false, intervals: [{ open: '09:00', close: '18:00' }] },
      tuesday: { closed: false, intervals: [{ open: '09:00', close: '18:00' }] },
      wednesday: { closed: false, intervals: [{ open: '09:00', close: '18:00' }] },
      thursday: { closed: false, intervals: [{ open: '09:00', close: '18:00' }] },
      friday: { closed: false, intervals: [{ open: '09:00', close: '18:00' }] },
      saturday: { closed: false, intervals: [{ open: '09:00', close: '18:00' }] },
    }
  })
  const [originalProfileData, setOriginalProfileData] = useState<ProfileData>({
    id: '',
    email: '',
    full_name: '',
    phone: '',
    cpf_cnpj: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    avatar_url: null,
    always_open: false,
    business_hours: {
      sunday: { closed: true, intervals: [{ open: '09:00', close: '18:00' }] },
      monday: { closed: false, intervals: [{ open: '09:00', close: '18:00' }] },
      tuesday: { closed: false, intervals: [{ open: '09:00', close: '18:00' }] },
      wednesday: { closed: false, intervals: [{ open: '09:00', close: '18:00' }] },
      thursday: { closed: false, intervals: [{ open: '09:00', close: '18:00' }] },
      friday: { closed: false, intervals: [{ open: '09:00', close: '18:00' }] },
      saturday: { closed: false, intervals: [{ open: '09:00', close: '18:00' }] },
    }
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detectar mudanças nos dados do perfil
  useEffect(() => {
    const dataChanged = JSON.stringify(profileData) !== JSON.stringify(originalProfileData)
    const avatarChanged = avatarFile !== null
    setHasChanges(dataChanged || avatarChanged)
  }, [profileData, originalProfileData, avatarFile])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        showToast({
          title: 'Erro',
          message: 'Erro ao carregar perfil',
          variant: 'error',
          duration: 3000,
        })
        setLoading(false)
        return
      }

      console.log('User loaded:', { id: user.id, email: user.email })

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log('Profile query result:', { data, error, errorCode: error?.code, errorMessage: error?.message })

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
        if (error.code === '42501' || error.message?.includes('policy')) {
          console.warn('RLS policy error, creating new profile data')
          const newData = {
            id: user.id,
            email: user.email || '',
            full_name: '',
            phone: '',
            cpf_cnpj: '',
            address: '',
            neighborhood: '',
            city: '',
            state: '',
            zip_code: '',
            avatar_url: null,
            always_open: false,
            business_hours: profileData.business_hours
          }
          setProfileData(newData)
          setOriginalProfileData(newData)
          setLoading(false)
          return
        }
        throw error
      }

      console.log('Profile data loaded:', data)

      if (data) {
        const loadedData = {
          id: user.id,
          email: user.email || '',
          full_name: data.full_name || '',
          phone: data.phone || '',
          cpf_cnpj: data.cpf_cnpj || '',
          address: data.address || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          avatar_url: data.avatar_url || null,
          always_open: data.always_open || false,
          business_hours: data.business_hours ? 
            (typeof data.business_hours === 'object' && Object.keys(data.business_hours).length > 0 
              ? data.business_hours 
              : profileData.business_hours)
            : profileData.business_hours
        }
        console.log('Setting profile data:', loadedData)
        console.log('Full name from data:', data.full_name)
        setProfileData(loadedData)
        setOriginalProfileData(loadedData)
        
        if (data.avatar_url) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.avatar_url)
          setAvatarPreview(publicUrl)
        }
      } else {
        const newData = {
          id: user.id,
          email: user.email || '',
          full_name: '',
          phone: '',
          cpf_cnpj: '',
          address: '',
          neighborhood: '',
          city: '',
          state: '',
          zip_code: '',
          avatar_url: null,
          always_open: false,
          business_hours: profileData.business_hours
        }
        setProfileData(newData)
        setOriginalProfileData(newData)
      }
    } catch {
      console.error('Erro ao carregar perfil')
      showToast({
        title: 'Erro',
        message: 'Erro ao carregar perfil',
        variant: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'phone') {
      const formatted = formatPhone(value)
      setProfileData(prev => ({ ...prev, [name]: formatted }))
    } else if (name === 'zip_code') {
      const formatted = formatCEP(value)
      setProfileData(prev => ({ ...prev, [name]: formatted }))
      
      // Se o CEP estiver completo, busca o endereço
      const numbers = value.replace(/\D/g, '')
      if (numbers.length === 8) {
        fetchAddressByCEP(numbers)
      }
    } else if (name === 'cpf_cnpj') {
      const formatted = formatCpfCnpj(value)
      setProfileData(prev => ({ ...prev, [name]: formatted }))
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }))
    }
  }

  const fetchAddressByCEP = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        showToast({
          title: 'CEP não encontrado',
          message: 'Não foi possível encontrar o endereço para este CEP',
          variant: 'error',
          duration: 3000,
        })
        return
      }
      
      setProfileData(prev => ({
        ...prev,
        address: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      }))
      
      showToast({
        title: 'Endereço encontrado!',
        message: 'Os campos foram preenchidos automaticamente',
        variant: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      showToast({
        title: 'Erro',
        message: 'Erro ao buscar endereço. Tente novamente.',
        variant: 'error',
        duration: 3000,
      })
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast({
          title: 'Erro',
          message: 'A imagem deve ter no máximo 2MB',
          variant: 'error',
          duration: 3000,
        })
        return
      }
      
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação: Nome completo é obrigatório
    if (!profileData.full_name || profileData.full_name.trim() === '') {
      showToast({
        title: 'Erro',
        message: 'Nome completo é obrigatório',
        variant: 'error',
        duration: 3000,
      })
      return
    }
    
    setSaving(true)

    try {
      const supabase = createClient()
      
      // Verifica se o usuário está autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        showToast({
          title: 'Erro',
          message: 'Usuário não autenticado',
          variant: 'error',
          duration: 3000,
        })
        setSaving(false)
        return
      }
      
      let avatarUrl = profileData.avatar_url

      // Upload da foto se houver
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true })

        if (uploadError) {
          console.error('Erro no upload:', uploadError)
          showToast({
            title: 'Erro',
            message: `Erro ao fazer upload da imagem: ${uploadError.message}`,
            variant: 'error',
            duration: 4000,
          })
          setSaving(false)
          return
        }

        // Remove foto antiga se existir
        if (avatarUrl && avatarUrl !== fileName) {
          await supabase.storage.from('avatars').remove([avatarUrl])
        }

        avatarUrl = fileName
      }

      // Atualiza o nome no user_metadata do auth para sincronizar com o sidebar
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: profileData.full_name }
      })

      if (authError) {
        console.error('Erro ao atualizar metadados do usuário:', authError)
        showToast({
          title: 'Erro',
          message: `Erro ao atualizar nome de exibição: ${authError.message}`,
          variant: 'error',
          duration: 4000,
        })
        setSaving(false)
        return
      }

      // Atualiza ou insere o perfil
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profileData.full_name,
          phone: profileData.phone,
          cpf_cnpj: profileData.cpf_cnpj,
          address: profileData.address,
          neighborhood: profileData.neighborhood,
          city: profileData.city,
          state: profileData.state,
          zip_code: profileData.zip_code,
          avatar_url: avatarUrl,
          always_open: profileData.always_open,
          business_hours: profileData.business_hours,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Erro ao atualizar perfil:', error)
        showToast({
          title: 'Erro',
          message: `Erro ao salvar perfil: ${error.message}`,
          variant: 'error',
          duration: 4000,
        })
        setSaving(false)
        return
      }

      showToast({
        title: 'Sucesso!',
        message: 'Perfil atualizado com sucesso!',
        variant: 'success',
        duration: 3000,
      })
      setAvatarFile(null)
      
      // Atualiza os dados originais após salvar
      setOriginalProfileData({
        ...profileData,
        avatar_url: avatarUrl
      })
      
      // Recarrega o perfil para pegar a URL pública atualizada
      await loadProfile()
      
      // Dispara evento para atualizar o avatar na sidebar
      if (avatarUrl) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(avatarUrl)
        
        const event = new CustomEvent('avatar-updated', { 
          detail: { avatarUrl: publicUrl } 
        })
        window.dispatchEvent(event)
      }
      
      // Dispara evento para atualizar o nome na sidebar
      const nameEvent = new CustomEvent('profile-name-updated', { 
        detail: { name: profileData.full_name } 
      })
      window.dispatchEvent(nameEvent)
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      showToast({
        title: 'Erro',
        message: 'Erro inesperado ao salvar perfil. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    } finally {
      setSaving(false)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setProfileData(prev => ({ ...prev, avatar_url: null }))
  }

  const daysOfWeek = [
    { key: 'sunday', label: 'Domingo' },
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
  ]

  const handleBusinessHourChange = (day: string, field: 'closed', value: boolean) => {
    setProfileData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [field]: value
        }
      }
    }))
  }

  const handleIntervalChange = (day: string, intervalIndex: number, field: 'open' | 'close', value: string) => {
    setProfileData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          intervals: prev.business_hours[day].intervals.map((interval, idx) => 
            idx === intervalIndex ? { ...interval, [field]: value } : interval
          )
        }
      }
    }))
  }

  const addInterval = (day: string) => {
    setProfileData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          intervals: [...prev.business_hours[day].intervals, { open: '09:00', close: '18:00' }]
        }
      }
    }))
  }

  const removeInterval = (day: string, intervalIndex: number) => {
    setProfileData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          intervals: prev.business_hours[day].intervals.filter((_, idx) => idx !== intervalIndex)
        }
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="large" className="text-[var(--color-old-rose)]" />
      </div>
    )
  }

  return (
    <div className="rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: '#FFFBFB' }}>
      <form onSubmit={handleSubmit} className="p-6">
        {/* Avatar Section */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Foto de Perfil</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <label className="cursor-pointer group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                  {avatarPreview ? (
                    <>
                      <Image 
                        src={avatarPreview} 
                        alt="Avatar" 
                        width={128}
                        height={128}
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <SwitchCamera className="w-6 h-6 text-gray-700" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <User className="w-16 h-16 text-gray-400 group-hover:text-gray-500 transition-colors" />
                      <div className="absolute inset-0 bg-gray-100 group-hover:bg-gray-200 transition-colors flex items-center justify-center">
                        <div className="flex flex-col items-center">
                          <Camera className="w-8 h-8 text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">Adicionar</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 hover:scale-110 transition-transform"
                >
                  <CircleX className="w-6 h-6 text-[#D67973] hover:text-[#C86561] transition-colors" />
                </button>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">JPG, PNG ou GIF (máx. 2MB)</p>
              <p className="text-sm text-gray-400 mt-1">Clique na foto para alterar</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:outline-none ${
                activeTab === 'personal'
                  ? 'border-[var(--color-old-rose)] text-[var(--color-old-rose)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 inline-block mr-2" />
              Informações Pessoais
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('establishment')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:outline-none ${
                activeTab === 'establishment'
                  ? 'border-[var(--color-old-rose)] text-[var(--color-old-rose)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4 inline-block mr-2" />
              Estabelecimento
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hours')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:outline-none ${
                activeTab === 'hours'
                  ? 'border-[var(--color-old-rose)] text-[var(--color-old-rose)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-4 h-4 inline-block mr-2" />
              Horários de Funcionamento
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF / CNPJ
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="cpf_cnpj"
                    value={profileData.cpf_cnpj}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'establishment' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                name="zip_code"
                value={profileData.zip_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent"
                placeholder="00000-000"
              />
              <p className="text-xs text-gray-500 mt-1">Digite o CEP para preencher automaticamente</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent"
                  placeholder="Rua, número, complemento"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro
              </label>
              <input
                type="text"
                name="neighborhood"
                value={profileData.neighborhood}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent"
                placeholder="Bairro"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  name="city"
                  value={profileData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent"
                  placeholder="Cidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  name="state"
                  value={profileData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent"
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label htmlFor="always-open" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Sempre Aberto
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Estabelecimento funciona 24 horas por dia
                </p>
              </div>
              <Switch
                id="always-open"
                checked={profileData.always_open}
                onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, always_open: checked }))}
              />
            </div>

            {!profileData.always_open && (
              <div className="space-y-3">
                {daysOfWeek.map(({ key, label }) => (
                  <div key={key} className="py-3 px-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center min-w-[140px]">
                        <Switch
                          id={`day-${key}`}
                          checked={!profileData.business_hours[key].closed}
                          onCheckedChange={(checked) => handleBusinessHourChange(key, 'closed', !checked)}
                        />
                        <label htmlFor={`day-${key}`} className="text-sm font-medium text-gray-900 ml-3 cursor-pointer">
                          {label}
                        </label>
                      </div>
                      
                      {!profileData.business_hours[key].closed && (
                        <button
                          type="button"
                          onClick={() => addInterval(key)}
                          className="ml-auto flex items-center gap-1 text-xs text-[var(--color-old-rose)] hover:text-[var(--color-old-rose)]/80 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Adicionar intervalo
                        </button>
                      )}
                    </div>
                    
                    {profileData.business_hours[key].closed ? (
                      <span className="text-sm text-gray-500 italic ml-[164px]">Fechado</span>
                    ) : (
                      <div className="space-y-2 ml-[164px]">
                        {profileData.business_hours[key].intervals.map((interval, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-600 min-w-[36px]">Abre:</label>
                              <input
                                type="time"
                                value={interval.open}
                                onChange={(e) => handleIntervalChange(key, idx, 'open', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-600 min-w-[40px]">Fecha:</label>
                              <input
                                type="time"
                                value={interval.close}
                                onChange={(e) => handleIntervalChange(key, idx, 'close', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[var(--color-old-rose)] focus:border-transparent"
                              />
                            </div>
                            {profileData.business_hours[key].intervals.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeInterval(key, idx)}
                                className="p-1 hover:bg-red-50 rounded transition-colors"
                                title="Remover intervalo"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
          {hasChanges && (
            <Button
              type="button"
              variant="outline"
              onClick={() => loadProfile()}
              disabled={saving}
              className="rounded-full"
            >
              Cancelar
            </Button>
          )}
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
