"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Steps } from "@ark-ui/react/steps"
import { Check, Palette, Info, Package, Loader2, Camera, Building2, CircleX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { showToast } from '@/app/(dashboard)/layout'

interface Product {
  id: string
  name: string
  description?: string
  sale_price?: number
  image_url?: string
}

interface MenuFormData {
  // Básico
  name: string
  description: string
  url_slug: string
  
  // Personalização (será salvo em profile_settings)
  background_color: string
  text_color: string
  logo_url: string
  
  // Informações
  whatsapp_number: string
  delivery_enabled: boolean
  pickup_enabled: boolean
  delivery_fee: string
  estimated_time: string
  business_hours: string
  accepts_scheduling: boolean
  
  // Produtos selecionados
  selected_products: string[]
}

export default function NovoCardapioPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [customUrlSlug, setCustomUrlSlug] = useState<string>('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    description: '',
    url_slug: '',
    background_color: '#B3736B',
    text_color: '#FFFFFF',
    logo_url: '',
    whatsapp_number: '',
    delivery_enabled: true,
    pickup_enabled: true,
    delivery_fee: '',
    estimated_time: '',
    business_hours: '',
    accepts_scheduling: false,
    selected_products: []
  })

  const steps = [
    {
      title: "Básico",
      icon: Info,
      description: "Nome e descrição do cardápio"
    },
    {
      title: "Personalização",
      icon: Palette,
      description: "Estilização do cardápio"
    },
    {
      title: "Informações",
      icon: Info,
      description: "Atendimento e delivery"
    },
    {
      title: "Produtos",
      icon: Package,
      description: "Selecione os produtos"
    }
  ]

  useEffect(() => {
    loadProducts()
    loadProfileSettings()
  }, [])

  const loadProfileSettings = async () => {
    try {
      const response = await fetch('/api/profile-settings')
      if (response.ok) {
        const data = await response.json()
        setCustomUrlSlug(data.custom_url_slug || '')
        
        // Pré-popular com o logo do estabelecimento se existir
        if (data.logo_url) {
          setFormData(prev => ({ ...prev, logo_url: data.logo_url }))
          // Buscar URL pública do logo
          const logoResponse = await fetch(`/api/storage/public-url?bucket=avatars&path=${data.logo_url}`)
          if (logoResponse.ok) {
            const { publicUrl } = await logoResponse.json()
            setLogoPreview(publicUrl)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      url_slug: generateSlug(name)
    }))
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
    setFormData(prev => ({ ...prev, logo_url: '' }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      let logoUrl = formData.logo_url

      // Upload do logo se houver um novo arquivo
      if (logoFile) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', logoFile)
        formDataUpload.append('bucket', 'avatars')
        
        const uploadResponse = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formDataUpload
        })

        if (uploadResponse.ok) {
          const { path } = await uploadResponse.json()
          logoUrl = path
        } else {
          throw new Error('Erro ao fazer upload do logo')
        }
      }

      // 1. Atualizar profile_settings com personalização
      const profileResponse = await fetch('/api/profile-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_color: formData.background_color,
          secondary_color: formData.text_color,
          logo_url: logoUrl,
          whatsapp_number: formData.whatsapp_number,
          business_hours: formData.business_hours
        })
      })

      if (!profileResponse.ok) {
        throw new Error('Erro ao salvar configurações do perfil')
      }

      // 2. Criar o cardápio
      const menuResponse = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          url_slug: formData.url_slug
        })
      })

      if (!menuResponse.ok) {
        throw new Error('Erro ao criar cardápio')
      }

      const menu = await menuResponse.json()

      // 3. Adicionar produtos ao cardápio
      if (formData.selected_products.length > 0) {
        const itemsPromises = formData.selected_products.map(async (productId, index) => {
          const product = products.find(p => p.id === productId)
          if (!product) return

          return fetch('/api/menu-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              menu_id: menu.id,
              product_id: productId,
              name: product.name,
              description: product.description || '',
              price: product.sale_price || 0,
              image_url: product.image_url || '',
              display_order: index,
              available: true
            })
          })
        })

        await Promise.all(itemsPromises)
      }

      showToast({
        title: 'Cardápio criado!',
        message: 'Seu cardápio foi criado com sucesso.',
        variant: 'success'
      })

      router.push('/cardapios')
    } catch (error) {
      console.error('Erro ao criar cardápio:', error)
      showToast({
        title: 'Erro',
        message: 'Não foi possível criar o cardápio. Tente novamente.',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(formData.name && formData.url_slug)
      case 1:
        return true // Personalização é opcional
      case 2:
        return true // Informações são opcionais
      case 3:
        return formData.selected_products.length > 0
      default:
        return false
    }
  }

  const toggleProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_products: prev.selected_products.includes(productId)
        ? prev.selected_products.filter(id => id !== productId)
        : [...prev.selected_products, productId]
    }))
  }

  const formatPrice = (price?: number) => {
    if (!price) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const selectedProductsList = products.filter(p => formData.selected_products.includes(p.id))

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
          {/* Left Column - Form */}
          <div className="min-w-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Criar Novo Cardápio
              </h1>
              <p className="text-gray-600">
                Configure seu cardápio público em alguns passos simples
              </p>
            </div>

            <Steps.Root 
          count={4} 
          step={currentStep}
          onStepChange={(details) => setCurrentStep(details.step)}
          className="w-full"
        >
          {/* Progress Steps */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <Steps.List className="flex justify-between items-start">
              {steps.map((step, index) => (
                <Steps.Item
                  key={index}
                  index={index}
                  className="relative flex not-last:flex-1 items-center"
                >
                  <Steps.Trigger 
                    className="flex flex-col items-center gap-2 text-center group cursor-pointer disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                    disabled={index > currentStep && !isStepValid(currentStep)}
                  >
                    <Steps.Indicator className="flex justify-center items-center shrink-0 rounded-full font-semibold w-12 h-12 text-sm border-2 data-complete:bg-[#B3736B] data-complete:text-white data-complete:border-[#B3736B] data-current:bg-[#B3736B] data-current:text-white data-current:border-[#B3736B] data-incomplete:bg-gray-100 data-incomplete:text-gray-500 data-incomplete:border-gray-200 transition-all">
                      <span className="group-data-complete:hidden group-data-current:block">
                        <step.icon className="w-5 h-5" />
                      </span>
                      <Check className="w-5 h-5 group-data-complete:block hidden" />
                    </Steps.Indicator>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-900 group-data-incomplete:text-gray-500">
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500 group-data-incomplete:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </Steps.Trigger>
                  <Steps.Separator
                    hidden={index === steps.length - 1}
                    className="flex-1 bg-gray-200 h-0.5 mx-3 data-complete:bg-[#B3736B] transition-all"
                  />
                </Steps.Item>
              ))}
            </Steps.List>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-xl shadow-sm p-8 min-h-[400px]">
            {/* Step 0: Básico */}
            <Steps.Content index={0}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name">Nome do Cardápio *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Cardápio de Bolos"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="url_slug">Link do Cardápio *</Label>
                  <div className="mt-2">
                    <div className="flex items-center gap-0.5 text-sm text-gray-600 mb-2">
                      <span>sotasty.com.br/{customUrlSlug || '[sua-url]'}/</span>
                      <span className="font-semibold text-[#B3736B]">
                        {formData.url_slug || 'link-do-cardapio'}
                      </span>
                    </div>
                    <Input
                      id="url_slug"
                      value={formData.url_slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, url_slug: e.target.value }))}
                      placeholder="link-do-cardapio"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva seu cardápio..."
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </div>
            </Steps.Content>

            {/* Step 1: Personalização */}
            <Steps.Content index={1}>
              <div className="space-y-6">
                <div>
                  <Label>Logo do Cardápio</Label>
                  <div className="flex items-center gap-6 mt-2">
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
                                  <Camera className="w-6 h-6 text-gray-700" />
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
                      <p className="text-sm text-gray-500">JPG, PNG ou GIF (máx. 2MB)</p>
                      <p className="text-sm text-gray-400 mt-1">Clique na foto para alterar</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="background_color">Cor de Fundo</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="background_color"
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                        placeholder="#B3736B"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="text_color">Cor da Fonte</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="text_color"
                        type="color"
                        value={formData.text_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.text_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Steps.Content>

            {/* Step 2: Informações */}
            <Steps.Content index={2}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="whatsapp_number">WhatsApp de Atendimento</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Delivery</p>
                      <p className="text-sm text-gray-500">Aceita entregas</p>
                    </div>
                    <Switch
                      checked={formData.delivery_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, delivery_enabled: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Retirada</p>
                      <p className="text-sm text-gray-500">Aceita retiradas</p>
                    </div>
                    <Switch
                      checked={formData.pickup_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pickup_enabled: checked }))}
                    />
                  </div>
                </div>

                {formData.delivery_enabled && (
                  <div>
                    <Label htmlFor="delivery_fee">Taxa de Entrega</Label>
                    <Input
                      id="delivery_fee"
                      value={formData.delivery_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee: e.target.value }))}
                      placeholder="R$ 10,00"
                      className="mt-2"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="estimated_time">Tempo Médio Estimado</Label>
                  <Input
                    id="estimated_time"
                    value={formData.estimated_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_time: e.target.value }))}
                    placeholder="30-45 minutos"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="business_hours">Horário de Atendimento</Label>
                  <Textarea
                    id="business_hours"
                    value={formData.business_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_hours: e.target.value }))}
                    placeholder="Seg-Sex: 8h-18h&#10;Sáb: 9h-14h"
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Aceita Agendamento</p>
                    <p className="text-sm text-gray-500">Permite pedidos agendados</p>
                  </div>
                  <Switch
                    checked={formData.accepts_scheduling}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accepts_scheduling: checked }))}
                  />
                </div>
              </div>
            </Steps.Content>

            {/* Step 3: Produtos */}
            <Steps.Content index={3}>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Selecione os Produtos</h3>
                    <p className="text-sm text-gray-500">
                      {formData.selected_products.length} produto(s) selecionado(s)
                    </p>
                  </div>
                </div>

                {loadingProducts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#B3736B]" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Nenhum produto cadastrado ainda.</p>
                    <Button
                      onClick={() => router.push('/products')}
                      className="mt-4"
                      variant="outline"
                    >
                      Cadastrar Produtos
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {products.map((product) => (
                      <Card
                        key={product.id}
                        className={`p-4 cursor-pointer transition-all ${
                          formData.selected_products.includes(product.id)
                            ? 'border-2 border-[#B3736B] bg-[#B3736B]/5'
                            : 'border hover:border-gray-400'
                        }`}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <div className="flex gap-3">
                          {product.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {product.name}
                            </h4>
                            {product.description && (
                              <p className="text-xs text-gray-500 truncate">
                                {product.description}
                              </p>
                            )}
                            {product.sale_price && (
                              <p className="text-sm font-semibold text-[#B3736B] mt-1">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(product.sale_price)}
                              </p>
                            )}
                          </div>
                          {formData.selected_products.includes(product.id) && (
                            <Check className="w-5 h-5 text-[#B3736B] flex-shrink-0" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Steps.Content>

            {/* Completed State */}
            <Steps.CompletedContent className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Tudo pronto!
                </h3>
                <p className="text-gray-600 max-w-md">
                  Seu cardápio está configurado. Clique em &quot;Criar Cardápio&quot; para finalizar.
                </p>
              </div>
            </Steps.CompletedContent>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-6">
            <Button
              onClick={() => currentStep === 0 ? router.push('/cardapios') : setCurrentStep(prev => prev - 1)}
              disabled={loading}
              className="btn-outline-grey"
            >
              {currentStep === 0 ? 'Cancelar' : 'Voltar'}
            </Button>

            <div className="flex gap-2">
              {currentStep < 3 ? (
                <Steps.NextTrigger asChild>
                  <Button
                    disabled={!isStepValid(currentStep) || loading}
                    className="bg-[var(--color-old-rose)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--color-rosy-brown)] transition font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    Continuar
                  </Button>
                </Steps.NextTrigger>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepValid(3) || loading}
                  className="btn-success"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Criar Cardápio
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Steps.Root>
      </div>

      {/* Right Column - iPhone Preview */}
      <div className="hidden lg:block sticky top-4 h-fit">
        <div className="relative w-full aspect-[9/19]">
          {/* iPhone Frame */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/iphone-17-pro.webp"
              alt="iPhone Frame"
              className="w-full h-full object-contain"
            />
          </div>
              
              {/* Screen Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-[2.5rem] overflow-hidden bg-white shadow-inner" style={{ width: '345px', height: '730px' }}>
                  <div className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" style={{ scrollbarWidth: 'thin' }}>
                    {/* Preview Header */}
                    <div 
                      className="px-4 text-center pt-12 pb-8"
                      style={{ 
                        backgroundColor: formData.background_color,
                        color: formData.text_color
                      }}
                    >
                      {logoPreview && (
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={logoPreview} 
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <h1 className="text-lg font-bold mb-1">
                        {formData.name || 'Nome do Cardápio'}
                      </h1>
                      
                      {formData.description && (
                        <p className="text-xs text-white/90">
                          {formData.description}
                        </p>
                      )}
                    </div>

                    {/* Contact Buttons Preview */}
                    {formData.whatsapp_number && (
                      <div className="px-3 -mt-4 mb-4">
                        <div className="bg-white rounded-xl shadow-lg p-3 flex justify-center">
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full text-xs font-semibold">
                            <span>📱</span>
                            WhatsApp
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Info Preview */}
                    {(formData.delivery_enabled || formData.pickup_enabled) && (
                      <div className="px-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
                          {formData.delivery_enabled && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">🚚 Delivery</span>
                              <span className="font-semibold">{formData.delivery_fee || 'Consulte'}</span>
                            </div>
                          )}
                          {formData.pickup_enabled && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">🏪 Retirada</span>
                              <span className="font-semibold text-green-600">Disponível</span>
                            </div>
                          )}
                          {formData.estimated_time && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">⏱️ Tempo médio</span>
                              <span className="font-semibold">{formData.estimated_time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Products Preview */}
                    <div className="px-4 pb-4">
                      {selectedProductsList.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Selecione produtos para visualizar</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedProductsList.slice(0, 5).map((product) => (
                            <div
                              key={product.id}
                              className="bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow"
                            >
                              <div className="flex gap-2">
                                {product.image_url && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-xs text-gray-900 truncate">
                                    {product.name}
                                  </h4>
                                  {product.description && (
                                    <p className="text-[10px] text-gray-500 truncate">
                                      {product.description}
                                    </p>
                                  )}
                                  <p 
                                    className="text-xs font-bold mt-1"
                                    style={{ color: formData.background_color }}
                                  >
                                    {formatPrice(product.sale_price)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {selectedProductsList.length > 5 && (
                            <p className="text-center text-[10px] text-gray-400">
                              +{selectedProductsList.length - 5} produtos
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Business Hours Preview */}
                    {formData.business_hours && (
                      <div className="px-4 pb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">
                            ⏰ Horário de Atendimento
                          </p>
                          <p className="text-[10px] text-gray-600 whitespace-pre-line">
                            {formData.business_hours}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Footer Preview */}
                    <div className="px-4 pb-6 pt-2">
                      <div className="text-center">
                        <p className="text-[11px] text-gray-500">
                          SoTasty<br />
                          Taste the difference
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
