-- TESTE DIRETO COM USER_ID ESPECÍFICO
-- Execute no Supabase SQL Editor

-- 1. Primeiro, veja os usuários disponíveis
SELECT 
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data->>'name' as name,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'CONFIRMADO ✅'
        ELSE 'NÃO CONFIRMADO ❌'
    END as status_email
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Pegue um user_id da consulta acima e teste a função
-- Substitua 'SEU_USER_ID_AQUI' por um ID real da consulta acima
-- SELECT public.auto_create_user_records('SEU_USER_ID_AQUI');

-- 3. Ou teste com todos os usuários confirmados de uma vez
SELECT 
    u.id,
    u.email,
    public.auto_create_user_records(u.id) as resultado
FROM auth.users u
WHERE u.email_confirmed_at IS NOT NULL
ORDER BY u.created_at DESC
LIMIT 3;

-- 4. Verificar resultados nas tabelas
SELECT 'PROFILES:' as tabela, COUNT(*) as total FROM public.profiles
UNION ALL
SELECT 'SUBSCRIBERS:' as tabela, COUNT(*) as total FROM public.subscribers;

-- 5. Ver detalhes dos registros criados
SELECT 
    'PROFILES' as tipo,
    p.id,
    p.email,
    p.name,
    p.organization_name
FROM public.profiles p
ORDER BY p.updated_at DESC
LIMIT 5;

SELECT 
    'SUBSCRIBERS' as tipo,
    s.user_id,
    s.email,
    s.subscription_tier,
    s.trial_start,
    s.trial_end
FROM public.subscribers s
ORDER BY s.created_at DESC
LIMIT 5;
