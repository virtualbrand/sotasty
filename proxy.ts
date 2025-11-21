import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@supabase/supabase-js'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostnameWithPort = request.headers.get('host') || ''
  // Remover porta para comparação
  const hostname = hostnameWithPort.split(':')[0]

  console.log('[Proxy] Request:', {
    hostnameWithPort,
    hostname,
    pathname,
    method: request.method
  })

  // Lista de domínios da própria aplicação
  const appDomains = [
    'localhost',
    'sotasty.com.br',
    'www.sotasty.com.br',
    'sotasty.vercel.app',
  ]

  // Verificar se é um domínio customizado
  const isAppDomain = appDomains.some(domain => hostname === domain || hostname.includes(domain))
  
  if (!isAppDomain) {
    console.log('[Proxy] Custom domain detected:', hostname)
    
    // É um domínio customizado - buscar qual cliente é dono
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      )

      const { data: settings, error } = await supabase
        .from('profile_settings')
        .select('id, custom_domain_verified')
        .eq('custom_domain', hostname)
        .eq('custom_domain_verified', true)
        .single()

      console.log('[Proxy] Query result:', { hostname, settings, error })

      if (error || !settings) {
        return new NextResponse(
          `<html>
            <body style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; background: #f5f5f5;">
              <div style="text-align: center;">
                <h1 style="font-size: 48px; margin: 0;">⚠️</h1>
                <h2>Domínio não configurado</h2>
                <p>Este domínio não está configurado no SoTasty.</p>
                <p style="color: #666; font-size: 14px;">Contate o suporte: suporte@sotasty.com.br</p>
              </div>
            </body>
          </html>`,
          {
            status: 404,
            headers: {
              'content-type': 'text/html',
            },
          }
        )
      }

      // Rewrite para a rota interna do cardápio público
      const url = request.nextUrl.clone()
      url.pathname = `/p/${settings.id}${pathname}`
      
      console.log('[Proxy] Rewriting to:', url.pathname)
      
      return NextResponse.rewrite(url)
      
    } catch (error) {
      console.error('[Proxy] Erro ao processar domínio customizado:', error)
      return new NextResponse('Erro ao processar domínio customizado', { status: 500 })
    }
  }

  // Lógica original para domínios da aplicação
  console.log('[Proxy] App domain, applying auth logic')

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/auth/login', 
    '/auth/signup',
    '/p/' // Cardápios públicos via /p/[profileId]/[menuSlug]
  ]
  
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  console.log('[Proxy] Is public route?', isPublicRoute, 'for pathname:', pathname)
  
  // Rotas de API e rotas públicas sempre permitem acesso
  if (pathname.startsWith('/api/') || isPublicRoute) {
    console.log('[Proxy] Allowing public route without auth check')
    return await updateSession(request)
  }

  // Verificar se é rota com padrão de custom URL: /[slug]/[menu-slug]
  // Exemplo: /conto/cardapio-natal
  const pathSegments = pathname.split('/').filter(Boolean)
  const isCustomUrlPattern = pathSegments.length === 2 && 
                              !pathSegments[0].startsWith('_') &&
                              !['api', 'auth', 'dashboard', 'p'].includes(pathSegments[0])
  
  console.log('[Proxy] Path segments:', pathSegments, 'Is custom URL pattern?', isCustomUrlPattern)
  
  if (isCustomUrlPattern) {
    console.log('[Proxy] Custom URL pattern detected:', pathname)
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      )

      const [customUrlSlug, menuSlug] = pathSegments
      
      const { data: settings, error } = await supabase
        .from('profile_settings')
        .select('id')
        .eq('custom_url_slug', customUrlSlug)
        .single()

      console.log('[Proxy] Custom URL lookup:', { customUrlSlug, settings, error })

      if (!error && settings) {
        // Rewrite para /p/[profileId]/[menuSlug]
        const url = request.nextUrl.clone()
        url.pathname = `/p/${settings.id}/${menuSlug}`
        
        console.log('[Proxy] Rewriting custom URL to:', url.pathname)
        
        return NextResponse.rewrite(url)
      }
    } catch (error) {
      console.error('[Proxy] Erro ao processar custom URL:', error)
    }
    
    // Se chegou aqui, não encontrou o custom_url_slug, mas ainda é uma rota pública
    // Deixar passar para o Next.js mostrar 404 sem exigir autenticação
    return NextResponse.next()
  }

  // Atualizar sessão do Supabase para rotas protegidas
  const response = await updateSession(request)

  // Para rotas protegidas, verificar autenticação
  try {
    const accessToken = request.cookies.get('sb-shjyjqryrnqicobkrrdq-auth-token')

    // Se não tiver token, redirecionar para login
    if (!accessToken) {
      const redirectUrl = new URL('/auth/login', request.url)
      if (pathname !== '/') {
        redirectUrl.searchParams.set('redirect', pathname)
      }
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error('Middleware error:', error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
