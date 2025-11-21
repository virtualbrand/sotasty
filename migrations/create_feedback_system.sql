-- Tabela de feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('improvement', 'new', 'bug', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in-progress', 'completed', 'rejected')),
  votes INTEGER NOT NULL DEFAULT 1,
  comments_count INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  merged_into UUID REFERENCES feedbacks(id)
);

-- Tabela de votos
CREATE TABLE IF NOT EXISTS feedback_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feedback_id, user_id)
);

-- Tabela de comentários
CREATE TABLE IF NOT EXISTS feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_category ON feedbacks(category);
CREATE INDEX IF NOT EXISTS idx_feedbacks_votes ON feedbacks(votes DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback_id ON feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_user_id ON feedback_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback_id ON feedback_comments(feedback_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_feedbacks_updated_at ON feedbacks;
CREATE TRIGGER update_feedbacks_updated_at
  BEFORE UPDATE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_comments_updated_at ON feedback_comments;
CREATE TRIGGER update_feedback_comments_updated_at
  BEFORE UPDATE ON feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para feedbacks
-- Qualquer um pode ver feedbacks aprovados
CREATE POLICY "Feedbacks aprovados são públicos"
  ON feedbacks FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid());

-- Usuários autenticados podem criar feedbacks
CREATE POLICY "Usuários podem criar feedbacks"
  ON feedbacks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem editar seus próprios feedbacks (se ainda pending)
CREATE POLICY "Usuários podem editar seus feedbacks pendentes"
  ON feedbacks FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Apenas superadmins podem aprovar/rejeitar feedbacks
CREATE POLICY "Superadmins podem moderar feedbacks"
  ON feedbacks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- Políticas para votos
-- Qualquer um pode ver votos
CREATE POLICY "Votos são públicos"
  ON feedback_votes FOR SELECT
  USING (true);

-- Usuários autenticados podem votar
CREATE POLICY "Usuários podem votar"
  ON feedback_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios votos
CREATE POLICY "Usuários podem atualizar seus votos"
  ON feedback_votes FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios votos
CREATE POLICY "Usuários podem deletar seus votos"
  ON feedback_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para comentários
-- Qualquer um pode ver comentários de feedbacks aprovados
CREATE POLICY "Comentários de feedbacks aprovados são públicos"
  ON feedback_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM feedbacks
      WHERE feedbacks.id = feedback_comments.feedback_id
      AND feedbacks.status = 'approved'
    )
  );

-- Usuários autenticados podem comentar em feedbacks aprovados
CREATE POLICY "Usuários podem comentar em feedbacks aprovados"
  ON feedback_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM feedbacks
      WHERE feedbacks.id = feedback_comments.feedback_id
      AND feedbacks.status = 'approved'
    )
  );

-- Usuários podem editar seus próprios comentários
CREATE POLICY "Usuários podem editar seus comentários"
  ON feedback_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios comentários
CREATE POLICY "Usuários podem deletar seus comentários"
  ON feedback_comments FOR DELETE
  USING (auth.uid() = user_id);
