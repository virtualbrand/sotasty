"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Steps } from "@ark-ui/react/steps"
import { Check, Palette, Info, Package, Loader2 } from 'lucide-react'
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
  primary_color: string
  secondary_color: string
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
  
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    description: '',
    url_slug: '',
    primary_color: '#B3736B',
    secondary_color: '#E79F9C',
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
  }, [])

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

  const handleSubmit = async () => {
    try {
      setLoading(true)

      // 1. Atualizar profile_settings com personalização
      const profileResponse = await fetch('/api/profile-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          logo_url: formData.logo_url,
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
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
                    className="flex flex-col items-center gap-2 text-center group cursor-pointer disabled:cursor-not-allowed"
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
                  <Label htmlFor="url_slug">URL do Cardápio *</Label>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span>sotasty.com.br/sua-loja/</span>
                      <span className="font-semibold text-[#B3736B]">
                        {formData.url_slug || 'url-do-cardapio'}
                      </span>
                    </div>
                    <Input
                      id="url_slug"
                      value={formData.url_slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, url_slug: e.target.value }))}
                      placeholder="url-do-cardapio"
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
                  <Label htmlFor="logo_url">URL do Logo</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://..."
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary_color">Cor Primária</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        placeholder="#B3736B"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary_color">Cor Secundária</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        placeholder="#E79F9C"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-sm text-gray-600 mb-4">Preview das cores:</p>
                  <div 
                    className="h-32 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${formData.primary_color} 0%, ${formData.secondary_color} 100%)`
                    }}
                  />
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
              variant="outline"
              disabled={loading}
            >
              {currentStep === 0 ? 'Cancelar' : 'Voltar'}
            </Button>

            <div className="flex gap-2">
              {currentStep < 3 ? (
                <Steps.NextTrigger asChild>
                  <Button
                    disabled={!isStepValid(currentStep) || loading}
                    className="bg-[#B3736B] hover:bg-[#A0655D]"
                  >
                    Continuar
                  </Button>
                </Steps.NextTrigger>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepValid(3) || loading}
                  className="bg-[#B3736B] hover:bg-[#A0655D]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Cardápio'
                  )}
                </Button>
              )}
            </div>
          </div>
        </Steps.Root>
      </div>
    </div>
  )
}
