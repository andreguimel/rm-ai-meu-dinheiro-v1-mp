-- TESTE MANUAL DAS FUNÇÕES RPC NO SUPABASE
-- Execute estes comandos no SQL Editor do Supabase para debugar

-- 1. Primeiro, verifique se as funções existem
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_subscriber_trial', 'ensure_user_has_trial');

-- 2. Verifique permissões das funções
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_subscriber_trial', 'ensure_user_has_trial');

-- 3. Liste usuários existentes
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Liste subscribers existentes
SELECT 
    user_id,
    email,
    subscribed,
    subscription_tier,
    trial_start,
    trial_end,
    created_at
FROM public.subscribers 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Teste a função ensure_user_has_trial para um usuário específico
-- Substitua 'SEU_USER_ID_AQUI' pelo ID real de um usuário
-- SELECT public.ensure_user_has_trial('SEU_USER_ID_AQUI');

-- 6. Teste direto da função create_subscriber_trial
-- Substitua pelos dados reais de um usuário
-- SELECT public.create_subscriber_trial('SEU_USER_ID_AQUI', 'email@exemplo.com');

-- 7. Verifique as policies da tabela subscribers
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'subscribers';

-- 8. Verifique se RLS está habilitado na tabela subscribers
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'subscribers';

-- 9. Teste se o usuário autenticado consegue inserir em subscribers
-- Este comando deve ser executado quando você estiver logado no frontend
-- INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, trial_start, trial_end, created_at, updated_at)
-- VALUES (auth.uid(), auth.email(), true, 'Trial', NOW(), NOW() + INTERVAL '7 days', NOW(), NOW());

-- 10. Verifique erros recentes nos logs (se disponível)
-- SELECT * FROM pg_stat_statements WHERE query LIKE '%subscribers%' OR query LIKE '%trial%' ORDER BY last_exec_time DESC LIMIT 10;
