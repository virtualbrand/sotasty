import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { event_name, properties, page_url } = await request.json()

    // Salvar evento no banco
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: user.id,
        event_name,
        event_properties: properties || {},
        page_url,
        user_agent: request.headers.get('user-agent') || '',
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
      })

    if (error) {
      console.error('Error saving analytics event:', error)
      return NextResponse.json({ error: 'Failed to save event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
