-- Verificação final do setup de onboarding
-- Execute este script no Supabase SQL Editor para verificar se tudo está configurado

-- 1. Verificar se a função principal existe
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosrc as function_body
FROM pg_proc p
WHERE p.proname IN ('auto_create_user_records_simple', 'create_user_profile_and_subscriber')
ORDER BY p.proname;

-- 2. Verificar políticas RLS na tabela subscribers
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
WHERE tablename = 'subscribers';

-- 3. Verificar estrutura da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela subscribers
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'subscribers' 
ORDER BY ordinal_position;

-- 5. Teste de criação simulada (sem executar de fato)
-- Substitua 'test-user-id' por um ID real para teste
/*
SELECT auto_create_user_records_simple('test-user-id');
*/

COMMENT ON SCHEMA public IS 'Verificação completa do setup de onboarding realizada';
