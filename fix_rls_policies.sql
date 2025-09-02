-- VERIFICAR E CORRIGIR POLÍTICAS RLS PARA SUBSCRIBERS
-- Execute estes comandos no Supabase SQL Editor

-- 1. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'subscribers';

-- 2. Listar todas as políticas existentes
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

-- 3. Remover políticas conflitantes (se existirem)
-- DROP POLICY IF EXISTS "Users can ensure their own trial" ON public.subscribers;

-- 4. Criar política correta para INSERT
DROP POLICY IF EXISTS "Users can ensure their own trial" ON public.subscribers;

CREATE POLICY "Allow trial creation for authenticated users" 
ON public.subscribers
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 5. Criar política para SELECT (permitir usuários verem seus próprios dados)
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscribers;

CREATE POLICY "Users can view own subscription" 
ON public.subscribers
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- 6. Criar política para UPDATE (permitir usuários atualizarem seus próprios dados)
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;

CREATE POLICY "Users can update own subscription" 
ON public.subscribers
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 7. Verificar se as políticas foram criadas corretamente
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

-- 8. Teste de inserção manual (execute quando logado no frontend)
-- INSERT INTO public.subscribers (
--     user_id, 
--     email, 
--     subscribed, 
--     subscription_tier, 
--     trial_start, 
--     trial_end, 
--     created_at, 
--     updated_at
-- ) VALUES (
--     auth.uid(), 
--     (SELECT email FROM auth.users WHERE id = auth.uid()), 
--     true, 
--     'Trial', 
--     NOW(), 
--     NOW() + INTERVAL '7 days', 
--     NOW(), 
--     NOW()
-- ) RETURNING *;
