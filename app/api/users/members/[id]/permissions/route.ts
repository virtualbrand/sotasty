import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    
    const supabase = await createClient()
    
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


    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
    }

    // Se não tem workspace_id, usa o próprio ID do usuário como workspace
    const workspaceId = profile.workspace_id || user.id

    const { permissions } = body
    const { id: memberId } = await params


    // Verificar se o membro pertence ao workspace
    const { data: memberProfile } = await supabase
      .from('profiles')
      .select('workspace_id, role')
      .eq('id', memberId)
      .single()


    if (!memberProfile) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    // Comparar workspaces - se ambos tiverem o mesmo workspace_id ou se o membro pertence ao workspace do admin
    const memberWorkspaceId = memberProfile.workspace_id
    if (memberWorkspaceId && memberWorkspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    // Não permitir alterar permissões de admin
    if (memberProfile.role === 'admin' || memberProfile.role === 'superadmin') {
      return NextResponse.json({ error: 'Não é possível alterar permissões de administradores' }, { status: 403 })
    }


    // Atualizar permissões usando admin client para bypassar RLS
    const supabaseAdmin = createAdminClient()
    const { data: updateResult, error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        permissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()


    if (error) {
      console.error('Erro no update:', error)
      throw error
    }

    // Invalidar todas as sessões do usuário
    try {
      // O método correto para invalidar sessões no Supabase é usando deleteUser com shouldSoftDelete
      // Mas isso removeria o usuário. Vamos usar outra abordagem:
      // Atualizar o user metadata para forçar um refresh
      await supabaseAdmin.auth.admin.updateUserById(memberId, {
        user_metadata: {
          permissions_updated_at: new Date().toISOString()
        }
      })
      console.log(`✅ Metadata de permissões atualizado para usuário ${memberId}`)
    } catch (updateError) {
      console.warn('⚠️ Aviso: Não foi possível atualizar metadata do usuário:', updateError)
    }


    return NextResponse.json({ 
      success: true,
      message: 'Permissões atualizadas. O usuário precisará fazer login novamente para ver as alterações.'
    })
  } catch (error) {
    console.error('❌ Erro ao atualizar permissões:', error)
    return NextResponse.json({ error: 'Erro ao atualizar permissões' }, { status: 500 })
  }
}
