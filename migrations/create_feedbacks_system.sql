-- Tabela de feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('improvement', 'new', 'bug', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in-progress', 'completed', 'rejected')),
  votes INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES auth.users(id)
);

-- Tabela de votos de feedbacks
CREATE TABLE IF NOT EXISTS feedback_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(feedback_id, user_id)
);

-- Tabela de comentários de feedbacks (opcional para futuro)
CREATE TABLE IF NOT EXISTS feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_category ON feedbacks(category);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_votes ON feedbacks(votes DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback_id ON feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_user_id ON feedback_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_user_feedback ON feedback_votes(user_id, feedback_id);

CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback_id ON feedback_comments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_user_id ON feedback_comments(user_id);

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function para atualizar contador de comentários
CREATE OR REPLACE FUNCTION update_feedback_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedbacks 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.feedback_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedbacks 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.feedback_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_feedbacks_updated_at ON feedbacks;
CREATE TRIGGER update_feedbacks_updated_at
  BEFORE UPDATE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_votes_updated_at ON feedback_votes;
CREATE TRIGGER update_feedback_votes_updated_at
  BEFORE UPDATE ON feedback_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_comments_updated_at ON feedback_comments;
CREATE TRIGGER update_feedback_comments_updated_at
  BEFORE UPDATE ON feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar contador de comentários
DROP TRIGGER IF EXISTS update_feedback_comments_count_trigger ON feedback_comments;
CREATE TRIGGER update_feedback_comments_count_trigger
  AFTER INSERT OR DELETE ON feedback_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_comments_count();

-- RLS Policies para feedbacks
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem criar feedbacks
CREATE POLICY "Usuários autenticados podem criar feedbacks"
  ON feedbacks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Todos podem ver feedbacks aprovados
CREATE POLICY "Todos podem ver feedbacks aprovados"
  ON feedbacks
  FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- Usuários podem ver seus próprios feedbacks
CREATE POLICY "Usuários podem ver seus próprios feedbacks"
  ON feedbacks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SuperAdmins podem ver todos os feedbacks
CREATE POLICY "SuperAdmins podem ver todos os feedbacks"
  ON feedbacks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- SuperAdmins podem atualizar feedbacks (moderação)
CREATE POLICY "SuperAdmins podem atualizar feedbacks"
  ON feedbacks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- SuperAdmins podem deletar feedbacks
CREATE POLICY "SuperAdmins podem deletar feedbacks"
  ON feedbacks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- RLS Policies para feedback_votes
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem criar votos
CREATE POLICY "Usuários autenticados podem votar"
  ON feedback_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem ver votos em feedbacks aprovados
CREATE POLICY "Usuários podem ver votos em feedbacks aprovados"
  ON feedback_votes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM feedbacks
      WHERE feedbacks.id = feedback_votes.feedback_id
      AND feedbacks.status = 'approved'
    )
  );

-- Usuários podem atualizar seus próprios votos
CREATE POLICY "Usuários podem atualizar seus próprios votos"
  ON feedback_votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar seus próprios votos
CREATE POLICY "Usuários podem deletar seus próprios votos"
  ON feedback_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies para feedback_comments
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem criar comentários
CREATE POLICY "Usuários autenticados podem comentar"
  ON feedback_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Todos podem ver comentários em feedbacks aprovados
CREATE POLICY "Todos podem ver comentários em feedbacks aprovados"
  ON feedback_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM feedbacks
      WHERE feedbacks.id = feedback_comments.feedback_id
      AND feedbacks.status = 'approved'
    )
  );

-- Usuários podem atualizar seus próprios comentários
CREATE POLICY "Usuários podem atualizar seus próprios comentários"
  ON feedback_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar seus próprios comentários
CREATE POLICY "Usuários podem deletar seus próprios comentários"
  ON feedback_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- SuperAdmins podem deletar qualquer comentário
CREATE POLICY "SuperAdmins podem deletar qualquer comentário"
  ON feedback_comments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );
