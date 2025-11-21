import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PublicProfilePageProps {
  params: Promise<{
    profileId: string
  }>
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { profileId } = await params
  
  console.log('[PublicProfilePage] ProfileId:', profileId)
  
  const supabase = await createClient()
  
  // Buscar profile_settings pelo ID
  const { data: settings, error } = await supabase
    .from('profile_settings')
    .select('id, user_id')
    .eq('id', profileId)
    .single()
  
  console.log('[PublicProfilePage] Settings:', { settings, error })
  
  if (error || !settings) {
    console.log('[PublicProfilePage] Not found, error:', error)
    notFound()
  }
  
  // Buscar profile do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, business_type')
    .eq('id', settings.user_id)
    .single()
  
  console.log('[PublicProfilePage] Profile:', profile)
  
  // Buscar todos os menus ativos
  const { data: menus, error: menusError } = await supabase
    .from('menus')
    .select(`
      id,
      name,
      description,
      url_slug,
      display_order,
      active
    `)
    .eq('user_id', settings.user_id)
    .order('display_order', { ascending: true })
  
  console.log('[PublicProfilePage] All Menus (without active filter):', { menus, menusError })
  
  // Filtrar apenas menus ativos
  const activeMenus = menus?.filter(m => m.active) || []
  
  console.log('[PublicProfilePage] Active Menus:', activeMenus)
  
  const businessName = profile?.business_name || 'Nosso Negócio'
  
  console.log('[PublicProfilePage] BusinessName:', businessName)
  
  return (
    <div className="min-h-screen bg-[var(--color-milk-500)]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[var(--color-clay-500)] to-[var(--color-clay-600)] text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold mb-2">{businessName}</h1>
          <p className="text-[var(--color-milk-100)] text-lg">Nossos Cardápios</p>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {!activeMenus || activeMenus.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Nenhum cardápio disponível
            </h2>
            <p className="text-gray-600">
              Estamos preparando nossos cardápios. Volte em breve!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {activeMenus.map((menu) => (
              <Link
                key={menu.id}
                href={`/p/${profileId}/${menu.url_slug || menu.id}`}
                className="group block bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border-2 border-transparent hover:border-[var(--color-clay-500)]"
              >
                <div className="bg-gradient-to-r from-[var(--color-clay-500)] to-[var(--color-clay-600)] px-6 py-4">
                  <h2 className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">
                    {menu.name}
                  </h2>
                </div>
                
                <div className="p-6">
                  {menu.description ? (
                    <p className="text-[var(--color-graphite-600)] mb-4">{menu.description}</p>
                  ) : (
                    <p className="text-[var(--color-graphite-400)] italic mb-4">Clique para ver o cardápio completo</p>
                  )}
                  
                  <div className="flex items-center text-[var(--color-clay-600)] font-semibold group-hover:translate-x-2 transition-transform">
                    Ver cardápio
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-[var(--color-graphite-600)] text-sm">
          <p>Cardápios digitais criados com <span className="text-[var(--color-clay-500)]">♥</span> por <strong>SoTasty</strong></p>
        </div>
      </footer>
    </div>
  )
}
