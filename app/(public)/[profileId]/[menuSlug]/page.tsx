import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface PublicMenuPageProps {
  params: Promise<{
    profileId: string
    menuSlug: string
  }>
}

export default async function PublicMenuPage({ params }: PublicMenuPageProps) {
  const { profileId, menuSlug } = await params
  const supabase = await createClient()
  
  // Buscar profile_settings pelo ID
  const { data: settings, error: settingsError } = await supabase
    .from('profile_settings')
    .select(`
      id,
      user_id,
      profiles!inner(
        business_name,
        business_type
      )
    `)
    .eq('id', profileId)
    .single()
  
  if (settingsError || !settings) {
    notFound()
  }
  
  // Buscar o menu específico (por slug ou ID)
  const { data: menu, error: menuError } = await supabase
    .from('menus')
    .select(`
      id,
      name,
      description,
      slug,
      is_active,
      menu_items!inner(
        id,
        name,
        description,
        price,
        image_url,
        is_available,
        display_order,
        final_product_id,
        final_products(
          id,
          name,
          description,
          base_price,
          image_url
        )
      )
    `)
    .eq('profile_settings_id', settings.id)
    .eq('is_active', true)
    .or(`slug.eq.${menuSlug},id.eq.${menuSlug}`)
    .single()
  
  if (menuError || !menu) {
    notFound()
  }
  
  const profile = Array.isArray(settings.profiles) ? settings.profiles[0] : settings.profiles
  const businessName = profile?.business_name || 'Cardápio'
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-orange-600 hover:text-orange-700 text-sm font-medium mb-2 inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para todos os cardápios
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{businessName}</h1>
          <p className="text-gray-600 mt-1">{menu.name}</p>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {menu.description && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
              <p className="text-white text-lg">{menu.description}</p>
            </div>
          )}
          
          <div className="divide-y divide-gray-200">
            {menu.menu_items
              .sort((a, b) => a.display_order - b.display_order)
              .map((item) => {
                const product = Array.isArray(item.final_products) ? item.final_products[0] : item.final_products
                const itemName = item.name || product?.name || 'Sem nome'
                const itemDescription = item.description || product?.description
                const itemPrice = item.price || product?.base_price || 0
                const itemImage = item.image_url || product?.image_url
                
                return (
                  <div key={item.id} className="p-6 flex gap-4 hover:bg-gray-50 transition-colors">
                    {itemImage && (
                      <div className="flex-shrink-0">
                        <Image
                          src={itemImage}
                          alt={itemName}
                          width={96}
                          height={96}
                          className="w-24 h-24 object-cover rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {itemName}
                          </h3>
                          {itemDescription && (
                            <p className="text-gray-600 mt-1 text-sm">
                              {itemDescription}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0">
                          <span className="text-xl font-bold text-orange-600">
                            R$ {itemPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      {!item.is_available && (
                        <span className="inline-block mt-2 px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">
                          Indisponível
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>Cardápio digital criado com <span className="text-orange-500">♥</span> por <strong>SoTasty</strong></p>
        </div>
      </footer>
    </div>
  )
}
