import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import dns from 'dns'
import { promisify } from 'util'

const resolveCname = promisify(dns.resolveCname)
const resolve4 = promisify(dns.resolve4)

// CNAME esperado para apontar para sotasty.com.br
const EXPECTED_CNAME = 'cname.sotasty.com.br'

// IPs do Cloudflare (quando proxy está ativo)
const CLOUDFLARE_IPS = [
  '172.64.', '172.65.', '172.66.', '172.67.', '172.68.', '172.69.', '172.70.', '172.71.',
  '104.16.', '104.17.', '104.18.', '104.19.', '104.20.', '104.21.', '104.22.', '104.23.',
  '104.24.', '104.25.', '104.26.', '104.27.', '104.28.', '104.29.', '104.30.', '104.31.'
]

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json(
        { error: 'Domínio é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato do domínio
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Formato de domínio inválido' },
        { status: 400 }
      )
    }

    let verified = false
    let verificationMethod = ''

    // Primeiro tentar verificar via CNAME (quando proxy está OFF)
    try {
      const cnameRecords = await resolveCname(domain)
      if (cnameRecords.some(record => record.toLowerCase() === EXPECTED_CNAME.toLowerCase())) {
        verified = true
        verificationMethod = 'CNAME'
      }
    } catch (error) {
      
      // Se CNAME falhar, tentar A record (quando Cloudflare proxy está ON)
      try {
        const aRecords = await resolve4(domain)
        
        // Verificar se algum IP é do Cloudflare
        const isCloudflare = aRecords.some(ip => 
          CLOUDFLARE_IPS.some(prefix => ip.startsWith(prefix))
        )
        
        if (isCloudflare) {
          verified = true
          verificationMethod = 'A (Cloudflare Proxy)'
        }
      } catch (aError) {
      }
    }

    if (!verified) {
      
      // Tentar mostrar o que foi encontrado para debug
      try {
        const debugRecords = await resolve4(domain)
        return NextResponse.json(
          { 
            verified: false,
            error: 'Domínio não está apontando corretamente',
            details: `Configure um registro CNAME apontando para ${EXPECTED_CNAME}. IPs encontrados: ${debugRecords.join(', ')}. Verifique se o DNS propagou (pode levar até 48h, geralmente 5-15 minutos).`
          },
          { status: 400 }
        )
      } catch {
        return NextResponse.json(
          { 
            verified: false,
            error: 'Domínio não encontrado',
            details: `Configure um registro CNAME apontando para ${EXPECTED_CNAME}. Verifique se o DNS propagou (pode levar até 48h, geralmente 5-15 minutos).`
          },
          { status: 400 }
        )
      }
    }


    // Buscar configurações do perfil
    const { data: settings, error: settingsError } = await supabase
      .from('profile_settings')
      .select('id, custom_domain')
      .eq('user_id', user.id)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching profile settings:', settingsError)
      return NextResponse.json(
        { error: 'Erro ao buscar configurações' },
        { status: 500 }
      )
    }

    // Verificar se outro usuário já está usando este domínio
    if (settings?.custom_domain !== domain) {
      const { data: existingDomain } = await supabase
        .from('profile_settings')
        .select('id')
        .eq('custom_domain', domain)
        .neq('user_id', user.id)
        .single()

      if (existingDomain) {
        return NextResponse.json(
          { error: 'Este domínio já está sendo usado por outro usuário' },
          { status: 409 }
        )
      }
    }

    // Atualizar ou inserir configurações com domínio verificado
    const { error: updateError } = await supabase
      .from('profile_settings')
      .upsert({
        user_id: user.id,
        custom_domain: domain,
        custom_domain_verified: true,
        custom_domain_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (updateError) {
      console.error('Error updating profile settings:', updateError)
      return NextResponse.json(
        { error: 'Erro ao salvar domínio verificado' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      verified: true,
      method: verificationMethod,
      domain,
      message: 'Domínio verificado com sucesso!'
    })

  } catch (error) {
    console.error('Error verifying domain:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar domínio' },
      { status: 500 }
    )
  }
}
