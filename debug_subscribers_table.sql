-- DEBUG: Por que não está criando na tabela subscribers
-- Execute estes comandos no Supabase SQL Editor

-- 1. Verificar estrutura da tabela subscribers
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscribers'
ORDER BY ordinal_position;

-- 2. Verificar se existe constraint de UNIQUE que pode estar causando conflito
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'subscribers';

-- 3. Verificar políticas RLS
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'subscribers'
ORDER BY policyname;

-- 4. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'subscribers';

-- 5. Testar inserção manual na tabela subscribers
-- Execute quando estiver logado no frontend
INSERT INTO public.subscribers (
    user_id, 
    email, 
    stripe_customer_id, 
    subscribed, 
    subscription_tier,
    subscription_start, 
    subscription_end, 
    trial_start, 
    trial_end, 
    created_at, 
    updated_at
) VALUES (
    auth.uid(), 
    (SELECT email FROM auth.users WHERE id = auth.uid()), 
    NULL, 
    true, 
    'Trial',
    NOW(), 
    NOW() + INTERVAL '7 days',
    NOW(), 
    NOW() + INTERVAL '7 days',
    NOW(), 
    NOW()
) RETURNING *;

-- 6. Verificar dados atuais nas tabelas
SELECT 'PROFILES' as table_name, count(*) as count FROM public.profiles
UNION ALL
SELECT 'SUBSCRIBERS' as table_name, count(*) as count FROM public.subscribers;

-- 7. Ver usuários que têm profile mas não têm subscriber
SELECT 
    p.id,
    p.email,
    p.name,
    s.user_id IS NULL as missing_subscriber
FROM public.profiles p
LEFT JOIN public.subscribers s ON p.id = s.user_id
WHERE s.user_id IS NULL;

-- 8. Testar a função diretamente com logs
SELECT public.complete_user_onboarding() as result;
