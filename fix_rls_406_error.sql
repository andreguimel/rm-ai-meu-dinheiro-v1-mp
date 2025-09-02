-- Script para diagnosticar e corrigir problemas de RLS
-- Verificar e recriar políticas que podem estar causando erro 406

-- PRIMEIRO: Verificar estrutura das tabelas
\d profiles;
\d subscribers;

-- Verificar colunas disponíveis na tabela profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Verificar colunas disponíveis na tabela subscribers
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscribers';

-- Primeiro, vamos ver as políticas atuais
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
AND tablename IN ('profiles', 'subscribers')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'subscribers');

-- Dropar e recriar políticas problemáticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recriar políticas para profiles de forma mais permissiva
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Dropar e recriar políticas problemáticas para subscribers  
DROP POLICY IF EXISTS "Users can view own subscription" ON subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscribers;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscribers;

-- Recriar políticas para subscribers de forma mais permissiva
CREATE POLICY "Users can view own subscription" ON subscribers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscribers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON subscribers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verificar se as tabelas existem e têm a estrutura correta
\d profiles;
\d subscribers;

-- Verificar se existem dados para o usuário específico
SELECT 'PROFILES', count(*) as total FROM profiles;
SELECT 'SUBSCRIBERS', count(*) as total FROM subscribers;

-- Verificar o usuário específico que está dando erro
SELECT 
    'USER_CHECK' as info,
    p.id,
    p.email,
    p.full_name,
    p.created_at
FROM profiles p 
WHERE p.id = '273095a8-dfa8-45fd-96c5-db16bf25f4f0'::uuid;

SELECT 
    'SUBSCRIBER_CHECK' as info,
    s.user_id,
    s.email,
    s.subscription_tier,
    s.subscribed,
    s.trial_end,
    s.created_at
FROM subscribers s 
WHERE s.user_id = '273095a8-dfa8-45fd-96c5-db16bf25f4f0'::uuid;
