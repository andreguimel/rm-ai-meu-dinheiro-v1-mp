-- Script para configurar andreguimel@gmail.com como administrador
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Verificar se o usuário existe na auth.users
SELECT 'Verificando usuário na auth.users:' as info;
SELECT id, email FROM auth.users WHERE email = 'andreguimel@gmail.com';

-- 2. Inserir na tabela admin_users se não existir
INSERT INTO public.admin_users (user_id, email, active) 
SELECT 
    au.id,
    'andreguimel@gmail.com',
    true
FROM auth.users au
WHERE au.email = 'andreguimel@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET 
    active = true,
    updated_at = NOW();

-- 3. Verificar se foi inserido/atualizado
SELECT 'Status final do admin:' as info;
SELECT * FROM public.admin_users WHERE email = 'andreguimel@gmail.com';

-- 4. Testar função is_admin
SELECT 'Teste da função is_admin:' as info;
SELECT public.is_admin_by_email('andreguimel@gmail.com') as is_admin_result;