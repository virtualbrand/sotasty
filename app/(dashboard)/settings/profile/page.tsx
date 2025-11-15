'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, MapPin, Camera, Save, SwitchCamera, CircleX, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/app/(dashboard)/layout'

type ProfileData = {
  id: string
  email: string
  full_name: string
  phone: string
  cpf_cnpj: string
  address: string
  city: string
  state: string
  zip_code: string
  avatar_url: string | null
}

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
  const [profileData, setProfileData] = useState<ProfileData>({
    id: '',
    email: '',
    full_name: '',
    phone: '',
    cpf_cnpj: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    avatar_url: null
  })
  const [originalProfileData, setOriginalProfileData] = useState<ProfileData>({
    id: '',
    email: '',
    full_name: '',
    phone: '',
    cpf_cnpj: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    avatar_url: null
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
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        const loadedData = {
          id: user.id,
          email: user.email || '',
          full_name: data.full_name || '',
          phone: data.phone || '',
          cpf_cnpj: data.cpf_cnpj || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          avatar_url: data.avatar_url || null
        }
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
          ...profileData,
          id: user.id,
          email: user.email || ''
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
    
    // Aplica formatação de telefone
    if (name === 'phone') {
      const formatted = formatPhone(value)
      setProfileData(prev => ({ ...prev, [name]: formatted }))
    } else if (name === 'zip_code') {
      const formatted = formatCEP(value)
      setProfileData(prev => ({ ...prev, [name]: formatted }))
    } else if (name === 'cpf_cnpj') {
      const formatted = formatCpfCnpj(value)
      setProfileData(prev => ({ ...prev, [name]: formatted }))
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }))
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
          city: profileData.city,
          state: profileData.state,
          zip_code: profileData.zip_code,
          avatar_url: avatarUrl,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-[var(--color-old-rose)]"></div>
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

        {/* Personal Information */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h2>
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

        {/* Address Information */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h2>
          <div className="grid grid-cols-1 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
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
            className={`inline-flex items-center gap-2 ${
              !hasChanges 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed rounded-full font-semibold text-sm'
                : 'btn-success'
            }`}
            style={!hasChanges ? { padding: '8px 22px' } : undefined}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
