'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, trackPageView } from '@/lib/analytics/posthog'
import { createClient } from '@/lib/supabase/client'
import { identifyUser } from '@/lib/analytics/posthog'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track page views
    if (pathname) {
      trackPageView(pathname, {
        url: `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`,
      })
    }
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Inicializar PostHog
    initPostHog()

    // Identificar usuário se estiver logado
    const identifyCurrentUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, subscription_plan, subscription_status')
          .eq('id', user.id)
          .single()

        identifyUser(user.id, {
          email: user.email,
          role: profile?.role,
          plan: profile?.subscription_plan,
          status: profile?.subscription_status,
        })
      }
    }

    identifyCurrentUser()
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  )
}
