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
    .select('id, user_id')
    .eq('id', profileId)
    .single()
  
  if (settingsError || !settings) {
    notFound()
  }
  
  // Buscar profile do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, business_type')
    .eq('id', settings.user_id)
    .single()
  
  // Buscar o menu específico (por slug ou ID)
  const { data: menu, error: menuError } = await supabase
    .from('menus')
    .select(`
      id,
      name,
      description,
      url_slug,
      active,
      menu_items(
        id,
        name,
        description,
        price,
        image_url,
        available,
        display_order
      )
    `)
    .eq('user_id', settings.user_id)
    .eq('active', true)
    .eq('url_slug', menuSlug)
    .single()
  
  if (menuError || !menu) {
    console.error('[Public Menu] Menu not found:', menuSlug, 'Profile:', settings.id)
    if (menuError) console.error('[Public Menu] DB Error:', menuError)
    notFound()
  }
  
  const businessName = profile?.business_name || 'Cardápio'
  
  return (
    <div className="min-h-screen bg-[#2B2B2B]">
      {/* Header */}
      <header className="bg-[#2B2B2B] text-white px-4 py-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-[#3A3A3A] overflow-hidden">
              {/* Placeholder para foto do perfil */}
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-1">{menu.name}</h1>
          {menu.description && (
            <p className="text-sm text-gray-400">{menu.description}</p>
          )}
        </div>
      </header>
      
      {/* Delivery/Retirada badges */}
      <div className="bg-[#2B2B2B] px-4 pb-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-sm">
            <span className="bg-[#3A3A3A] px-3 py-1 rounded-full flex items-center gap-1">
              🚚 Delivery
            </span>
            <span className="bg-[#3A3A3A] px-3 py-1 rounded-full flex items-center gap-1">
              🏪 Retirada
            </span>
          </div>
          <button className="text-[var(--color-clay-500)] font-semibold text-sm">
            Consulte
          </button>
        </div>
      </div>
      
      {/* Content */}
      <main className="bg-white rounded-t-3xl px-4 py-6 min-h-screen">
        <div className="max-w-2xl mx-auto">
          {(!menu.menu_items || menu.menu_items.length === 0) ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Este cardápio ainda não possui produtos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {menu.menu_items
                .sort((a, b) => a.display_order - b.display_order)
                .map((item) => {
                const itemName = item.name || 'Sem nome'
                const itemDescription = item.description
                const itemPrice = item.price || 0
                const itemImage = item.image_url
                
                return (
                  <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                    {itemImage && (
                      <div className="flex-shrink-0">
                        <Image
                          src={itemImage}
                          alt={itemName}
                          width={60}
                          height={60}
                          className="w-[60px] h-[60px] object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#2B2B2B] text-base leading-tight">
                        {itemName}
                      </h3>
                      {itemDescription && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                          {itemDescription}
                        </p>
                      )}
                      <p className="text-[#2B2B2B] font-semibold mt-2">
                        R$ {itemPrice.toFixed(2).replace('.', ',')}
                      </p>
                      {!item.available && (
                        <span className="inline-block mt-1 text-xs text-gray-500">
                          Indisponível
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white px-4 pb-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-400 text-xs font-semibold">SoTasty</p>
          <p className="text-gray-300 text-xs">Taste the difference</p>
        </div>
      </footer>
    </div>
  )
}
