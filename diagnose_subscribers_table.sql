-- DIAGNÓSTICO COMPLETO DA TABELA SUBSCRIBERS
-- Execute este SQL no Supabase para identificar o problema

-- 1. Verificar se a tabela subscribers existe e sua estrutura
DO $$
DECLARE
    rec RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscribers') THEN
        RAISE NOTICE 'Tabela subscribers existe';
        
        -- Mostrar estrutura
        FOR rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'subscribers'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Coluna: % | Tipo: % | Nulo: % | Padrão: %', 
                rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
        END LOOP;
    ELSE
        RAISE NOTICE 'PROBLEMA: Tabela subscribers NÃO existe!';
    END IF;
END $$;

-- 2. Verificar políticas RLS
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'subscribers';
    
    IF policy_count = 0 THEN
        RAISE NOTICE 'AVISO: Nenhuma política RLS encontrada para subscribers';
    ELSE
        RAISE NOTICE 'Encontradas % políticas RLS para subscribers', policy_count;
    END IF;
END $$;

-- 3. Verificar se RLS está habilitado
SELECT 
    CASE 
        WHEN rowsecurity THEN 'RLS HABILITADO'
        ELSE 'RLS DESABILITADO'
    END as status_rls
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'subscribers';

-- 4. Criar políticas RLS corretas se necessário
DO $$
BEGIN
    -- Remover políticas existentes que podem estar conflitando
    DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscribers;
    DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;
    DROP POLICY IF EXISTS "Allow trial creation for authenticated users" ON public.subscribers;
    DROP POLICY IF EXISTS "Users can ensure their own trial" ON public.subscribers;
    
    -- Criar política para INSERT (permitir usuários criarem seus próprios registros)
    CREATE POLICY "allow_insert_own_subscriber" 
    ON public.subscribers
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_id = auth.uid());
    
    -- Criar política para SELECT (permitir usuários verem seus próprios registros)
    CREATE POLICY "allow_select_own_subscriber" 
    ON public.subscribers
    FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());
    
    -- Criar política para UPDATE (permitir usuários atualizarem seus próprios registros)
    CREATE POLICY "allow_update_own_subscriber" 
    ON public.subscribers
    FOR UPDATE 
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
    
    RAISE NOTICE 'Políticas RLS criadas com sucesso';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar políticas: %', SQLERRM;
END $$;

-- 5. Função simples para testar inserção direta
CREATE OR REPLACE FUNCTION public.test_subscriber_insert()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    result JSON;
BEGIN
    -- Pegar dados do usuário atual
    current_user_id := auth.uid();
    SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    
    -- Tentar inserção simples
    BEGIN
        INSERT INTO public.subscribers (
            user_id, email, subscribed, subscription_tier, 
            trial_start, trial_end, created_at, updated_at
        ) VALUES (
            current_user_id, current_user_email, true, 'Trial',
            NOW(), NOW() + INTERVAL '7 days', NOW(), NOW()
        );
        
        result := json_build_object(
            'success', true,
            'message', 'Subscriber inserido com sucesso',
            'user_id', current_user_id,
            'email', current_user_email
        );
        
    EXCEPTION WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', 'Erro ao inserir subscriber',
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'user_id', current_user_id,
            'email', current_user_email
        );
    END;
    
    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.test_subscriber_insert() TO authenticated;

-- 6. Testar a função (descomente para testar)
-- SELECT public.test_subscriber_insert();
