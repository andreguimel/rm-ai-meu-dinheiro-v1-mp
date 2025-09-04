-- Verificar se a tabela subscribers existe e tem a estrutura correta
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscribers' 
ORDER BY ordinal_position;

-- Se a tabela não existir ou não tiver a coluna stripe_customer_id, execute isto:
-- (Descomente as linhas abaixo se necessário)

/*
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Se a tabela já existe mas não tem a coluna, adicione:
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscribers' AND policyname = 'select_own_subscription') THEN
    CREATE POLICY "select_own_subscription" ON public.subscribers
    FOR SELECT
    USING (user_id = auth.uid() OR email = auth.email());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscribers' AND policyname = 'update_own_subscription') THEN
    CREATE POLICY "update_own_subscription" ON public.subscribers
    FOR UPDATE
    USING (true);
  END IF;
END $$;
*/
