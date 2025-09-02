-- DIAGNÓSTICO SIMPLIFICADO DA TABELA SUBSCRIBERS
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar se a tabela subscribers existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscribers')
        THEN 'TABELA SUBSCRIBERS EXISTE ✅'
        ELSE 'PROBLEMA: TABELA SUBSCRIBERS NÃO EXISTE ❌'
    END as status_tabela;

-- 2. Mostrar estrutura da tabela subscribers
SELECT 
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_nulo,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'subscribers'
ORDER BY ordinal_position;

-- 3. Verificar políticas RLS existentes
SELECT 
    policyname as politica,
    cmd as comando,
    roles as funcoes,
    qual as condicao_where,
    with_check as condicao_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'subscribers';

-- 4. Verificar se RLS está habilitado
SELECT 
    CASE 
        WHEN rowsecurity THEN 'RLS HABILITADO ✅'
        ELSE 'RLS DESABILITADO ⚠️'
    END as status_rls
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'subscribers';

-- 5. Remover políticas antigas e criar novas
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Allow trial creation for authenticated users" ON public.subscribers;
DROP POLICY IF EXISTS "Users can ensure their own trial" ON public.subscribers;

-- 6. Criar políticas RLS simples e funcionais
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

-- 7. Verificar políticas criadas
SELECT 
    'POLÍTICAS CRIADAS:' as status,
    COUNT(*) as total_politicas
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'subscribers';

-- 8. Função de teste simples para inserção
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
    
    -- Verificar se temos um usuário autenticado
    IF current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Usuário não autenticado'
        );
    END IF;
    
    -- Pegar email do usuário
    SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    
    -- Verificar se já existe subscriber
    IF EXISTS (SELECT 1 FROM public.subscribers WHERE user_id = current_user_id) THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Subscriber já existe',
            'user_id', current_user_id,
            'email', current_user_email,
            'action', 'already_exists'
        );
    END IF;
    
    -- Tentar inserção
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
            'message', 'Subscriber inserido com sucesso',
            'user_id', current_user_id,
            'email', current_user_email,
            'action', 'inserted'
        );
        
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Erro ao inserir subscriber',
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'user_id', current_user_id,
            'email', current_user_email
        );
    END;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.test_subscriber_insert() TO authenticated;

-- 9. Teste a função (descomente a linha abaixo quando estiver logado)
-- SELECT public.test_subscriber_insert();

-- 10. Verificar dados existentes
SELECT 'DADOS ATUAIS:' as info;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as total_subscribers FROM public.subscribers;
