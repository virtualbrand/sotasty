# Base de Conhecimento - Guia de Configuração

## 📚 Sobre a Base de Conhecimento

A Base de Conhecimento permite que o assistente de atendimento responda perguntas usando documentos específicos da sua empresa. Você pode adicionar:

- Manuais de produtos
- FAQs
- Políticas da empresa
- Catálogos
- Documentação técnica
- E qualquer outro documento relevante

## 🔧 Como Configurar

### Opção 1: Via CakeCloud (Interface Web)

1. Acesse **Configurações > Atendimento**
2. Clique em "Clique para selecionar arquivos" ou arraste os arquivos
3. Aguarde o upload e processamento
4. Os arquivos estarão disponíveis imediatamente para o assistente

**Formatos suportados:**
- PDF (.pdf)
- Word (.doc, .docx)
- Texto (.txt, .md)
- Planilhas (.csv, .xlsx, .xls)

**Tamanho máximo:** 20MB por arquivo

### Opção 2: Via OpenAI Dashboard (Recomendado para grandes volumes)

Para adicionar arquivos diretamente no Vector Store do seu assistente:

1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Vá em **Assistants** no menu lateral
3. Clique no seu assistente: `asst_qfjnWZdbBt4pXXZ2wo92sfrG`
4. Role até a seção **Files**
5. Clique em **Add files** ou crie um novo **Vector Store**
6. Faça upload dos documentos
7. Os arquivos serão automaticamente processados e indexados

**Vantagens desta opção:**
- ✅ Upload de múltiplos arquivos de uma vez
- ✅ Melhor controle sobre o processamento
- ✅ Visualização do status de indexação
- ✅ Gerenciamento avançado de vector stores

## 🎯 Boas Práticas

### Organize seus documentos

1. **Use nomes descritivos**
   - ✅ `manual_produto_bolos_caseiros.pdf`
   - ❌ `doc1.pdf`

2. **Mantenha arquivos atualizados**
   - Remove documentos obsoletos
   - Substitua versões antigas

3. **Divida informações complexas**
   - Em vez de um PDF de 100 páginas, divida em tópicos
   - Ex: `faq_pedidos.pdf`, `faq_pagamentos.pdf`, etc.

### Otimize o conteúdo

- **Texto estruturado**: Use títulos, subtítulos e listas
- **Informação clara**: Seja direto e objetivo
- **Contexto**: Inclua contexto necessário em cada documento
- **Formato**: PDFs com texto pesquisável são melhores que imagens

## 🔄 Como o Assistente Usa os Arquivos

1. Quando um usuário faz uma pergunta no chat
2. O assistente busca informações relevantes nos documentos
3. Combina o conhecimento dos arquivos com suas instruções
4. Fornece uma resposta contextualizada e precisa

## 💡 Exemplos de Uso

### Exemplo 1: FAQ de Produtos
Upload de `faq_produtos.pdf` permite ao assistente responder:
- "Quais os sabores de bolo disponíveis?"
- "Qual o prazo de validade dos produtos?"
- "Como armazenar os doces?"

### Exemplo 2: Políticas da Empresa
Upload de `politica_cancelamento.pdf` permite responder:
- "Como faço para cancelar um pedido?"
- "Qual o prazo para solicitar reembolso?"
- "Existe taxa de cancelamento?"

### Exemplo 3: Catálogo de Produtos
Upload de `catalogo_2025.pdf` permite responder:
- "Quais os preços dos bolos?"
- "Vocês fazem bolos personalizados?"
- "Qual o peso médio de cada bolo?"

## 🛠️ Gerenciamento via API

Os arquivos também podem ser gerenciados programaticamente via API:

### Listar arquivos
```bash
GET /api/knowledge-base
```

### Upload de arquivo
```bash
POST /api/knowledge-base/upload
Content-Type: multipart/form-data
```

### Deletar arquivo
```bash
DELETE /api/knowledge-base/{fileId}
```

## 📊 Monitoramento

- Verifique regularmente se os arquivos estão atualizados
- Teste o assistente com perguntas comuns
- Adicione novos documentos conforme surgem novas informações
- Remova documentos obsoletos

## 🔒 Segurança

- ⚠️ Não faça upload de informações confidenciais sensíveis
- ⚠️ Evite dados pessoais de clientes nos documentos
- ✅ Use apenas informações públicas ou internas autorizadas
- ✅ Revise o conteúdo antes do upload

## 📝 Notas Técnicas

- Os arquivos são armazenados no OpenAI Files Storage
- O processamento pode levar alguns minutos para arquivos grandes
- O assistente usa embeddings para busca semântica
- A precisão melhora com documentos bem estruturados

## 🆘 Solução de Problemas

### O assistente não está usando os arquivos
1. Verifique se o arquivo foi processado completamente
2. Confirme que o assistente tem a ferramenta `file_search` habilitada
3. Teste com perguntas específicas que você sabe que estão no documento

### Erro no upload
1. Verifique o tamanho do arquivo (máx 20MB)
2. Confirme o formato do arquivo
3. Tente converter para PDF se for outro formato

### Respostas imprecisas
1. Melhore a estrutura do documento original
2. Adicione mais contexto nos documentos
3. Divida documentos muito longos em partes menores
