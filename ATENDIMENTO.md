# Atendimento - Chat com Assistente GPT

Este documento explica como funciona o módulo de Atendimento integrado com o OpenAI Assistant.

## 🤖 Sobre o Assistente

O módulo de Atendimento utiliza o OpenAI Assistant API para fornecer suporte automatizado aos usuários da plataforma SoTasty. O assistente está configurado para:

- Responder perguntas sobre funcionalidades da plataforma
- Ajudar na gestão de produtos, pedidos e clientes
- Fornecer orientações sobre o uso do sistema
- Manter conversas contextualizadas através de threads

## 📁 Arquivos Criados

1. **`/app/(dashboard)/atendimento/page.tsx`**
   - Interface de chat com design moderno
   - Gerenciamento de mensagens e threads
   - Auto-scroll e indicadores de status

2. **`/app/api/chat/route.ts`**
   - API route para integração com OpenAI
   - Gerenciamento de threads e execução do assistente
   - Tratamento de erros e respostas

3. **`/components/Sidebar.tsx`** (atualizado)
   - Novo item de menu "Atendimento"
   - Ícone MessageCircle
   - Posicionado entre "Clientes" e "Performance"

## 🔑 Configuração

### Assistant ID
```
asst_qfjnWZdbBt4pXXZ2wo92sfrG
```

### Variável de Ambiente
A chave da API já está configurada em `.env.local`:
```bash
OPENAI_API_KEY=sua-chave-aqui
```

## 🚀 Como Usar

1. **Acesse o menu Atendimento** na sidebar
2. **Digite sua mensagem** no campo de input
3. **Clique em Enviar** ou pressione Enter
4. **Aguarde a resposta** do assistente

## 💡 Funcionalidades

- ✅ Conversas contextualizadas (mantém histórico na thread)
- ✅ Interface responsiva e moderna
- ✅ Indicador de "digitando..."
- ✅ Timestamps nas mensagens
- ✅ Auto-scroll para novas mensagens
- ✅ Tratamento de erros

## 🔧 Tecnologias

- **Next.js 16** - Framework React
- **OpenAI SDK 6.9.0** - Integração com GPT
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização

## 📝 Notas

- Cada conversa mantém uma thread única para contexto
- As threads são criadas automaticamente na primeira mensagem
- O assistente usa o modelo configurado no OpenAI Dashboard
- Todas as mensagens são processadas via API route segura

## 🎨 Design

O design segue o padrão da SoTasty com:
- Cores gradiente (Old Rose → Melon)
- Bordas arredondadas (rounded-2xl)
- Sombras suaves
- Layout limpo e intuitivo
