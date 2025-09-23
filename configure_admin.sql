-- Script para configurar andreguimel@gmail.com como administrador

-- 1. Primeiro, obter o ID do usuário da tabela auth.users
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Buscar o ID do usuário
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'andreguimel@gmail.com';
    
    IF user_uuid IS NULL THEN
        RAISE NOTICE 'ERRO: Usuário andreguimel@gmail.com não encontrado na tabela auth.users';
    ELSE
        RAISE NOTICE 'Usuário encontrado com ID: %', user_uuid;
        
        -- Verificar se já existe na tabela admin_users
        IF EXISTS (SELECT 1 FROM admin_users WHERE email = 'andreguimel@gmail.com') THEN
            -- Atualizar para garantir que está ativo
            UPDATE admin_users 
            SET active = true, updated_at = NOW()
            WHERE email = 'andreguimel@gmail.com';
            RAISE NOTICE 'Usuário já existia na tabela admin_users - atualizado para ativo';
        ELSE
            -- Inserir novo admin
            INSERT INTO admin_users (user_id, email, active, created_at, updated_at)
            VALUES (user_uuid, 'andreguimel@gmail.com', true, NOW(), NOW());
            RAISE NOTICE 'Usuário inserido na tabela admin_users como administrador ativo';
        END IF;
    END IF;
END $$;

-- 2. Verificar se a configuração foi bem-sucedida
SELECT 'Verificação final:' as info;
SELECT au.user_id, au.email, au.active, au.created_at, au.updated_at
FROM admin_users au
WHERE au.email = 'andreguimel@gmail.com';

-- 3. Testar as funções de admin
SELECT 'Teste da função is_admin_by_email:' as info;
SELECT is_admin_by_email('andreguimel@gmail.com') as is_admin_result;