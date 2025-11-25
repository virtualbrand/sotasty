import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id, role')
      .eq('id', user.id)
      .single()


    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Se não tem workspace_id, usa o próprio ID do usuário
    const workspaceId = profile.workspace_id || user.id

    // Buscar membros do workspace
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, created_at, permissions')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })


    if (error) throw error

    // Buscar emails dos membros usando admin client
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    
    const membersWithEmail = members?.map(member => {
      const authUser = users?.find(u => u.id === member.id)
      return {
        ...member,
        email: authUser?.email || ''
      }
    })

    return NextResponse.json(membersWithEmail || [])
  } catch (error) {
    console.error('Erro ao buscar membros:', error)
    return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('id')

    if (!memberId) {
      return NextResponse.json({ error: 'ID do membro é obrigatório' }, { status: 400 })
    }

    // Verificar permissão
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
    }

    // Não permitir remover a si mesmo
    if (memberId === user.id) {
      return NextResponse.json({ error: 'Você não pode remover a si mesmo' }, { status: 400 })
    }

    // Verificar se o membro pertence ao workspace
    const { data: memberProfile } = await supabase
      .from('profiles')
      .select('workspace_id, role')
      .eq('id', memberId)
      .single()

    if (!memberProfile || memberProfile.workspace_id !== profile.workspace_id) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    // Não permitir remover outro admin (apenas superadmin pode)
    if (memberProfile.role === 'admin' && profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Você não pode remover um administrador' }, { status: 403 })
    }

    // Remover o perfil (isso também removerá o usuário do auth devido ao CASCADE)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', memberId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover membro:', error)
    return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 })
  }
}
