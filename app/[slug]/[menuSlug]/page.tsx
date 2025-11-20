'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ExternalLink, Instagram, Phone } from 'lucide-react'
import PageLoading from '@/components/PageLoading'

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  available: boolean
}

interface PublicMenuData {
  menu: {
    id: string
    name: string
    description?: string
  }
  business: {
    name?: string
    description?: string
    logo_url?: string
    whatsapp_number?: string
    instagram_handle?: string
    primary_color?: string
    secondary_color?: string
  }
  items: MenuItem[]
}

export default function PublicMenuPage() {
  const params = useParams()
  const slug = params.slug as string
  const menuSlug = params.menuSlug as string
  
  const [menuData, setMenuData] = useState<PublicMenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMenu()
  }, [slug, menuSlug])

  const loadMenu = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/public/menu/${slug}/${menuSlug}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Cardápio não encontrado')
        } else {
          setError('Erro ao carregar cardápio')
        }
        return
      }

      const data = await response.json()
      setMenuData(data)
    } catch (err) {
      console.error('Erro ao carregar cardápio:', err)
      setError('Erro ao carregar cardápio')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const handleWhatsAppClick = () => {
    if (menuData?.business.whatsapp_number) {
      const number = menuData.business.whatsapp_number.replace(/\D/g, '')
      window.open(`https://wa.me/${number}`, '_blank')
    }
  }

  const handleInstagramClick = () => {
    if (menuData?.business.instagram_handle) {
      const handle = menuData.business.instagram_handle.replace('@', '')
      window.open(`https://instagram.com/${handle}`, '_blank')
    }
  }

  if (loading) {
    return <PageLoading />
  }

  if (error || !menuData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Cardápio não encontrado'}
          </h1>
          <p className="text-gray-600">
            Verifique se o link está correto ou entre em contato com o estabelecimento.
          </p>
        </div>
      </div>
    )
  }

  const primaryColor = menuData.business.primary_color || '#B3736B'
  const secondaryColor = menuData.business.secondary_color || '#E79F9C'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="text-white py-12 px-4"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {menuData.business.logo_url && (
            <img 
              src={menuData.business.logo_url} 
              alt={menuData.business.name || 'Logo'}
              className="w-24 h-24 mx-auto mb-4 rounded-full object-cover bg-white"
            />
          )}
          
          {menuData.business.name && (
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {menuData.business.name}
            </h1>
          )}
          
          <h2 className="text-xl md:text-2xl font-semibold mb-2">
            {menuData.menu.name}
          </h2>
          
          {menuData.menu.description && (
            <p className="text-white/90 max-w-2xl mx-auto">
              {menuData.menu.description}
            </p>
          )}
        </div>
      </div>

      {/* Contact Buttons */}
      {(menuData.business.whatsapp_number || menuData.business.instagram_handle) && (
        <div className="max-w-4xl mx-auto px-4 -mt-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 flex gap-3 justify-center flex-wrap">
            {menuData.business.whatsapp_number && (
              <button
                onClick={handleWhatsAppClick}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold transition-colors"
              >
                <Phone className="w-5 h-5" />
                WhatsApp
              </button>
            )}
            
            {menuData.business.instagram_handle && (
              <button
                onClick={handleInstagramClick}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white rounded-full font-semibold transition-opacity"
              >
                <Instagram className="w-5 h-5" />
                Instagram
              </button>
            )}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {menuData.items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-600">
              Este cardápio ainda não possui itens cadastrados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {menuData.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex gap-4">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p 
                          className="text-xl font-bold"
                          style={{ color: primaryColor }}
                        >
                          {formatPrice(item.price)}
                        </p>
                        {!item.available && (
                          <span className="text-xs text-red-600">
                            Indisponível
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-[11px] text-gray-500">
                SoTasty<br />
                Taste the difference
          </p>
      </div>
      </div>
    </div>
  )
}
