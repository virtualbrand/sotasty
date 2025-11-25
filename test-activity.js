// Script de teste para verificar a tabela activities

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testActivity() {
  console.log('🔍 Testando tabela activities...')
  
  // Tentar buscar atividades
  const { data, error, count } = await supabase
    .from('activities')
    .select('*', { count: 'exact' })
    .limit(10)
  
  if (error) {
    console.error('❌ Erro ao buscar atividades:', error)
    return
  }
  
  console.log('✅ Atividades encontradas:', count)
  console.log('📊 Primeiras 10 atividades:', data)
  
  // Verificar se a tabela existe e se tem a estrutura correta
  if (data && data.length > 0) {
    console.log('📋 Estrutura da primeira atividade:', Object.keys(data[0]))
  }
}

testActivity()
