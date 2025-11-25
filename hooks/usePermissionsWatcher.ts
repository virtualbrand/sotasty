'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Hook que monitora mudanças nas permissões do usuário em tempo real
 * Força logout quando as permissões são alteradas por um admin
 */
export function usePermissionsWatcher(userId: string | undefined) {
  const router = useRouter()

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Subscrever mudanças na tabela profiles
    const channel = supabase
      .channel(`profile-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        async (payload) => {
          console.log('🔄 Permissões atualizadas detectadas:', payload)
          
          // Verificar se foi uma atualização de permissões
          if (payload.new.permissions !== payload.old?.permissions || 
              payload.new.updated_at !== payload.old?.updated_at) {
            
            console.log('🧹 Limpando cache de permissões...')
            
            // Limpar cache do localStorage
            if (typeof window !== 'undefined') {
              localStorage.removeItem('user_permissions_cache')
            }
            
            // Fazer logout
            await supabase.auth.signOut()
            
            // Redirecionar para login
            router.push('/auth/login?message=Suas permissões foram atualizadas. Por favor, faça login novamente.')
          }
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, router])
}
