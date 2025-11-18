-- Adicionar campos do Stripe à tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
