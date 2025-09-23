-- Script para verificar e configurar usuário como administrador
-- Execute este script no dashboard do Supabase (SQL Editor)

-- 1. Primeiro, verificar se o usuário já está na tabela admin_users
SELECT 
    'Status atual na tabela admin_users:' as info;
    
SELECT 
    id,
    user_id,
    email,
    active,
    created_at,
    updated_at
FROM admin_users 
WHERE email = 'andreguimel@gmail.com';

-- 2. Verificar se o usuário existe na tabela auth.users
SELECT 
    'Status na tabela auth.users:' as info;
    
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'andreguimel@gmail.com';

-- 3. Inserir o usuário na tabela admin_users (se não existir)
-- Isso irá buscar o user_id da tabela auth.users automaticamente
INSERT INTO admin_users (user_id, email, active) 
SELECT 
    au.id,
    'andreguimel@gmail.com',
    true
FROM auth.users au
WHERE au.email = 'andreguimel@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM admin_users WHERE email = 'andreguimel@gmail.com'
);

-- 4. Se o usuário já existir na admin_users, garantir que está ativo
UPDATE admin_users 
SET 
    active = true,
    updated_at = NOW()
WHERE email = 'andreguimel@gmail.com';

-- 5. Verificar se as alterações foram aplicadas
SELECT 
    'Configuração finalizada - Status do usuário admin:' as status;
    
SELECT 
    au.id,
    au.user_id,
    au.email,
    au.active,
    au.created_at,
    au.updated_at,
    u.email as auth_email
FROM admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'andreguimel@gmail.com';

-- 6. Testar as funções de verificação de admin
SELECT 
    'Teste das funções de admin:' as info;

SELECT 
    is_admin_by_email('andreguimel@gmail.com') as is_admin_by_email_result;

-- 7. Se o usuário existir na auth.users, testar também por user_id
SELECT 
    is_admin(u.id) as is_admin_by_user_id_result
FROM auth.users u
WHERE u.email = 'andreguimel@gmail.com';