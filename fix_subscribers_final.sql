-- EXECUTE ESTE SQL COMPLETO DE UMA VEZ NO SUPABASE SQL EDITOR
-- Corrige todas as políticas RLS e cria função de teste

-- 1. Remover TODAS as políticas existentes
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'subscribers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.subscribers';
        RAISE NOTICE 'Política removida: %', pol.policyname;
    END LOOP;
END $$;

-- 2. Criar políticas RLS corretas
CREATE POLICY "allow_insert_own_subscriber" 
ON public.subscribers
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_select_own_subscriber" 
ON public.subscribers
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "allow_update_own_subscriber" 
ON public.subscribers
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Função de teste simples e segura
CREATE OR REPLACE FUNCTION public.simple_subscriber_test()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    existing_count INTEGER;
BEGIN
    -- Verificar usuário autenticado
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Usuário não autenticado');
    END IF;
    
    -- Pegar email do usuário
    SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    
    -- Verificar se já existe
    SELECT COUNT(*) INTO existing_count FROM public.subscribers WHERE user_id = current_user_id;
    
    IF existing_count > 0 THEN
        RETURN json_build_object(
            'success', true, 
            'message', 'Subscriber já existe',
            'user_id', current_user_id,
            'email', current_user_email,
            'action', 'already_exists'
        );
    END IF;
    
    -- Tentar inserir
    BEGIN
        INSERT INTO public.subscribers (
            user_id, email, subscribed, subscription_tier, 
            trial_start, trial_end, created_at, updated_at
        ) VALUES (
            current_user_id, current_user_email, true, 'Trial',
            NOW(), NOW() + INTERVAL '7 days', NOW(), NOW()
        );
        
        RETURN json_build_object(
            'success', true,
            'message', 'Subscriber criado com sucesso',
            'user_id', current_user_id,
            'email', current_user_email,
            'action', 'created'
        );
        
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Erro ao criar subscriber',
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'user_id', current_user_id,
            'email', current_user_email
        );
    END;
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.simple_subscriber_test() TO authenticated;

-- 5. Verificar estrutura atual
SELECT 'VERIFICAÇÃO FINAL:' as status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscribers')
        THEN 'TABELA SUBSCRIBERS EXISTE ✅'
        ELSE 'PROBLEMA: TABELA NÃO EXISTE ❌'
    END as tabela_status;

SELECT 
    COUNT(*) as total_politicas_rls
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'subscribers';

-- 6. Para testar, descomente a linha abaixo quando estiver logado:
-- SELECT public.simple_subscriber_test();
