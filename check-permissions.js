const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Ler variáveis de ambiente do .env.local
const envContent = fs.readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function checkPermissions() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, permissions, workspace_id')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro:', error)
    return
  }

  // Buscar emails dos usuários
  const { data: { users } } = await supabase.auth.admin.listUsers()

  data.forEach(profile => {
    const user = users.find(u => u.id === profile.id)
    console.log('\n---')
    console.log('Email:', user?.email || 'N/A')
    console.log('Nome:', profile.full_name)
    console.log('Role:', profile.role)
    console.log('Workspace ID:', profile.workspace_id)
    console.log('Permissions:', JSON.stringify(profile.permissions, null, 2))
  })
}

checkPermissions()
