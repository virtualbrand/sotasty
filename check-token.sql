-- Ver configuração atual
SELECT 
  user_id,
  phone_number_id,
  business_account_id,
  connected,
  LEFT(access_token, 50) || '...' as token_preview,
  LENGTH(access_token) as token_length,
  created_at,
  updated_at
FROM whatsapp_config 
WHERE auth_method = 'official';
