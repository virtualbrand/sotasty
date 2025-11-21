'use client'

import { useState, useMemo } from 'react'
import { 
  Search,
  LayoutDashboard,
  Tags,
  BookText,
  ShoppingCart,
  DollarSign,
  MessageSquare,
  MessageCircle,
  Users,
  Calendar,
  Settings,
  ChevronRight,
  BookOpen,
  Package,
  Wallet,
  Phone,
  Mail,
  UserPlus
} from 'lucide-react'

// Definir os tópicos de ajuda organizados por features
const helpTopics = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    topics: [
      { id: 'dashboard-overview', title: 'Visão Geral do Dashboard', slug: 'dashboard-overview' },
      { id: 'dashboard-widgets', title: 'Widgets e Estatísticas', slug: 'dashboard-widgets' },
      { id: 'dashboard-customization', title: 'Personalização', slug: 'dashboard-customization' }
    ]
  },
  {
    id: 'products',
    title: 'Produtos',
    icon: Tags,
    topics: [
      { id: 'products-add', title: 'Adicionar Novos Produtos', slug: 'products-add' },
      { id: 'products-categories', title: 'Categorias e Subcategorias', slug: 'products-categories' },
      { id: 'products-recipes', title: 'Receitas Base', slug: 'products-recipes' },
      { id: 'products-ingredients', title: 'Gerenciar Ingredientes', slug: 'products-ingredients' },
      { id: 'products-pricing', title: 'Precificação', slug: 'products-pricing' }
    ]
  },
  {
    id: 'cardapios',
    title: 'Cardápios',
    icon: BookText,
    topics: [
      { id: 'menus-create', title: 'Criar Cardápio', slug: 'menus-create' },
      { id: 'menus-customize', title: 'Personalizar Design', slug: 'menus-customize' },
      { id: 'menus-publish', title: 'Publicar e Compartilhar', slug: 'menus-publish' },
      { id: 'menus-qrcode', title: 'Gerar QR Code', slug: 'menus-qrcode' }
    ]
  },
  {
    id: 'orders',
    title: 'Pedidos',
    icon: ShoppingCart,
    topics: [
      { id: 'orders-receive', title: 'Receber Pedidos', slug: 'orders-receive' },
      { id: 'orders-manage', title: 'Gerenciar Status', slug: 'orders-manage' },
      { id: 'orders-history', title: 'Histórico de Pedidos', slug: 'orders-history' },
      { id: 'orders-settings', title: 'Configurações de Pedidos', slug: 'orders-settings' }
    ]
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    icon: DollarSign,
    topics: [
      { id: 'financial-overview', title: 'Visão Geral Financeira', slug: 'financial-overview' },
      { id: 'financial-transactions', title: 'Transações', slug: 'financial-transactions' },
      { id: 'financial-categories', title: 'Categorias Financeiras', slug: 'financial-categories' },
      { id: 'financial-reports', title: 'Relatórios', slug: 'financial-reports' },
      { id: 'financial-stripe', title: 'Integração com Stripe', slug: 'financial-stripe' }
    ]
  },
  {
    id: 'mensagens',
    title: 'Mensagens',
    icon: MessageSquare,
    topics: [
      { id: 'messages-inbox', title: 'Caixa de Entrada', slug: 'messages-inbox' },
      { id: 'messages-send', title: 'Enviar Mensagens', slug: 'messages-send' },
      { id: 'messages-templates', title: 'Modelos de Mensagens', slug: 'messages-templates' },
      { id: 'messages-whatsapp', title: 'Integração WhatsApp', slug: 'messages-whatsapp' }
    ]
  },
  {
    id: 'atendimento',
    title: 'Atendimento',
    icon: MessageCircle,
    topics: [
      { id: 'support-chat', title: 'Chat ao Vivo', slug: 'support-chat' },
      { id: 'support-tickets', title: 'Sistema de Tickets', slug: 'support-tickets' },
      { id: 'support-settings', title: 'Configurações de Atendimento', slug: 'support-settings' }
    ]
  },
  {
    id: 'customers',
    title: 'Clientes',
    icon: Users,
    topics: [
      { id: 'customers-add', title: 'Adicionar Clientes', slug: 'customers-add' },
      { id: 'customers-manage', title: 'Gerenciar Informações', slug: 'customers-manage' },
      { id: 'customers-history', title: 'Histórico de Compras', slug: 'customers-history' },
      { id: 'customers-import', title: 'Importar Clientes', slug: 'customers-import' }
    ]
  },
  {
    id: 'agenda',
    title: 'Agenda',
    icon: Calendar,
    topics: [
      { id: 'calendar-create', title: 'Criar Eventos', slug: 'calendar-create' },
      { id: 'calendar-manage', title: 'Gerenciar Compromissos', slug: 'calendar-manage' },
      { id: 'calendar-reminders', title: 'Lembretes', slug: 'calendar-reminders' },
      { id: 'calendar-sync', title: 'Sincronização', slug: 'calendar-sync' }
    ]
  },
  {
    id: 'settings',
    title: 'Configurações',
    icon: Settings,
    topics: [
      { id: 'settings-profile', title: 'Perfil e Informações', slug: 'settings-profile' },
      { id: 'settings-establishment', title: 'Dados do Estabelecimento', slug: 'settings-establishment' },
      { id: 'settings-hours', title: 'Horários de Funcionamento', slug: 'settings-hours' },
      { id: 'settings-preferences', title: 'Preferências', slug: 'settings-preferences' },
      { id: 'settings-users', title: 'Gerenciar Usuários', slug: 'settings-users' },
      { id: 'settings-notifications', title: 'Notificações', slug: 'settings-notifications' }
    ]
  }
]

// Conteúdos detalhados para cada tópico
const helpContent: Record<string, { title: string; content: React.ReactElement }> = {
  'dashboard-overview': {
    title: 'Visão Geral do Dashboard',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          O Dashboard é a tela inicial do SoTasty e oferece uma visão geral completa do seu negócio. 
          Aqui você encontra os principais indicadores e métricas em tempo real.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">O que você encontra no Dashboard:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Resumo de vendas do dia, semana e mês</li>
          <li>Total de pedidos em andamento</li>
          <li>Novos clientes cadastrados</li>
          <li>Indicadores financeiros principais</li>
          <li>Gráficos de desempenho</li>
          <li>Atividades recentes</li>
        </ul>
        <div className="bg-clay-50 border border-clay-200 rounded-lg p-4 mt-6">
          <h4 className="font-bold text-clay-700 flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5" />
            Dica
          </h4>
          <p className="text-sm text-gray-700">
            Use os filtros de período para visualizar dados de diferentes intervalos de tempo e 
            identificar tendências no seu negócio.
          </p>
        </div>
      </div>
    )
  },
  'dashboard-widgets': {
    title: 'Widgets e Estatísticas',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Os widgets do dashboard apresentam informações em tempo real sobre o desempenho do seu negócio.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Widgets Disponíveis:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li><strong>Vendas:</strong> Receita total e comparativo com períodos anteriores</li>
          <li><strong>Pedidos:</strong> Quantidade de pedidos e taxa de conversão</li>
          <li><strong>Clientes:</strong> Novos clientes e taxa de retenção</li>
          <li><strong>Produtos Populares:</strong> Itens mais vendidos</li>
          <li><strong>Desempenho:</strong> Gráficos de tendência</li>
        </ul>
      </div>
    )
  },
  'dashboard-customization': {
    title: 'Personalização do Dashboard',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Personalize seu dashboard para visualizar as métricas mais importantes para você.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Como personalizar:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
          <li>Clique no ícone de configurações no canto superior direito</li>
          <li>Selecione quais widgets deseja exibir</li>
          <li>Arraste para reorganizar a posição dos widgets</li>
          <li>Defina o período padrão de visualização</li>
          <li>Salve suas preferências</li>
        </ol>
      </div>
    )
  },
  'products-add': {
    title: 'Adicionar Novos Produtos',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Adicionar produtos ao seu catálogo é simples e rápido. Siga os passos abaixo:
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Passo a passo:</h3>
        <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-4">
          <li>Acesse o menu <strong>Produtos</strong> na barra lateral</li>
          <li>Clique no botão <strong>&quot;Adicionar Produto&quot;</strong> no canto superior direito</li>
          <li>Preencha as informações básicas:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li>Nome do produto</li>
              <li>Descrição</li>
              <li>Categoria</li>
              <li>Preço</li>
              <li>Imagem (opcional)</li>
            </ul>
          </li>
          <li>Configure opções adicionais como variações e complementos</li>
          <li>Defina a disponibilidade do produto</li>
          <li>Clique em <strong>&quot;Salvar&quot;</strong></li>
        </ol>
        <div className="bg-success-50 border border-success-200 rounded-lg p-4 mt-6">
          <h4 className="font-bold text-success-700 flex items-center gap-2 mb-2">
            <Package className="w-5 h-5" />
            Boas Práticas
          </h4>
          <p className="text-sm text-gray-700">
            Use imagens de alta qualidade e descrições detalhadas para seus produtos. 
            Isso aumenta as chances de conversão e melhora a experiência do cliente.
          </p>
        </div>
      </div>
    )
  },
  'products-categories': {
    title: 'Categorias e Subcategorias',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Organize seus produtos em categorias para facilitar a navegação dos clientes.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Como criar categorias:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
          <li>Acesse <strong>Produtos</strong> &gt; <strong>Categorias</strong></li>
          <li>Clique em &quot;Nova Categoria&quot;</li>
          <li>Defina o nome e cor da categoria</li>
          <li>Adicione subcategorias se necessário</li>
          <li>Salve as alterações</li>
        </ol>
        <p className="text-gray-700 mt-4">
          Você pode criar subcategorias para melhor organização. Por exemplo: 
          <strong>Bebidas</strong> &gt; <strong>Refrigerantes</strong>, <strong>Sucos</strong>, etc.
        </p>
      </div>
    )
  },
  'products-recipes': {
    title: 'Receitas Base',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Cadastre receitas base para calcular custos e gerenciar ingredientes de forma eficiente.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">O que são Receitas Base?</h3>
        <p className="text-gray-700">
          Receitas base são preparações que servem de base para seus produtos finais. 
          Por exemplo: massa de pizza, molho especial, recheios, etc.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Como cadastrar:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
          <li>Vá em <strong>Produtos</strong> &gt; <strong>Receitas Base</strong></li>
          <li>Clique em &quot;Nova Receita&quot;</li>
          <li>Defina nome e rendimento</li>
          <li>Adicione os ingredientes necessários</li>
          <li>Informe as quantidades de cada ingrediente</li>
          <li>O sistema calculará o custo automaticamente</li>
        </ol>
      </div>
    )
  },
  'products-ingredients': {
    title: 'Gerenciar Ingredientes',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Mantenha um cadastro completo de ingredientes para controle de estoque e custos.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Cadastro de Ingredientes:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Nome do ingrediente</li>
          <li>Tipo (sólido, líquido, etc.)</li>
          <li>Unidade de medida</li>
          <li>Custo por unidade</li>
          <li>Fornecedor</li>
          <li>Estoque mínimo</li>
        </ul>
      </div>
    )
  },
  'products-pricing': {
    title: 'Precificação',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Configure estratégias de precificação para garantir lucratividade.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Cálculo de Preço:</h3>
        <p className="text-gray-700">
          O sistema calcula automaticamente o preço sugerido baseado em:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Custo dos ingredientes</li>
          <li>Margem de lucro desejada</li>
          <li>Custos operacionais</li>
          <li>Impostos</li>
        </ul>
      </div>
    )
  },
  'menus-create': {
    title: 'Criar Cardápio',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Crie cardápios digitais profissionais e compartilhe com seus clientes de forma fácil.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Como criar um cardápio:</h3>
        <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-4">
          <li>Vá até <strong>Cardápios</strong> no menu lateral</li>
          <li>Clique em <strong>&quot;Novo Cardápio&quot;</strong></li>
          <li>Dê um nome ao seu cardápio</li>
          <li>Selecione os produtos que deseja incluir</li>
          <li>Organize por categorias</li>
          <li>Personalize cores e layout</li>
          <li>Publique e compartilhe o link</li>
        </ol>
        <div className="bg-info-50 border border-info-200 rounded-lg p-4 mt-6">
          <h4 className="font-bold text-info-700 flex items-center gap-2 mb-2">
            <BookText className="w-5 h-5" />
            Recursos Disponíveis
          </h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Múltiplos cardápios (almoço, jantar, drinks, etc.)</li>
            <li>• QR Code automático para cada cardápio</li>
            <li>• Visualização responsiva (mobile e desktop)</li>
            <li>• Personalização de cores da marca</li>
          </ul>
        </div>
      </div>
    )
  },
  'menus-customize': {
    title: 'Personalizar Design do Cardápio',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Personalize o visual do seu cardápio para refletir a identidade da sua marca.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Opções de Personalização:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Cores primária e secundária</li>
          <li>Logo do estabelecimento</li>
          <li>Estilo de layout (grid, lista, etc.)</li>
          <li>Fonte e tamanhos de texto</li>
          <li>Imagens de fundo</li>
          <li>Informações de contato</li>
        </ul>
      </div>
    )
  },
  'menus-publish': {
    title: 'Publicar e Compartilhar Cardápio',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Após criar seu cardápio, publique-o e compartilhe com seus clientes.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Formas de Compartilhamento:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Link direto para o cardápio</li>
          <li>QR Code para impressão</li>
          <li>Compartilhamento em redes sociais</li>
          <li>Integração com WhatsApp</li>
          <li>Incorporar em website</li>
        </ul>
      </div>
    )
  },
  'menus-qrcode': {
    title: 'Gerar QR Code',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Gere QR Codes para facilitar o acesso dos clientes ao seu cardápio.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Como usar:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
          <li>Abra o cardápio desejado</li>
          <li>Clique em &quot;Gerar QR Code&quot;</li>
          <li>Baixe a imagem do QR Code</li>
          <li>Imprima e coloque nas mesas ou no estabelecimento</li>
          <li>Clientes escaneiam com a câmera do celular</li>
        </ol>
      </div>
    )
  },
  'orders-receive': {
    title: 'Receber Pedidos',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Receba e gerencie pedidos de forma eficiente através da plataforma.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Como funciona:</h3>
        <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-4">
          <li>Clientes fazem pedidos através do seu cardápio digital</li>
          <li>Você recebe uma notificação em tempo real</li>
          <li>O pedido aparece na seção <strong>Pedidos</strong></li>
          <li>Aceite ou recuse o pedido</li>
          <li>Atualize o status conforme o andamento</li>
          <li>Notifique o cliente sobre mudanças de status</li>
        </ol>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Status de Pedidos:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li><strong>Novo:</strong> Pedido recém-recebido</li>
          <li><strong>Confirmado:</strong> Pedido aceito</li>
          <li><strong>Preparando:</strong> Em produção</li>
          <li><strong>Pronto:</strong> Aguardando retirada/entrega</li>
          <li><strong>Em Entrega:</strong> Saiu para entrega</li>
          <li><strong>Concluído:</strong> Pedido finalizado</li>
          <li><strong>Cancelado:</strong> Pedido cancelado</li>
        </ul>
      </div>
    )
  },
  'orders-manage': {
    title: 'Gerenciar Status de Pedidos',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Mantenha seus clientes informados atualizando o status dos pedidos.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Como atualizar:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
          <li>Clique no pedido na lista</li>
          <li>Visualize os detalhes</li>
          <li>Clique em &quot;Atualizar Status&quot;</li>
          <li>Selecione o novo status</li>
          <li>Adicione observações se necessário</li>
          <li>O cliente recebe notificação automática</li>
        </ol>
      </div>
    )
  },
  'orders-history': {
    title: 'Histórico de Pedidos',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Consulte o histórico completo de todos os pedidos realizados.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Funcionalidades:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Filtrar por período</li>
          <li>Buscar por cliente</li>
          <li>Filtrar por status</li>
          <li>Exportar relatórios</li>
          <li>Ver detalhes de cada pedido</li>
        </ul>
      </div>
    )
  },
  'orders-settings': {
    title: 'Configurações de Pedidos',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Configure como deseja receber e processar pedidos.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Configurações Disponíveis:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Horários de recebimento de pedidos</li>
          <li>Tempo de preparo médio</li>
          <li>Valor mínimo de pedido</li>
          <li>Taxa de entrega</li>
          <li>Raio de entrega</li>
          <li>Formas de pagamento aceitas</li>
          <li>Mensagens automáticas</li>
        </ul>
      </div>
    )
  },
  'financial-overview': {
    title: 'Visão Geral Financeira',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          O módulo Financeiro oferece controle completo sobre as finanças do seu negócio.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Principais Funcionalidades:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Acompanhamento de receitas e despesas</li>
          <li>Fluxo de caixa em tempo real</li>
          <li>Relatórios financeiros detalhados</li>
          <li>Categorização de transações</li>
          <li>Gráficos de desempenho financeiro</li>
          <li>Integração com meios de pagamento</li>
        </ul>
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mt-6">
          <h4 className="font-bold text-warning-700 flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5" />
            Importante
          </h4>
          <p className="text-sm text-gray-700">
            Mantenha suas transações sempre atualizadas para ter uma visão precisa da saúde 
            financeira do seu negócio. Configure categorias personalizadas para melhor organização.
          </p>
        </div>
      </div>
    )
  },
  'financial-transactions': {
    title: 'Transações Financeiras',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Registre todas as movimentações financeiras do seu negócio.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Tipos de Transação:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li><strong>Receitas:</strong> Vendas, pagamentos recebidos</li>
          <li><strong>Despesas:</strong> Compras, custos operacionais</li>
          <li><strong>Transferências:</strong> Movimentações entre contas</li>
        </ul>
      </div>
    )
  },
  'financial-categories': {
    title: 'Categorias Financeiras',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Organize suas finanças com categorias personalizadas.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Exemplos de Categorias:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Vendas (receita)</li>
          <li>Compra de ingredientes (despesa)</li>
          <li>Salários (despesa)</li>
          <li>Marketing (despesa)</li>
          <li>Aluguel (despesa)</li>
          <li>Equipamentos (despesa)</li>
        </ul>
      </div>
    )
  },
  'financial-reports': {
    title: 'Relatórios Financeiros',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Gere relatórios detalhados para análise financeira.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Relatórios Disponíveis:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Demonstrativo de Resultados (DRE)</li>
          <li>Fluxo de Caixa</li>
          <li>Receitas vs Despesas</li>
          <li>Análise por Categoria</li>
          <li>Lucro Líquido</li>
          <li>Margem de Contribuição</li>
        </ul>
      </div>
    )
  },
  'financial-stripe': {
    title: 'Integração com Stripe',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Conecte sua conta Stripe para receber pagamentos online.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Como configurar:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
          <li>Crie uma conta no Stripe</li>
          <li>Acesse Configurações &gt; Financeiro</li>
          <li>Clique em &quot;Conectar Stripe&quot;</li>
          <li>Autorize a integração</li>
          <li>Configure métodos de pagamento</li>
        </ol>
      </div>
    )
  },
  'messages-inbox': {
    title: 'Caixa de Entrada de Mensagens',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Gerencie todas as mensagens dos seus clientes em um só lugar.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Recursos:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Visualização unificada de conversas</li>
          <li>Filtros por status (lida, não lida)</li>
          <li>Busca por cliente</li>
          <li>Marcação de mensagens importantes</li>
          <li>Arquivamento de conversas antigas</li>
        </ul>
      </div>
    )
  },
  'messages-send': {
    title: 'Enviar Mensagens',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Envie mensagens para seus clientes de forma rápida e eficiente.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Como enviar:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
          <li>Selecione um cliente</li>
          <li>Digite sua mensagem</li>
          <li>Adicione anexos se necessário</li>
          <li>Clique em Enviar</li>
        </ol>
      </div>
    )
  },
  'messages-templates': {
    title: 'Modelos de Mensagens',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Crie modelos de mensagens para respostas rápidas e padronizadas.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Exemplos de Templates:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Confirmação de pedido</li>
          <li>Pedido em preparo</li>
          <li>Pedido saiu para entrega</li>
          <li>Agradecimento pela compra</li>
          <li>Solicitação de feedback</li>
        </ul>
      </div>
    )
  },
  'messages-whatsapp': {
    title: 'Integração WhatsApp',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Integre sua conta do WhatsApp Business para comunicação direta com clientes.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Benefícios:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Receba mensagens no SoTasty</li>
          <li>Responda pelo WhatsApp Web</li>
          <li>Histórico centralizado</li>
          <li>Mensagens automáticas</li>
          <li>Notificações em tempo real</li>
        </ul>
      </div>
    )
  },
  'support-chat': {
    title: 'Chat ao Vivo',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Ofereça atendimento em tempo real aos seus clientes através do chat.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Funcionalidades:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Chat em tempo real</li>
          <li>Múltiplas conversas simultâneas</li>
          <li>Histórico de conversas</li>
          <li>Transferência entre atendentes</li>
          <li>Respostas rápidas</li>
        </ul>
      </div>
    )
  },
  'support-tickets': {
    title: 'Sistema de Tickets',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Organize o atendimento com um sistema de tickets.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Status de Tickets:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Aberto</li>
          <li>Em Andamento</li>
          <li>Aguardando Cliente</li>
          <li>Resolvido</li>
          <li>Fechado</li>
        </ul>
      </div>
    )
  },
  'support-settings': {
    title: 'Configurações de Atendimento',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Configure como deseja atender seus clientes.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Configurações:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Horário de atendimento</li>
          <li>Mensagem de ausência</li>
          <li>Tempo de resposta esperado</li>
          <li>Equipe de atendimento</li>
          <li>Priorização de tickets</li>
        </ul>
      </div>
    )
  },
  'customers-add': {
    title: 'Adicionar Clientes',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Mantenha um cadastro organizado de seus clientes para melhor gestão e relacionamento.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Como adicionar clientes:</h3>
        <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-4">
          <li>Acesse <strong>Clientes</strong> no menu</li>
          <li>Clique em <strong>&quot;Adicionar Cliente&quot;</strong></li>
          <li>Preencha os dados:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li>Nome completo</li>
              <li>E-mail</li>
              <li>Telefone</li>
              <li>CPF/CNPJ (opcional)</li>
              <li>Endereço de entrega</li>
            </ul>
          </li>
          <li>Salve o cadastro</li>
        </ol>
        <div className="bg-clay-50 border border-clay-200 rounded-lg p-4 mt-6">
          <h4 className="font-bold text-clay-700 flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5" />
            Dica
          </h4>
          <p className="text-sm text-gray-700">
            Clientes também podem se cadastrar automaticamente ao fazer um pedido. 
            Os dados ficam salvos para pedidos futuros.
          </p>
        </div>
      </div>
    )
  },
  'customers-manage': {
    title: 'Gerenciar Informações de Clientes',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Edite e atualize as informações dos seus clientes.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Informações Gerenciáveis:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Dados pessoais</li>
          <li>Endereços de entrega</li>
          <li>Preferências</li>
          <li>Observações</li>
          <li>Tags e segmentação</li>
        </ul>
      </div>
    )
  },
  'customers-history': {
    title: 'Histórico de Compras',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Visualize o histórico completo de pedidos de cada cliente.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Informações Disponíveis:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Todos os pedidos realizados</li>
          <li>Valor total gasto</li>
          <li>Frequência de compras</li>
          <li>Produtos favoritos</li>
          <li>Ticket médio</li>
        </ul>
      </div>
    )
  },
  'customers-import': {
    title: 'Importar Clientes',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Importe sua base de clientes de forma rápida usando planilhas.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Como importar:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
          <li>Baixe o modelo de planilha</li>
          <li>Preencha com os dados dos clientes</li>
          <li>Acesse Clientes &gt; Importar</li>
          <li>Faça upload da planilha</li>
          <li>Revise os dados</li>
          <li>Confirme a importação</li>
        </ol>
      </div>
    )
  },
  'calendar-create': {
    title: 'Criar Eventos na Agenda',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Organize sua agenda com eventos e compromissos.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Tipos de Eventos:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Reuniões</li>
          <li>Entregas agendadas</li>
          <li>Eventos especiais</li>
          <li>Tarefas</li>
          <li>Lembretes</li>
        </ul>
      </div>
    )
  },
  'calendar-manage': {
    title: 'Gerenciar Compromissos',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Visualize e gerencie todos os seus compromissos.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Visualizações:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Dia</li>
          <li>Semana</li>
          <li>Mês</li>
          <li>Agenda (lista)</li>
        </ul>
      </div>
    )
  },
  'calendar-reminders': {
    title: 'Lembretes da Agenda',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Configure lembretes para não perder compromissos importantes.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Opções de Lembrete:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>5 minutos antes</li>
          <li>15 minutos antes</li>
          <li>30 minutos antes</li>
          <li>1 hora antes</li>
          <li>1 dia antes</li>
          <li>Personalizado</li>
        </ul>
      </div>
    )
  },
  'calendar-sync': {
    title: 'Sincronização de Agenda',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Sincronize sua agenda com Google Calendar, Outlook e outros serviços.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Serviços Suportados:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Google Calendar</li>
          <li>Microsoft Outlook</li>
          <li>Apple Calendar</li>
          <li>Calendários ICS</li>
        </ul>
      </div>
    )
  },
  'settings-profile': {
    title: 'Perfil e Informações',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Configure as informações do seu perfil e do seu estabelecimento.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Configurações de Perfil:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Foto de perfil</li>
          <li>Nome completo</li>
          <li>E-mail de contato</li>
          <li>Telefone</li>
          <li>Senha de acesso</li>
        </ul>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Dados do Estabelecimento:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Nome fantasia</li>
          <li>Razão social</li>
          <li>CNPJ</li>
          <li>Logo do estabelecimento</li>
          <li>Endereço completo</li>
          <li>Telefone comercial</li>
          <li>Redes sociais</li>
        </ul>
      </div>
    )
  },
  'settings-establishment': {
    title: 'Dados do Estabelecimento',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Configure os dados completos do seu estabelecimento.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Informações Necessárias:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Razão Social e Nome Fantasia</li>
          <li>CNPJ</li>
          <li>Inscrição Estadual</li>
          <li>Endereço completo</li>
          <li>Telefones de contato</li>
          <li>E-mail comercial</li>
          <li>Website e redes sociais</li>
        </ul>
      </div>
    )
  },
  'settings-hours': {
    title: 'Horários de Funcionamento',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Defina os horários em que seu estabelecimento funciona.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Configurações:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Horários por dia da semana</li>
          <li>Horários especiais (feriados)</li>
          <li>Intervalos de fechamento</li>
          <li>Dias de folga</li>
          <li>Horário de recebimento de pedidos</li>
        </ul>
      </div>
    )
  },
  'settings-preferences': {
    title: 'Preferências do Sistema',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Personalize como o sistema funciona para você.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Opções:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Idioma</li>
          <li>Fuso horário</li>
          <li>Formato de data e hora</li>
          <li>Moeda</li>
          <li>Tema (claro/escuro)</li>
          <li>Posição do menu</li>
          <li>Notificações</li>
        </ul>
      </div>
    )
  },
  'settings-users': {
    title: 'Gerenciar Usuários',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Adicione membros da equipe e gerencie permissões de acesso.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Tipos de Usuário:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li><strong>Administrador:</strong> Acesso completo</li>
          <li><strong>Gerente:</strong> Acesso a maioria das funcionalidades</li>
          <li><strong>Atendente:</strong> Acesso a pedidos e atendimento</li>
          <li><strong>Cozinha:</strong> Acesso a pedidos e produtos</li>
          <li><strong>Entregador:</strong> Acesso a pedidos em entrega</li>
        </ul>
      </div>
    )
  },
  'settings-notifications': {
    title: 'Configurações de Notificações',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          Configure quais notificações deseja receber.
        </p>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Tipos de Notificação:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Novos pedidos</li>
          <li>Mensagens de clientes</li>
          <li>Atualizações de status</li>
          <li>Lembretes de agenda</li>
          <li>Alertas financeiros</li>
          <li>Notícias e atualizações do sistema</li>
        </ul>
        <h3 className="text-lg font-bold text-gray-900 mt-6">Canais:</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Notificações no sistema</li>
          <li>E-mail</li>
          <li>WhatsApp</li>
          <li>SMS</li>
        </ul>
      </div>
    )
  }
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('dashboard-overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Filtrar tópicos baseado na busca
  const filteredTopics = useMemo(() => {
    if (!searchQuery) return helpTopics

    const query = searchQuery.toLowerCase()
    return helpTopics.map(section => ({
      ...section,
      topics: section.topics.filter(topic =>
        topic.title.toLowerCase().includes(query) ||
        section.title.toLowerCase().includes(query)
      )
    })).filter(section => section.topics.length > 0)
  }, [searchQuery])

  // Conteúdo selecionado
  const currentContent = helpContent[selectedTopic] || {
    title: 'Tópico não encontrado',
    content: <p className="text-gray-500">Selecione um tópico no menu lateral.</p>
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Como podemos te ajudar?</h1>
        
        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por tópicos, palavras-chave..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-clay-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex gap-6 items-start">
        {/* Sidebar - Menu Lateral */}
        <aside className={`bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-16'} flex-shrink-0 sticky top-8`}>
          {/* Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-6 w-6 h-6 bg-clay-500 hover:bg-clay-600 rounded-full flex items-center justify-center shadow-lg transition-all z-10"
          >
            <ChevronRight className={`w-4 h-4 text-white transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} />
          </button>

          {isSidebarOpen ? (
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-clay-500" />
                Tópicos de Ajuda
              </h2>
              
              <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                {filteredTopics.map((section) => (
                  <div key={section.id}>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <section.icon className="w-4 h-4 text-clay-500" />
                      {section.title}
                    </div>
                    <div className="space-y-1 ml-2">
                      {section.topics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => setSelectedTopic(topic.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                            selectedTopic === topic.id
                              ? 'bg-gradient-to-r from-[var(--color-clay-500)] to-[var(--color-clay-300)] text-white shadow-lg shadow-[var(--color-clay-500)]/30'
                              : 'text-gray-600 hover:bg-[var(--color-clay-50)]'
                          }`}
                        >
                          {topic.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {filteredTopics.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-8">
                  Nenhum tópico encontrado para &quot;{searchQuery}&quot;
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 flex flex-col items-center gap-6 mt-12">
              {helpTopics.map((section) => (
                <button
                  key={section.id}
                  title={section.title}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-all"
                >
                  <section.icon className="w-5 h-5 text-gray-600" />
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[600px]">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{currentContent.title}</h2>
            <div className="prose prose-gray max-w-none">
              {currentContent.content}
            </div>

            {/* Contact Support Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ainda precisa de ajuda?</h3>
              <p className="text-gray-600 mb-6">
                Nossa equipe de suporte está pronta para ajudar você com qualquer dúvida.
              </p>
              <div className="flex gap-4">
                <a
                  href="mailto:suporte@sotasty.com"
                  className="btn-primary-outline flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Enviar E-mail
                </a>
                <a
                  href="https://wa.me/5548999178752"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-success flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
