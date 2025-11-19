import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/auth/login', '/auth/signup']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Rotas de API sempre permitem acesso
  if (pathname.startsWith('/api/')) {
    return await updateSession(request)
  }

  // Atualizar sessão do Supabase
  const response = await updateSession(request)

  // Se for rota pública, permitir acesso
  if (isPublicRoute) {
    return response
  }

  // Para rotas protegidas, verificar autenticação
  try {
    const supabaseResponse = response as any
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
