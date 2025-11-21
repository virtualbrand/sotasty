-- Verificar mensagens salvas
SELECT 
  id,
  contact_phone,
  content,
  from_me,
  status,
  timestamp,
  created_at
FROM whatsapp_messages 
ORDER BY timestamp DESC 
LIMIT 10;
