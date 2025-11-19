# 📱 Mensagens - Integração WhatsApp com Evolution API

## 📖 Visão Geral

A feature **Mensagens** integra o SoTasty com WhatsApp através da **Evolution API**, permitindo:
- ✅ Enviar e receber mensagens
- ✅ Visualizar conversas em tempo real
- ✅ Gerenciar contatos
- ✅ Status de leitura das mensagens
- ✅ Interface moderna tipo chat

## 🔧 Configuração

### 1. Variáveis de Ambiente

As variáveis já foram adicionadas no arquivo `.env.local`:

```bash
# Evolution API Configuration
EVOLUTION_API_URL=https://evolution-api-production-be53.up.railway.app
EVOLUTION_API_KEY=q4azKeOl2MR7VzDOsxInZrZdu49zZzIcKVBwStnHyWg=
EVOLUTION_INSTANCE=sotasty-whatsapp
```

### 2. Conectar WhatsApp

1. **Acesse Configurações > WhatsApp** no menu
2. **Clique em "Criar Instância e Gerar QR Code"**
3. **Escaneie o QR Code** com seu WhatsApp:
   - Abra o WhatsApp no celular
   - Vá em **Configurações** → **Dispositivos conectados**
   - Toque em **Conectar dispositivo**
   - Aponte para o QR Code na tela
4. **Aguarde a conexão** - o status mudará para "Conectado"
5. **Acesse Mensagens** no menu principal para começar a usar

### 3. Instância Automática

A instância do WhatsApp é criada automaticamente ao:
- Gerar o QR Code pela primeira vez
- A instância fica salva com o nome configurado
- Não precisa criar manualmente na Evolution API

## 🚀 Funcionalidades

### Interface de Chat

- **Lista de Contatos**: Visualize todos os contatos com últimas mensagens
- **Busca**: Procure contatos por nome ou telefone
- **Status Online**: Indicador visual de status de conexão
- **Mensagens não lidas**: Badge com contador
- **Chat em tempo real**: Interface fluida tipo WhatsApp

### Envio de Mensagens

- Mensagens de texto
- Status de entrega (enviado, entregue, lido)
- Timestamp em todas as mensagens
- Auto-scroll para última mensagem

### Gestão de Contatos

- Avatares personalizados
- Informações de contato
- Histórico completo de conversas
- Filtros e busca

## 📡 Endpoints da API

### GET `/api/whatsapp/status`
Verifica status de conexão com WhatsApp

**Response:**
```json
{
  "connected": true,
  "instance": "nome-instancia",
  "state": "open"
}
```

### GET `/api/whatsapp/contacts`
Lista todos os contatos

**Response:**
```json
[
  {
    "id": "5511999999999@s.whatsapp.net",
    "name": "João Silva",
    "phone": "5511999999999",
    "avatar": "https://...",
    "lastMessage": "Olá!",
    "lastMessageTime": "14:30",
    "unreadCount": 2,
    "isOnline": false
  }
]
```

### GET `/api/whatsapp/messages?contactId={id}`
Busca mensagens de um contato específico

**Query Params:**
- `contactId`: ID do contato (formato: 5511999999999@s.whatsapp.net)

**Response:**
```json
[
  {
    "id": "ABC123",
    "content": "Olá, tudo bem?",
    "timestamp": "2025-11-14T14:30:00.000Z",
    "fromMe": false,
    "status": "read"
  }
]
```

### POST `/api/whatsapp/send`
Envia mensagem para um contato

**Body:**
```json
{
  "to": "5511999999999",
  "message": "Olá! Como posso ajudar?"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "ABC123",
  "data": {...}
}
```

## 🎨 Design

### Cores e Tema
- Usa o tema padrão SoTasty (Old Rose, Melon, Lavender Blush)
- Interface responsiva
- Ícones Lucide React
- Tailwind CSS

### Layout
- **Coluna Esquerda (4/12)**: Lista de contatos
- **Coluna Direita (8/12)**: Área de chat
- **Header fixo**: Informações do contato selecionado
- **Footer fixo**: Input para nova mensagem

## 🔐 Segurança

- ✅ API Keys em variáveis de ambiente
- ✅ Validação de parâmetros
- ✅ Tratamento de erros
- ✅ Sem exposição de credenciais no frontend

## 📱 Recursos Futuros

- [ ] Envio de imagens e documentos
- [ ] Áudio e vídeo
- [ ] Mensagens em grupo
- [ ] Agendamento de mensagens
- [ ] Respostas automáticas
- [ ] Templates de mensagem
- [ ] Integração com CRM
- [ ] Relatórios e analytics

## 🐛 Troubleshooting

### Problema: "Desconectado"
**Solução**: Verifique se:
1. As variáveis de ambiente estão corretas
2. A instância Evolution está ativa
3. O WhatsApp está conectado na instância

### Problema: "Contatos não aparecem"
**Solução**:
1. Verifique a conexão com Evolution API
2. Confirme que há conversas no WhatsApp
3. Verifique os logs do console para erros

### Problema: "Mensagens não enviam"
**Solução**:
1. Verifique o formato do número (deve incluir código do país)
2. Confirme que o WhatsApp está conectado
3. Verifique os limites da API Evolution

## 📚 Documentação Evolution API

Para mais informações sobre a Evolution API:
- [Documentação Oficial](https://doc.evolution-api.com/)
- [Endpoints disponíveis](https://doc.evolution-api.com/api-reference)
- [Webhooks e eventos](https://doc.evolution-api.com/webhooks)

## ⚙️ Páginas Criadas

### Interface Principal
- **Mensagens** (`/mensagens`) - Chat completo com lista de contatos e conversas

### Configuração
- **Settings > WhatsApp** (`/settings/whatsapp`) - Página para conectar WhatsApp via QR Code

### API Endpoints
- `POST /api/whatsapp/instance/create` - Cria instância
- `GET /api/whatsapp/instance/qrcode` - Busca QR Code
- `POST /api/whatsapp/instance/disconnect` - Desconecta WhatsApp
- `GET /api/whatsapp/status` - Verifica status de conexão
- `GET /api/whatsapp/contacts` - Lista contatos
- `GET /api/whatsapp/messages` - Busca mensagens
- `POST /api/whatsapp/send` - Envia mensagem

## 🎯 Casos de Uso

1. **Atendimento ao Cliente**: Responda clientes diretamente pela plataforma
2. **Confirmação de Pedidos**: Envie confirmações automáticas
3. **Lembretes**: Notifique clientes sobre entregas
4. **Promoções**: Divulgue ofertas especiais
5. **Suporte**: Centralize comunicação com clientes

---

**Desenvolvido para SoTasty** 🍽️
Integração WhatsApp através de Evolution API
