-- Melhorar tabela de atividades para rastreamento completo de CRUD
-- Remove a tabela antiga se existir e recria com estrutura completa
DROP TABLE IF EXISTS activities CASCADE;

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Tipo de atividade
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view', 'export', 'other')),
  
  -- Categoria/Módulo
  category TEXT NOT NULL CHECK (category IN ('produto', 'cardapio', 'pedido', 'cliente', 'financeiro', 'agenda', 'configuracao', 'system')),
  
  -- Descrição da ação
  description TEXT NOT NULL,
  
  -- Detalhes adicionais (JSON)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Referência ao item afetado (opcional)
  entity_type TEXT, -- Ex: 'order', 'product', 'customer'
  entity_id UUID,   -- ID do item afetado
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_activities_workspace_id ON activities(workspace_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_category ON activities(category);
CREATE INDEX idx_activities_action ON activities(action);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);

-- RLS Policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view workspace activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;

-- Usuários podem ver atividades do seu workspace
CREATE POLICY "Users can view workspace activities"
  ON activities
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Usuários podem inserir suas próprias atividades
CREATE POLICY "Users can insert own activities"
  ON activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE activities IS 'Registro de todas as atividades/ações dos usuários no sistema';
COMMENT ON COLUMN activities.action IS 'Tipo de ação: create, update, delete, view, export, other';
COMMENT ON COLUMN activities.category IS 'Categoria/módulo: produto, cardapio, pedido, cliente, financeiro, agenda, configuracao, system';
COMMENT ON COLUMN activities.description IS 'Descrição legível da ação realizada';
COMMENT ON COLUMN activities.metadata IS 'Dados adicionais em JSON (ex: valores antigos/novos, IPs, etc)';
COMMENT ON COLUMN activities.entity_type IS 'Tipo da entidade afetada (order, product, customer, etc)';
COMMENT ON COLUMN activities.entity_id IS 'ID da entidade afetada';
