import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const { id } = await params
    const body = await request.json()
    const { is_paid } = body

    // Verify transaction belongs to workspace
    const { data: transaction, error: fetchError } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .single()

    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Update transaction
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('financial_transactions')
      .update({ is_paid })
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ transaction: updatedTransaction })
  } catch (error) {
    console.error('Error in PATCH /api/financeiro/transactions/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
