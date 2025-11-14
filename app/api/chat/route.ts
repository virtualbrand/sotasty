import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

// Configuração da API do OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const ASSISTANT_ID = 'asst_qfjnWZdbBt4pXXZ2wo92sfrG'

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { messages, threadId } = await request.json()

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key não configurada.' },
        { status: 500 }
      )
    }

    // Pega a última mensagem do usuário
    const lastUserMessage = messages[messages.length - 1]
    
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Mensagem inválida.' },
        { status: 400 }
      )
    }

    // Busca contextos salvos do usuário
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let additionalContext = ''
    if (user) {
      const { data: contexts } = await supabase
        .from('assistant_contexts')
        .select('name, content')
        .eq('user_id', user.id)
      
      if (contexts && contexts.length > 0) {
        // Formata os contextos de forma que o assistente use mas não cite
        additionalContext = '\n\n---\nCONTEXTO INTERNO (não mencione essas informações diretamente, apenas use-as para responder):\n\n' +
          contexts.map(ctx => ctx.content).join('\n\n') +
          '\n---\n\n'
      }
    }

    // Cria ou usa thread existente
    let thread
    if (threadId) {
      thread = { id: threadId }
    } else {
      thread = await openai.beta.threads.create()
    }

    // Adiciona a mensagem do usuário à thread com contexto adicional no início
    const userMessageContent = additionalContext 
      ? `${additionalContext}${lastUserMessage.content}`
      : lastUserMessage.content

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userMessageContent,
    })

    // Executa o assistente
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    })

    // Aguarda a conclusão da execução
    let runStatus = await openai.beta.threads.runs.retrieve(run.id, {
      thread_id: thread.id,
    })
    
    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        throw new Error(`Run falhou com status: ${runStatus.status}`)
      }
      
      // Aguarda 1 segundo antes de verificar novamente
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(run.id, {
        thread_id: thread.id,
      })
    }

    // Busca as mensagens da thread
    const threadMessages = await openai.beta.threads.messages.list(thread.id)
    
    // Pega a última mensagem do assistente
    const assistantMessages = threadMessages.data.filter((msg) => msg.role === 'assistant')
    const lastAssistantMessage = assistantMessages[0]

    if (!lastAssistantMessage) {
      throw new Error('Nenhuma resposta do assistente')
    }

    // Extrai o conteúdo da mensagem
    const messageContent = lastAssistantMessage.content[0]
    const responseText = messageContent.type === 'text' 
      ? messageContent.text.value 
      : 'Desculpe, não consegui processar a resposta.'

    return NextResponse.json({ 
      message: responseText,
      threadId: thread.id 
    })
  } catch (error) {
    console.error('Erro no chat:', error)
    return NextResponse.json(
      { error: 'Erro ao processar mensagem. Por favor, tente novamente.' },
      { status: 500 }
    )
  }
}
