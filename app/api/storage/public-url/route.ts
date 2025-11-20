import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const path = searchParams.get('path')

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Bucket e path são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return NextResponse.json({ publicUrl })
  } catch (error) {
    console.error('Erro ao buscar URL pública:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar URL pública' },
      { status: 500 }
    )
  }
}
