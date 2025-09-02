-- EXECUTE ESTES COMANDOS UM POR VEZ NO SUPABASE SQL EDITOR

-- 1. Verificar se tabela subscribers existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscribers')
        THEN 'TABELA EXISTE ✅'
        ELSE 'TABELA NÃO EXISTE ❌'
    END as resultado;

-- 2. Ver estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'subscribers'
ORDER BY ordinal_position;

-- 3. Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Allow trial creation for authenticated users" ON public.subscribers;
DROP POLICY IF EXISTS "Users can ensure their own trial" ON public.subscribers;
DROP POLICY IF EXISTS "allow_insert_own_subscriber" ON public.subscribers;
DROP POLICY IF EXISTS "allow_select_own_subscriber" ON public.subscribers;
DROP POLICY IF EXISTS "allow_update_own_subscriber" ON public.subscribers;

-- 4. Criar política de INSERT
CREATE POLICY "allow_insert_own_subscriber" 
ON public.subscribers
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 5. Criar política de SELECT
CREATE POLICY "allow_select_own_subscriber" 
ON public.subscribers
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- 6. Criar política de UPDATE
CREATE POLICY "allow_update_own_subscriber" 
ON public.subscribers
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 7. Verificar políticas criadas
SELECT policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'subscribers';

-- 8. Função de teste simples
CREATE OR REPLACE FUNCTION public.simple_subscriber_test()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Tentar inserir um registro simples
    INSERT INTO public.subscribers (
        user_id, email, subscribed, subscription_tier, 
        trial_start, trial_end, created_at, updated_at
    ) VALUES (
        auth.uid(), 
        (SELECT email FROM auth.users WHERE id = auth.uid()), 
        true, 
        'Trial',
        NOW(), 
        NOW() + INTERVAL '7 days', 
        NOW(), 
        NOW()
    );
    
    RETURN 'SUCESSO: Subscriber criado';
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERRO: ' || SQLERRM;
END;
$$;

-- 9. Grant permission
GRANT EXECUTE ON FUNCTION public.simple_subscriber_test() TO authenticated;

-- 10. Testar (descomente quando estiver logado)
-- SELECT public.simple_subscriber_test();
