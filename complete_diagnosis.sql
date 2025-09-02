-- Script completo para diagnóstico
-- Execute cada seção separadamente no Supabase SQL Editor

-- 1. Estrutura da tabela profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Estrutura da tabela subscribers
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscribers'
ORDER BY ordinal_position;

-- 3. Ver alguns registros da tabela profiles (apenas IDs)
SELECT id FROM profiles LIMIT 5;

-- 4. Ver alguns registros da tabela subscribers
SELECT 
    user_id, 
    subscription_tier, 
    trial_end, 
    subscribed,
    email
FROM subscribers 
LIMIT 5;

-- 5. Verificar se o usuário específico existe nas duas tabelas
SELECT 'profiles' as tabela, id FROM profiles 
WHERE id = '273095a8-dfa8-45fd-96c5-db16bf25f4f0'::uuid
UNION ALL
SELECT 'subscribers' as tabela, user_id as id FROM subscribers 
WHERE user_id = '273095a8-dfa8-45fd-96c5-db16bf25f4f0'::uuid;
