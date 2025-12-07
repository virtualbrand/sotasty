import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_INSTRUCTIONS = `Você é um assistente de atendimento ao cliente especializado em vendas e relacionamento.

**Seu objetivo principal:**
Ajudar clientes a fazer pedidos, tirar dúvidas sobre produtos, e proporcionar uma experiência de atendimento excepcional.

**Diretrizes de atendimento:**

1. **Seja cordial e empático:** Sempre cumprimente o cliente e mostre interesse genuíno em ajudá-lo.

2. **Conheça os produtos:** Use a base de conhecimento para responder sobre itens do cardápio, ingredientes, preços, e disponibilidade.

3. **Facilite pedidos:** Ajude o cliente a montar seu pedido, sugira complementos, e confirme todos os detalhes antes de finalizar.

4. **Resolva dúvidas:** Responda perguntas sobre horário de funcionamento, formas de pagamento, entrega, e políticas da loja.

5. **Seja proativo:** Ofereça sugestões baseadas nas preferências do cliente e no histórico de pedidos quando disponível.

6. **Mantenha o tom profissional mas amigável:** Use uma linguagem natural e acessível, evitando jargões técnicos.

7. **Confirme informações importantes:** Sempre repita endereço de entrega, forma de pagamento, e detalhes do pedido antes de finalizar.

8. **Saiba quando escalar:** Se não souber responder algo, informe que vai verificar com a equipe.

**Formato de respostas:**
- Seja conciso mas completo
- Use bullets quando listar opções
- Sempre termine perguntando se há algo mais em que possa ajudar

Lembre-se: Cada interação é uma oportunidade de encantar o cliente e garantir que ele volte!`

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key não configurada.' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

    // Pega a última mensagem do usuário
    const lastUserMessage = messages[messages.length - 1]
    
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Mensagem inválida.' },
        { status: 400 }
      )
    }

    // Busca o vector store do cliente e contextos salvos
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado.' },
        { status: 401 }
      )
    }

    // Busca o vector store ID do cliente
    const { data: profile } = await supabase
      .from('profiles')
      .select('openai_vector_store_id')
      .eq('id', user.id)
      .single()

    let knowledgeBase = ''
    
    // Se tem Vector Store, busca informações relevantes usando file_search
    if (profile?.openai_vector_store_id) {
      try {
        console.log('Buscando conhecimento no Vector Store:', profile.openai_vector_store_id)
        
        // Cria um thread temporário para usar file_search
        const thread = await openai.beta.threads.create({
          messages: [
            {
              role: 'user',
              content: lastUserMessage.content
            }
          ]
        })
        
        // Cria um assistente temporário só para essa busca (será deletado depois)
        const tempAssistant = await openai.beta.assistants.create({
          name: 'Search Assistant',
          model: 'gpt-4o',
          tools: [{ type: 'file_search' }],
          tool_resources: {
            file_search: {
              vector_store_ids: [profile.openai_vector_store_id]
            }
          }
        })
        
        // Executa a busca
        const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
          assistant_id: tempAssistant.id
        })
        
        // Pega os resultados da busca
        if (run.status === 'completed') {
          const threadMessages = await openai.beta.threads.messages.list(thread.id)
          const lastMessage = threadMessages.data[0]
          
          if (lastMessage?.content[0]?.type === 'text') {
            const textContent = lastMessage.content[0].text
            
            // Extrai as citações/anotações (resultados da busca)
            if (textContent.annotations && textContent.annotations.length > 0) {
              knowledgeBase = '\n\n**Informações da Base de Conhecimento:**\n\n'
              
              // Adiciona o conteúdo encontrado
              knowledgeBase += textContent.value
              
              console.log('Conhecimento encontrado:', textContent.value.substring(0, 200))
            }
          }
        }
        
        // Limpa recursos temporários
        await openai.beta.assistants.delete(tempAssistant.id)
        await openai.beta.threads.delete(thread.id)
        
      } catch (error) {
        console.error('Erro ao buscar no Vector Store:', error)
        // Continua sem a base de conhecimento
      }
    }
    
    // Busca contextos pequenos salvos
    const { data: contexts } = await supabase
      .from('assistant_contexts')
      .select('name, content')
      .eq('user_id', user.id)
    
    if (contexts && contexts.length > 0) {
      const smallContexts = contexts.filter(ctx => ctx.content.length <= 100)
      
      if (smallContexts.length > 0) {
        knowledgeBase += '\n\n**Informações Adicionais:**\n' +
          smallContexts.map(ctx => `- ${ctx.content}`).join('\n')
      }
    }

    // Prepara as mensagens para o chat
    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_INSTRUCTIONS + knowledgeBase
      },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ]

    // Chama a API de Chat Completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const assistantMessage = completion.choices[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'Não foi possível gerar resposta.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: assistantMessage,
      usage: completion.usage
    })

  } catch (error: unknown) {
    console.error('Erro no chat:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar mensagem' },
      { status: 500 }
    )
  }
}
