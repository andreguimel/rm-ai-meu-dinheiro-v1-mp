-- Script para verificar se andreguimel@gmail.com está configurado como administrador

-- 1. Verificar se o usuário existe na tabela auth.users
SELECT 'Verificando usuário na tabela auth.users:' as info;
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'andreguimel@gmail.com';

-- 2. Verificar se o usuário está na tabela admin_users
SELECT 'Verificando usuário na tabela admin_users:' as info;
SELECT au.user_id, au.email, au.active, au.created_at, au.updated_at
FROM admin_users au
WHERE au.email = 'andreguimel@gmail.com';

-- 3. Testar a função is_admin_by_email
SELECT 'Testando função is_admin_by_email:' as info;
SELECT is_admin_by_email('andreguimel@gmail.com') as is_admin_result;

-- 4. Verificar se existe algum admin ativo
SELECT 'Total de admins ativos:' as info;
SELECT COUNT(*) as total_admins 
FROM admin_users 
WHERE active = true;

-- 5. Listar todos os admins ativos
SELECT 'Lista de todos os admins ativos:' as info;
SELECT user_id, email, active, created_at 
FROM admin_users 
WHERE active = true;