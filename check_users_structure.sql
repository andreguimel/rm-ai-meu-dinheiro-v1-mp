-- Script para verificar e corrigir a estrutura de usuários
-- Descobrir onde está o usuário específico

-- 1. Verificar tabela auth.users (onde ficam os usuários do Supabase Auth)
SELECT 'Usuário na tabela auth.users:' as info;
SELECT id, email, created_at FROM auth.users 
WHERE id = '273095a8-dfa8-45fd-96c5-db16bf25f4f0'::uuid;

-- 2. Verificar se existe uma tabela users no schema public
SELECT 'Estrutura da tabela public.users:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Ver todos os usuários na tabela auth.users (apenas IDs e emails)
SELECT 'Todos os usuários em auth.users:' as info;
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- 4. Ver constraint da foreign key
SELECT 'Foreign key constraints da tabela subscribers:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'subscribers';
