import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ActivityFinancial } from '@/lib/activityLogger'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const accountId = searchParams.get('accountId')
    const categoryId = searchParams.get('categoryId')

    let query = supabase
      .from('financial_transactions')
      .select(`
        *,
        account:financial_accounts(id, name, type),
        category:financial_categories(id, name, color, icon)
      `)
      .eq('workspace_id', profile.workspace_id)
      .order('date', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (accountId) {
      query = query.eq('account_id', accountId)
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Error in GET /api/financeiro/transactions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      type,
      description,
      amount,
      date,
      accountId,
      categoryId,
      isPaid,
      observation,
      tags,
      recurrenceType,
      installments,
      installmentPeriod,
    } = body

    // Validate required fields
    if (!type || !description || !amount || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Handle non-recurring transaction
    if (!recurrenceType) {
      const { data: transaction, error } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: user.id,
          workspace_id: profile.workspace_id,
          type,
          description,
          amount: parseFloat(amount),
          date,
          account_id: accountId || null,
          category_id: categoryId || null,
          is_paid: isPaid,
          observation,
          tags,
          is_recurring: false,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating transaction:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Registrar atividade
      ActivityFinancial.transactionCreated(type, parseFloat(amount), description, transaction.id)
        .catch(err => console.error('❌ Erro ao registrar atividade:', err))

      return NextResponse.json({ transaction })
    }

    // Handle recurring transaction (fixa)
    if (recurrenceType === 'fixa') {
      const { data: transaction, error } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: user.id,
          workspace_id: profile.workspace_id,
          type,
          description,
          amount: parseFloat(amount),
          date,
          account_id: accountId || null,
          category_id: categoryId || null,
          is_paid: isPaid,
          observation,
          tags,
          is_recurring: true,
          recurrence_type: 'fixa',
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating recurring transaction:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ transaction })
    }

    // Handle installment transaction (parcelada)
    if (recurrenceType === 'parcelada' && installments) {
      const numInstallments = parseInt(installments)
      const installmentAmount = parseFloat(amount) / numInstallments
      
      // Create parent transaction
      const { data: parentTransaction, error: parentError } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: user.id,
          workspace_id: profile.workspace_id,
          type,
          description: `${description} (Parcelado)`,
          amount: parseFloat(amount),
          date,
          account_id: accountId || null,
          category_id: categoryId || null,
          is_paid: false,
          observation,
          tags,
          is_recurring: true,
          recurrence_type: 'parcelada',
          total_installments: numInstallments,
          installment_period: installmentPeriod,
        })
        .select()
        .single()

      if (parentError) {
        console.error('Error creating parent transaction:', parentError)
        return NextResponse.json({ error: parentError.message }, { status: 500 })
      }

      // Create installment transactions
      const installmentTransactions = []
      const baseDate = new Date(date)

      for (let i = 0; i < numInstallments; i++) {
        const installmentDate = new Date(baseDate)
        
        if (installmentPeriod === 'Meses') {
          installmentDate.setMonth(baseDate.getMonth() + i)
        } else {
          installmentDate.setDate(baseDate.getDate() + (i * 7))
        }

        installmentTransactions.push({
          user_id: user.id,
          workspace_id: profile.workspace_id,
          type,
          description: `${description} (${i + 1}/${numInstallments})`,
          amount: installmentAmount,
          date: installmentDate.toISOString().split('T')[0],
          account_id: accountId || null,
          category_id: categoryId || null,
          is_paid: i === 0 ? isPaid : false,
          observation,
          tags,
          is_recurring: true,
          recurrence_type: 'parcelada',
          parent_transaction_id: parentTransaction.id,
          installment_number: i + 1,
          total_installments: numInstallments,
          installment_period: installmentPeriod,
        })
      }

      const { data: createdInstallments, error: installmentsError } = await supabase
        .from('financial_transactions')
        .insert(installmentTransactions)
        .select()

      if (installmentsError) {
        console.error('Error creating installments:', installmentsError)
        return NextResponse.json({ error: installmentsError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        parentTransaction,
        installments: createdInstallments 
      })
    }

    return NextResponse.json({ error: 'Invalid recurrence type' }, { status: 400 })
  } catch (error) {
    console.error('Error in POST /api/financeiro/transactions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating transaction:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar atividade
    ActivityFinancial.transactionUpdated(transaction.type, transaction.amount, transaction.description, transaction.id)
      .catch(err => console.error('❌ Erro ao registrar atividade:', err))

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error in PUT /api/financeiro/transactions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    // Buscar dados da transação antes de deletar
    const { data: transaction } = await supabase
      .from('financial_transactions')
      .select('type, description, amount')
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .single()

    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)

    if (error) {
      console.error('Error deleting transaction:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar atividade
    if (transaction) {
      ActivityFinancial.transactionDeleted(transaction.type, transaction.amount, transaction.description, id)
        .catch(err => console.error('❌ Erro ao registrar atividade:', err))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/financeiro/transactions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
