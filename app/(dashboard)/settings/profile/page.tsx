'use client'

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { User, Mail, Phone, MapPin, Camera, Check, SwitchCamera, CircleX, CreditCard, Building2, Clock, Plus, X, Settings, Layout, BrushCleaning, Trash2, Link2, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
  business_name: string
  address: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  avatar_url: string | null
  logo_url: string | null
  always_open: boolean
  business_hours: {
    [key: string]: { 
      closed: boolean
      intervals: BusinessHourInterval[]
    }
  }
}

type TabType = 'personal' | 'establishment' | 'hours' | 'preferences'

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
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userRole, setUserRole] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null)
  const [hasFullAccess, setHasFullAccess] = useState(false)
  const [isAdminOnly, setIsAdminOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('personal')
  const [profileData, setProfileData] = useState<ProfileData>({
    id: '',
    email: '',
    full_name: '',
    phone: '',
    cpf_cnpj: '',
    business_name: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    avatar_url: null,
    logo_url: null,
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
    business_name: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    avatar_url: null,
    logo_url: null,
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
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  // Estados de Preferências
  const [menuPosition, setMenuPosition] = useState<'sidebar' | 'header' | 'footer' | 'right'>('sidebar')
  const [savedMenuPosition, setSavedMenuPosition] = useState<'sidebar' | 'header' | 'footer' | 'right'>('sidebar')
  const [showDailyBalance, setShowDailyBalance] = useState(false)
  const [savedShowDailyBalance, setSavedShowDailyBalance] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [customUrlSlug, setCustomUrlSlug] = useState('')
  const [savedCustomUrlSlug, setSavedCustomUrlSlug] = useState('')
  const [urlError, setUrlError] = useState('')
  
  // Estados de Domínio Personalizado
  const [customDomain, setCustomDomain] = useState('')
  const [savedCustomDomain, setSavedCustomDomain] = useState('')
  const [domainError, setDomainError] = useState('')
  const [isDomainVerified, setIsDomainVerified] = useState(false)
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false)
  
  const [hasChanges, setHasChanges] = useState(false)

  // Buscar permissões do usuário
  useEffect(() => {
    const fetchUserPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, permissions')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserRole(profile.role)
        setUserPermissions(profile.permissions || {})
        
        // Verificar se é admin ou superadmin
        const isAdmin = profile.role === 'admin' || profile.role === 'superadmin'
        
        // Verificar se é membro com todas as permissões (acesso total às abas)
        const allPermissions = ['dashboard', 'products', 'menus', 'orders', 'financial', 'messages', 'support', 'customers', 'agenda', 'activities']
        const hasAllPermissions = profile.permissions && allPermissions.every(perm => profile.permissions[perm] === true)
        
        setHasFullAccess(isAdmin || hasAllPermissions)
        setIsAdminOnly(isAdmin) // Apenas admin/superadmin
      }
    }
    fetchUserPermissions()
  }, [supabase])

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detectar mudanças nos dados do perfil
  useEffect(() => {
    const dataChanged = JSON.stringify(profileData) !== JSON.stringify(originalProfileData)
    const avatarChanged = avatarFile !== null
    const logoChanged = logoFile !== null
    const preferencesChanged = 
      menuPosition !== savedMenuPosition ||
      showDailyBalance !== savedShowDailyBalance ||
      customUrlSlug !== savedCustomUrlSlug ||
      customDomain !== savedCustomDomain
    setHasChanges(dataChanged || avatarChanged || logoChanged || preferencesChanged)
  }, [profileData, originalProfileData, avatarFile, logoFile, menuPosition, savedMenuPosition, showDailyBalance, savedShowDailyBalance, customUrlSlug, savedCustomUrlSlug, customDomain, savedCustomDomain])

  // Carregar preferências do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPosition = localStorage.getItem('menuPosition') as 'sidebar' | 'header' | 'footer' | 'right' | null
      const savedBalance = localStorage.getItem('showDailyBalance')
      
      if (savedPosition) {
        setMenuPosition(savedPosition)
        setSavedMenuPosition(savedPosition)
      }
      
      if (savedBalance) {
        const balance = savedBalance === 'true'
        setShowDailyBalance(balance)
        setSavedShowDailyBalance(balance)
      }
    }
  }, [])

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

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

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
            business_name: '',
            address: '',
            neighborhood: '',
            city: '',
            state: '',
            zip_code: '',
            avatar_url: null,
            logo_url: null,
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

      if (data) {
        const loadedData = {
          id: user.id,
          email: user.email || '',
          full_name: data.full_name || '',
          phone: data.phone || '',
          cpf_cnpj: data.cpf_cnpj || '',
          business_name: data.business_name || '',
          address: data.address || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          avatar_url: data.avatar_url || null,
          logo_url: data.logo_url || null,
          always_open: data.always_open || false,
          business_hours: data.business_hours ? 
            (typeof data.business_hours === 'object' && Object.keys(data.business_hours).length > 0 
              ? data.business_hours 
              : profileData.business_hours)
            : profileData.business_hours
        }
        setProfileData(loadedData)
        setOriginalProfileData(loadedData)
        
        // Load custom URL slug from profile_settings
        try {
          const settingsResponse = await fetch('/api/profile-settings')
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json()
            setCustomUrlSlug(settingsData.custom_url_slug || '')
            setSavedCustomUrlSlug(settingsData.custom_url_slug || '')
            setCustomDomain(settingsData.custom_domain || '')
            setSavedCustomDomain(settingsData.custom_domain || '')
            setIsDomainVerified(settingsData.custom_domain_verified || false)
          }
        } catch (error) {
          console.error('Erro ao carregar configurações:', error)
        }
        
        if (data.avatar_url) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.avatar_url)
          setAvatarPreview(publicUrl)
        }
        
        if (data.logo_url) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.logo_url)
          setLogoPreview(publicUrl)
        }
      } else {
        const newData = {
          id: user.id,
          email: user.email || '',
          full_name: '',
          phone: '',
          cpf_cnpj: '',
          business_name: '',
          address: '',
          neighborhood: '',
          city: '',
          state: '',
          zip_code: '',
          avatar_url: null,
          logo_url: null,
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setProfileData(prev => ({ ...prev, logo_url: null }))
  }

  const handleVerifyDomain = async () => {
    if (!customDomain) {
      setDomainError('Digite um domínio para verificar')
      return
    }

    // Validar formato do domínio
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/
    if (!domainRegex.test(customDomain)) {
      setDomainError('Formato de domínio inválido. Ex: meuestabelecimento.com.br')
      return
    }

    setIsVerifyingDomain(true)
    setDomainError('')

    try {
      const response = await fetch('/api/profile-settings/verify-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: customDomain })
      })

      const data = await response.json()

      if (!response.ok) {
        setDomainError(data.error || 'Erro ao verificar domínio')
        setIsDomainVerified(false)
        showToast({
          title: 'Falha na verificação',
          message: data.details || data.error || 'Não foi possível verificar o domínio',
          variant: 'error',
          duration: 5000,
        })
        return
      }

      setIsDomainVerified(true)
      setSavedCustomDomain(customDomain)
      showToast({
        title: 'Domínio verificado!',
        message: `Seu domínio ${customDomain} está configurado corretamente`,
        variant: 'success',
        duration: 4000,
      })
    } catch (error) {
      console.error('Erro ao verificar domínio:', error)
      setDomainError('Erro ao verificar domínio. Tente novamente.')
      setIsDomainVerified(false)
      showToast({
        title: 'Erro',
        message: 'Erro ao verificar domínio. Tente novamente.',
        variant: 'error',
        duration: 4000,
      })
    } finally {
      setIsVerifyingDomain(false)
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

      let logoUrl = profileData.logo_url

      // Upload do logo se houver
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, logoFile, { upsert: true })

        if (uploadError) {
          console.error('Erro no upload do logo:', uploadError)
          showToast({
            title: 'Erro',
            message: `Erro ao fazer upload do logo: ${uploadError.message}`,
            variant: 'error',
            duration: 4000,
          })
          setSaving(false)
          return
        }

        // Remove logo antigo se existir
        if (logoUrl && logoUrl !== fileName) {
          await supabase.storage.from('avatars').remove([logoUrl])
        }

        logoUrl = fileName
      }

      // Atualiza o nome no user_metadata do auth para sincronizar com o sidebar e Authentication
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          name: profileData.full_name,
          full_name: profileData.full_name
        }
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
          business_name: profileData.business_name,
          address: profileData.address,
          neighborhood: profileData.neighborhood,
          city: profileData.city,
          state: profileData.state,
          zip_code: profileData.zip_code,
          avatar_url: avatarUrl,
          logo_url: logoUrl,
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

      // Salvar preferências no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('menuPosition', menuPosition)
        localStorage.setItem('showDailyBalance', showDailyBalance.toString())
        
        // Atualizar estados salvos
        setSavedMenuPosition(menuPosition)
        setSavedShowDailyBalance(showDailyBalance)
        
        // Disparar evento de mudança de posição do menu
        window.dispatchEvent(new CustomEvent('menu-position-changed', {
          detail: { position: menuPosition }
        }))
      }

      // Salvar URL personalizada via API se mudou
      if (customUrlSlug !== savedCustomUrlSlug) {
        // Validar URL antes de salvar
        if (customUrlSlug) {
          const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
          if (!slugRegex.test(customUrlSlug) || customUrlSlug.length < 3 || customUrlSlug.length > 50) {
            showToast({
              title: 'Erro',
              message: 'URL inválida. Use apenas letras minúsculas, números e hífens (3-50 caracteres)',
              variant: 'error',
              duration: 4000,
            })
            setSaving(false)
            return
          }
        }

        try {
          const urlResponse = await fetch('/api/profile-settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              custom_url_slug: customUrlSlug || null,
              custom_domain: customDomain || null
            })
          })

          if (!urlResponse.ok) {
            const errorData = await urlResponse.json().catch(() => ({ error: 'Erro desconhecido' }))
            throw new Error(errorData.error || 'Erro ao salvar configurações')
          }

          setSavedCustomUrlSlug(customUrlSlug)
          setSavedCustomDomain(customDomain)
        } catch (error) {
          console.error('Erro ao salvar configurações:', error)
          showToast({
            title: 'Erro',
            message: error instanceof Error ? error.message : 'Erro ao salvar configurações',
            variant: 'error',
            duration: 4000,
          })
          setSaving(false)
          return
        }
      }

      showToast({
        title: 'Sucesso!',
        message: 'Perfil atualizado com sucesso!',
        variant: 'success',
        duration: 3000,
      })
      setAvatarFile(null)
      setLogoFile(null)
      
      // Atualiza os dados originais após salvar
      setOriginalProfileData({
        ...profileData,
        avatar_url: avatarUrl,
        logo_url: logoUrl
      })
      
      // Recarrega o perfil para pegar a URL pública atualizada
      await loadProfile()
      
      // Dispara evento para atualizar o avatar na sidebar (mesmo se for null/removido)
      const { data: { publicUrl } } = avatarUrl 
        ? supabase.storage.from('avatars').getPublicUrl(avatarUrl)
        : { data: { publicUrl: null } }
      
      const event = new CustomEvent('avatar-updated', { 
        detail: { avatarUrl: publicUrl } 
      })
      window.dispatchEvent(event)
      
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
        <Spinner size="large" className="text-[var(--color-clay-500)]" />
      </div>
    )
  }

  return (
    <div className="rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: '#FFFBFB' }}>
      <form onSubmit={handleSubmit} className="p-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:outline-none cursor-pointer ${
                activeTab === 'personal'
                  ? 'border-[var(--color-clay-500)] text-[var(--color-clay-500)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 inline-block mr-2" />
              Informações Pessoais
            </button>
            {hasFullAccess && (
            <button
              type="button"
              onClick={() => setActiveTab('establishment')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:outline-none cursor-pointer ${
                activeTab === 'establishment'
                  ? 'border-[var(--color-clay-500)] text-[var(--color-clay-500)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4 inline-block mr-2" />
              Estabelecimento
            </button>
            )}
            {hasFullAccess && (
            <button
              type="button"
              onClick={() => setActiveTab('hours')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:outline-none cursor-pointer ${
                activeTab === 'hours'
                  ? 'border-[var(--color-clay-500)] text-[var(--color-clay-500)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-4 h-4 inline-block mr-2" />
              Horários de Funcionamento
            </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:outline-none cursor-pointer ${
                activeTab === 'preferences'
                  ? 'border-[var(--color-clay-500)] text-[var(--color-clay-500)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 inline-block mr-2" />
              Preferências
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="pb-6 border-b border-gray-200">
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
                  <p className="text-sm text-gray-500">Foto de Perfil</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, AVIF ou GIF (máx. 1MB)</p>
                </div>
              </div>
            </div>

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
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm"
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
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
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
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm"
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
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'establishment' && (
          <div className="space-y-6">
            {/* Logo Section */}
            <div className="pb-6 border-b border-gray-200">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <label className="cursor-pointer group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                      {logoPreview ? (
                        <>
                          <Image 
                            src={logoPreview} 
                            alt="Logo" 
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
                          <Building2 className="w-16 h-16 text-gray-400 group-hover:text-gray-500 transition-colors" />
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
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 hover:scale-110 transition-transform"
                    >
                      <CircleX className="w-6 h-6 text-[#D67973] hover:text-[#C86561] transition-colors" />
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Logo do Estabelecimento</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, AVIF ou GIF (máx. 1MB)</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do estabelecimento
              </label>
              <input
                type="text"
                name="business_name"
                value={profileData.business_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm"
                placeholder="Nome do seu estabelecimento"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  name="zip_code"
                  value={profileData.zip_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm"
                  placeholder="00000-000"
                />
              </div>

              <div className="md:col-span-7">
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
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm"
                    placeholder="Rua, número, complemento"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  name="neighborhood"
                  value={profileData.neighborhood}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm"
                  placeholder="Bairro"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  name="city"
                  value={profileData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm"
                  placeholder="Cidade"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  name="state"
                  value={profileData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm"
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
                          className="ml-auto flex items-center gap-1 text-xs text-[var(--color-clay-500)] hover:text-[var(--color-clay-500)]/80 transition-colors"
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
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-600 min-w-[40px]">Fecha:</label>
                              <input
                                type="time"
                                value={interval.close}
                                onChange={(e) => handleIntervalChange(key, idx, 'close', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent"
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

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* URL Personalizada - Apenas para Admin */}
            {isAdminOnly && (
            <div className="pb-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-5 h-5 text-gray-700" />
                    <h3 className="text-base font-semibold text-gray-900">Link personalizado</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure um link personalizado para seu estabelecimento.
                  </p>
                  
                  <div className="max-w-md space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">sotasty.com.br/</span>
                      <input
                        type="text"
                        value={customUrlSlug}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().trim()
                          setCustomUrlSlug(value)
                          if (!value) {
                            setUrlError('')
                          } else {
                            const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
                            if (!slugRegex.test(value)) {
                              setUrlError('Use apenas letras minúsculas, números e hífens')
                            } else if (value.length < 3) {
                              setUrlError('Mínimo de 3 caracteres')
                            } else if (value.length > 50) {
                              setUrlError('Máximo de 50 caracteres')
                            } else {
                              setUrlError('')
                            }
                          }
                        }}
                        placeholder="seuestabelecimento"
                        className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent ${urlError ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </div>
                    
                    {urlError && (
                      <p className="text-sm text-red-600">{urlError}</p>
                    )}
                    
                    {customUrlSlug && !urlError && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span>Exemplo: sotasty.com.br/<strong>{customUrlSlug}</strong>/cardapio-principal</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Domínio Personalizado - Apenas para Admin */}
            {isAdminOnly && (
            <div className="pb-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-gray-700" />
                    <h3 className="text-base font-semibold text-gray-900">Domínio Personalizado</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Use seu próprio domínio para seus cardápios públicos. 
                    Ex: <strong>meuestabelecimento.com.br</strong>
                  </p>
                  
                  <div className="max-w-2xl space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <input
                          type="text"
                          value={customDomain}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().trim()
                            setCustomDomain(value)
                            setDomainError('')
                            if (value !== savedCustomDomain) {
                              setIsDomainVerified(false)
                            }
                          }}
                          placeholder="meuestabelecimento.com.br"
                          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent ${domainError ? 'border-red-500' : isDomainVerified ? 'border-green-500' : 'border-gray-300'}`}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyDomain}
                          disabled={isVerifyingDomain || !customDomain || isDomainVerified}
                          className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isVerifyingDomain ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Verificando...
                            </>
                          ) : isDomainVerified ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Verificado
                            </>
                          ) : (
                            'Verificar DNS'
                          )}
                        </button>
                      </div>
                      
                      {domainError && (
                        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{domainError}</span>
                        </div>
                      )}
                      
                      {isDomainVerified && !domainError && (
                        <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 p-3 rounded">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Domínio verificado e configurado com sucesso!</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-blue-900">Como configurar seu domínio:</h4>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Acesse o painel de controle do seu provedor de domínio</li>
                        <li>Crie um registro <strong>CNAME</strong> com estas configurações:
                          <div className="ml-6 mt-1 space-y-0.5">
                            <div>• <strong>Tipo:</strong> CNAME</div>
                            <div>• <strong>Nome/Host:</strong> cardapios (ou subdomínio desejado)</div>
                            <div>• <strong>Aponta para:</strong> <code className="bg-blue-100 px-1 py-0.5 rounded">cname.sotasty.com.br</code></div>
                            <div>• <strong>TTL:</strong> 3600 (ou automático)</div>
                          </div>
                        </li>
                        <li>Aguarde de 5 minutos a 48h para propagação do DNS</li>
                        <li>Clique em &quot;Verificar DNS&quot; para confirmar a configuração</li>
                      </ol>
                      <p className="text-xs text-blue-700 mt-2">
                        💡 <strong>Dica:</strong> A maioria dos provedores propaga em menos de 1 hora
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Posição do Menu */}
            <div className={`pb-6 ${isAdminOnly ? 'border-b border-gray-200' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Layout className="w-5 h-5 text-gray-700" />
                    <h3 className="text-base font-semibold text-gray-900">Posição do Menu</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Escolha onde deseja visualizar o menu de navegação principal
                  </p>
                </div>
                <div className="ml-6 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="menuPosition"
                      value="sidebar"
                      checked={menuPosition === 'sidebar'}
                      onChange={(e) => setMenuPosition(e.target.value as 'sidebar' | 'header' | 'footer' | 'right')}
                      className="w-4 h-4 text-[#BE9089] focus:ring-[#BE9089]"
                    />
                    <span className="text-sm text-gray-700">Esquerda</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="menuPosition"
                      value="right"
                      checked={menuPosition === 'right'}
                      onChange={(e) => setMenuPosition(e.target.value as 'sidebar' | 'header' | 'footer' | 'right')}
                      className="w-4 h-4 text-[#BE9089] focus:ring-[#BE9089]"
                    />
                    <span className="text-sm text-gray-700">Direita</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="menuPosition"
                      value="header"
                      checked={menuPosition === 'header'}
                      onChange={(e) => setMenuPosition(e.target.value as 'sidebar' | 'header' | 'footer' | 'right')}
                      className="w-4 h-4 text-[#BE9089] focus:ring-[#BE9089]"
                    />
                    <span className="text-sm text-gray-700">Cabeçalho</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="menuPosition"
                      value="footer"
                      checked={menuPosition === 'footer'}
                      onChange={(e) => setMenuPosition(e.target.value as 'sidebar' | 'header' | 'footer' | 'right')}
                      className="w-4 h-4 text-[#BE9089] focus:ring-[#BE9089]"
                    />
                    <span className="text-sm text-gray-700">Rodapé</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Começar do Zero - Apenas para Admin */}
            {isAdminOnly && (
            <div className="pb-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Começar do zero</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Aqui você pode zerar sua conta, deletando toda sua movimentação financeira. 
                    Suas contas, clientes e produtos cadastrados permanecerão intactos.
                  </p>
                </div>
                <div className="ml-6">
                  <button
                    type="button"
                    onClick={() => setIsResetDialogOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-danger-500)] rounded-full border border-transparent transition-all cursor-pointer hover:bg-[var(--color-danger-50)] hover:border-[var(--color-danger-300)]"
                  >
                    <BrushCleaning className="w-4 h-4" />
                    Excluir minhas transações
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Excluir Conta - Apenas para Admin */}
            {isAdminOnly && (
            <div className="pb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Excluir conta</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Hora de dizer tchau? Aqui você pode excluir sua conta definitivamente
                  </p>
                </div>
                <div className="ml-6">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-danger-500)] rounded-full border border-transparent transition-all cursor-pointer hover:bg-[var(--color-danger-50)] hover:border-[var(--color-danger-300)]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir conta por completo
                  </button>
                </div>
              </div>
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

      {/* Reset Account Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Transações</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá deletar TODOS os dados da sua conta de forma permanente e irreversível.
              
              <div className="mt-4 mb-4">
                <p className="font-semibold text-gray-900 mb-2">Os seguintes itens serão excluídos:</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                  <li>Produtos (Insumos, bases de preparo e produtos finais)</li>
                  <li>Cardápios</li>
                  <li>Pedidos</li>
                  <li>Transações financeiras</li>
                  <li>Histórico de mensagens no WhatsApp e conexões</li>
                  <li>Clientes</li>
                  <li>Tarefas da agenda</li>
                  <li>Registro de atividades</li>
                  <li>Preferências</li>
                  <li>Categorias de produtos e financeiras personalizadas</li>
                  <li>Usuários vinculados à sua conta</li>
                </ul>
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="font-semibold text-gray-900">Para confirmar, digite exatamente:</p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">ZERAR CONTA</p>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Digite aqui..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-clay-500)] focus:border-transparent text-sm"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsResetDialogOpen(false)
              setResetConfirmText('')
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (resetConfirmText === 'ZERAR CONTA') {
                  try {
                    const response = await fetch('/api/profile-settings/reset-account', {
                      method: 'POST',
                    })
                    
                    if (response.ok) {
                      showToast({
                        title: 'Sucesso!',
                        message: 'Transações excluídas com sucesso!',
                        variant: 'success',
                        duration: 3000,
                      })
                      setIsResetDialogOpen(false)
                      setResetConfirmText('')
                    } else {
                      showToast({
                        title: 'Erro',
                        message: 'Erro ao excluir transações',
                        variant: 'error',
                        duration: 3000,
                      })
                    }
                  } catch (error) {
                    console.error('Error resetting account:', error)
                    showToast({
                      title: 'Erro',
                      message: 'Erro ao excluir transações',
                      variant: 'error',
                      duration: 3000,
                    })
                  }
                }
              }}
              disabled={resetConfirmText !== 'ZERAR CONTA'}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Excluir Transações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
