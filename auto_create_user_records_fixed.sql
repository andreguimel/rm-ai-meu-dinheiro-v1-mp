-- VERIFICAR ESTRUTURA DAS TABELAS ANTES DE CRIAR A FUNÇÃO
-- Execute primeiro para ver quais colunas existem

-- 1. Estrutura da tabela profiles
SELECT 
    'PROFILES' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_nulo
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Estrutura da tabela subscribers
SELECT 
    'SUBSCRIBERS' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_nulo
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'subscribers'
ORDER BY ordinal_position;

-- 3. Função corrigida baseada na estrutura real
CREATE OR REPLACE FUNCTION public.auto_create_user_records_fixed(input_user_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id UUID;
    current_user_email TEXT;
    user_name TEXT;
    organization_name TEXT;
    telefone TEXT;
    user_confirmed BOOLEAN;
    profile_status TEXT := 'not_attempted';
    subscriber_status TEXT := 'not_attempted';
    profile_columns TEXT[];
    subscriber_columns TEXT[];
    result JSON;
BEGIN
    -- Usar parâmetro se fornecido, senão auth.uid()
    current_user_id := COALESCE(input_user_id, auth.uid());
    
    IF current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Usuário não autenticado'
        );
    END IF;
    
    -- Pegar dados do usuário
    SELECT 
        email, 
        email_confirmed_at IS NOT NULL,
        COALESCE(raw_user_meta_data->>'name', 'Usuário'),
        COALESCE(raw_user_meta_data->>'organization_name', 'Minha Empresa'),
        COALESCE(raw_user_meta_data->>'telefone', '')
    INTO current_user_email, user_confirmed, user_name, organization_name, telefone
    FROM auth.users 
    WHERE id = current_user_id;
    
    -- Verificar se usuário foi encontrado
    IF current_user_email IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Usuário não encontrado',
            'user_id', current_user_id
        );
    END IF;
    
    -- Verificar se email está confirmado
    IF NOT user_confirmed THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Email não confirmado',
            'user_id', current_user_id,
            'email', current_user_email
        );
    END IF;
    
    -- Verificar colunas da tabela profiles
    SELECT array_agg(column_name) INTO profile_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles';
    
    -- Verificar colunas da tabela subscribers
    SELECT array_agg(column_name) INTO subscriber_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscribers';
    
    -- 1. Criar/atualizar profile (apenas com colunas que existem)
    BEGIN
        IF 'email' = ANY(profile_columns) THEN
            -- Profile tem coluna email
            INSERT INTO public.profiles (
                id, email, name, organization_name, telefone, updated_at
            ) VALUES (
                current_user_id, current_user_email, user_name, organization_name, telefone, NOW()
            ) ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                name = EXCLUDED.name,
                organization_name = EXCLUDED.organization_name,
                telefone = EXCLUDED.telefone,
                updated_at = NOW();
        ELSE
            -- Profile NÃO tem coluna email
            INSERT INTO public.profiles (
                id, name, organization_name, telefone, updated_at
            ) VALUES (
                current_user_id, user_name, organization_name, telefone, NOW()
            ) ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                organization_name = EXCLUDED.organization_name,
                telefone = EXCLUDED.telefone,
                updated_at = NOW();
        END IF;
        
        profile_status := 'success';
        
    EXCEPTION WHEN OTHERS THEN
        profile_status := 'error: ' || SQLERRM;
    END;
    
    -- 2. Criar subscriber com trial
    BEGIN
        -- Verificar se já existe
        IF EXISTS (SELECT 1 FROM public.subscribers WHERE user_id = current_user_id) THEN
            subscriber_status := 'already_exists';
        ELSE
            INSERT INTO public.subscribers (
                user_id, email, subscribed, subscription_tier,
                trial_start, trial_end, created_at, updated_at
            ) VALUES (
                current_user_id, current_user_email, true, 'Trial',
                NOW(), NOW() + INTERVAL '7 days', NOW(), NOW()
            );
            
            subscriber_status := 'created';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        subscriber_status := 'error: ' || SQLERRM;
    END;
    
    -- Retornar resultado
    result := json_build_object(
        'success', profile_status = 'success' AND (subscriber_status = 'created' OR subscriber_status = 'already_exists'),
        'user_id', current_user_id,
        'email', current_user_email,
        'profile_status', profile_status,
        'subscriber_status', subscriber_status,
        'profile_columns', profile_columns,
        'subscriber_columns', subscriber_columns,
        'trial_end', (NOW() + INTERVAL '7 days')::text
    );
    
    RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.auto_create_user_records_fixed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_create_user_records_fixed() TO authenticated;

-- Testar a função corrigida (descomente para testar)
-- SELECT public.auto_create_user_records_fixed();
