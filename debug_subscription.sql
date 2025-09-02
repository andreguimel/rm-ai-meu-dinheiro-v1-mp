-- Script para diagnosticar problema de assinatura
-- Verificar se usuário está na tabela admin_users

-- 1. Verificar se a tabela admin_users existe e tem dados
SELECT 'admin_users table data:' as info;
SELECT * FROM admin_users LIMIT 5;

-- 2. Verificar se o usuário atual está como admin
SELECT 'is_admin check for current user:' as info;
SELECT is_admin() as is_current_user_admin;

-- 3. Verificar dados de assinatura do usuário atual
SELECT 'subscribers table for current user:' as info;
SELECT * FROM subscribers WHERE user_id = auth.uid();

-- 4. Verificar se existe algum admin
SELECT 'total admins count:' as info;
SELECT COUNT(*) as total_admins FROM admin_users WHERE active = true;
