-- SCRIPT PARA DEBUGAR ACESSO DE ADMINISTRADOR
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário existe na tabela auth.users
SELECT 
    'VERIFICANDO USUÁRIO NA AUTH.USERS:' as info;

SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'andreguimel@gmail.com';

-- 2. Verificar se a tabela admin_users existe
SELECT 
    'VERIFICANDO SE TABELA ADMIN_USERS EXISTE:' as info;

SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'admin_users';

-- 3. Verificar estrutura da tabela admin_users
SELECT 
    'ESTRUTURA DA TABELA ADMIN_USERS:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'admin_users'
ORDER BY ordinal_position;

-- 4. Verificar se o usuário está na tabela admin_users
SELECT 
    'VERIFICANDO USUÁRIO NA TABELA ADMIN_USERS:' as info;

SELECT 
    id,
    user_id,
    email,
    active,
    created_at,
    updated_at
FROM public.admin_users 
WHERE email = 'andreguimel@gmail.com';

-- 5. Verificar se a função is_admin existe
SELECT 
    'VERIFICANDO SE FUNÇÃO IS_ADMIN EXISTE:' as info;

SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'is_admin';

-- 6. Testar a função is_admin_by_email
SELECT 
    'TESTANDO FUNÇÃO IS_ADMIN_BY_EMAIL:' as info;

SELECT public.is_admin_by_email('andreguimel@gmail.com') as is_admin_result;

-- 7. Se o usuário não estiver na admin_users, inserir
INSERT INTO public.admin_users (user_id, email, active) 
SELECT 
    au.id,
    'andreguimel@gmail.com',
    true
FROM auth.users au
WHERE au.email = 'andreguimel@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE email = 'andreguimel@gmail.com'
);

-- 8. Garantir que o usuário está ativo
UPDATE public.admin_users 
SET 
    active = true,
    updated_at = NOW()
WHERE email = 'andreguimel@gmail.com';

-- 9. Verificação final
SELECT 
    'VERIFICAÇÃO FINAL - STATUS DO ADMIN:' as status;

SELECT 
    au.id,
    au.user_id,
    au.email,
    au.active,
    au.created_at,
    au.updated_at,
    u.email as auth_email,
    u.id as auth_user_id
FROM public.admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'andreguimel@gmail.com';

-- 10. Teste final da função is_admin_by_email
SELECT 
    'TESTE FINAL DA FUNÇÃO IS_ADMIN_BY_EMAIL:' as final_test;

SELECT public.is_admin_by_email('andreguimel@gmail.com') as final_is_admin_result;