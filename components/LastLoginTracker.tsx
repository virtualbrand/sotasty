'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LastLoginTracker() {
  useEffect(() => {
    const updateLastLogin = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Atualizar last_login tocando no perfil (trigger fará o resto)
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id)
      }
    }

    updateLastLogin()

    // Atualizar a cada 5 minutos se o usuário ainda estiver ativo
    const interval = setInterval(updateLastLogin, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return null
}
