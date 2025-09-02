-- Script simples para verificar o schema das tabelas
-- Execute no SQL Editor do Supabase

-- Ver estrutura da tabela profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Ver estrutura da tabela subscribers  
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscribers'
ORDER BY ordinal_position;

-- Verificar dados existentes (apenas contagens)
SELECT 'profiles' as table_name, count(*) as total_records FROM profiles;
SELECT 'subscribers' as table_name, count(*) as total_records FROM subscribers;

-- Verificar se o usuário específico existe (sem especificar colunas que podem não existir)
SELECT * FROM profiles WHERE id = '273095a8-dfa8-45fd-96c5-db16bf25f4f0'::uuid;
