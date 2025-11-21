const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkToken() {
  console.log('🔍 Buscando configuração do WhatsApp...\n');
  
  const { data, error } = await supabase
    .from('whatsapp_config')
    .select('*')
    .eq('auth_method', 'official')
    .single();

  if (error) {
    console.error('❌ Erro ao buscar config:', error.message);
    return;
  }

  if (!data) {
    console.log('⚠️  Nenhuma configuração encontrada');
    return;
  }

  console.log('📋 Configuração encontrada:');
  console.log('User ID:', data.user_id);
  console.log('Phone Number ID:', data.phone_number_id);
  console.log('Business Account ID:', data.business_account_id);
  console.log('Conectado:', data.connected);
  console.log('\n🔑 Access Token (primeiros 50 chars):', data.access_token?.substring(0, 50) + '...');
  console.log('Token completo length:', data.access_token?.length || 0, 'caracteres');
  
  // Validar token com Meta
  console.log('\n🌐 Validando token com Meta API...');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${data.phone_number_id}?access_token=${data.access_token}`
    );
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Token válido!');
      console.log('Resposta da API:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Token inválido!');
      console.log('Erro:', result.error);
    }
  } catch (err) {
    console.error('❌ Erro ao validar:', err.message);
  }
}

checkToken();
