import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/analytics/metrics - Para o dashboard do SuperAdmin
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verificar se é superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // dias

    // DAU (Daily Active Users) - últimos 7 dias
    const { data: dauData } = await supabase
      .from('analytics_events')
      .select('user_id, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const dauByDay = dauData?.reduce((acc: Record<string, Set<string>>, event) => {
      const day = new Date(event.created_at).toISOString().split('T')[0]
      if (!acc[day]) acc[day] = new Set()
      acc[day].add(event.user_id)
      return acc
    }, {})

    const dau = dauByDay ? Math.round(
      Object.values(dauByDay).reduce((sum, users) => sum + users.size, 0) / 
      Object.keys(dauByDay).length
    ) : 0

    // MAU (Monthly Active Users)
    const { data: mauData } = await supabase
      .from('analytics_events')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const uniqueMAU = new Set(mauData?.map(e => e.user_id) || [])
    const mau = uniqueMAU.size

    // Top Features (últimos 30 dias)
    const { data: featureData } = await supabase
      .from('feature_usage')
      .select('feature_name, usage_count')
      .order('usage_count', { ascending: false })
      .limit(10)

    // Tempo médio de sessão
    const { data: sessionData } = await supabase
      .from('user_sessions')
      .select('duration_seconds')
      .gte('created_at', new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString())
      .not('duration_seconds', 'is', null)

    const avgSessionDuration = sessionData && sessionData.length > 0
      ? sessionData.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessionData.length
      : 0

    // Eventos mais comuns
    const { data: topEvents } = await supabase
      .from('analytics_events')
      .select('event_name')
      .gte('created_at', new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString())

    const eventCounts = topEvents?.reduce((acc: Record<string, number>, event) => {
      acc[event.event_name] = (acc[event.event_name] || 0) + 1
      return acc
    }, {})

    const topEventsList = eventCounts 
      ? Object.entries(eventCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }))
      : []

    return NextResponse.json({
      dau,
      mau,
      stickiness: mau > 0 ? ((dau / mau) * 100).toFixed(1) : 0,
      topFeatures: featureData || [],
      avgSessionDuration: Math.round(avgSessionDuration),
      topEvents: topEventsList,
    })
  } catch (error) {
    console.error('Analytics metrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
