-- Script para encontrar todas as tabelas relacionadas a subscription/trial
-- Execute este script no Supabase SQL Editor

-- 1. Buscar todas as tabelas que contêm colunas relacionadas a subscription
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name ILIKE '%subscription%' 
   OR column_name ILIKE '%trial%'
   OR column_name ILIKE '%premium%'
   OR column_name ILIKE '%plan%'
ORDER BY table_name, column_name;

-- 2. Listar todas as tabelas públicas disponíveis
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Verificar se existe tabela profiles com dados de subscription
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Se existir, verificar dados da tabela profiles
-- SELECT * FROM profiles WHERE id IN (
--     SELECT id FROM auth.users WHERE email = 'andreguimel@icloud.com'
-- );

COMMENT ON SCHEMA public IS 'Investigação de tabelas relacionadas a subscription concluída';
