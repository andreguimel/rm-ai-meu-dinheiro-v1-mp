-- FUNÇÃO SIMPLES E GARANTIDA PARA CRIAR REGISTROS
-- Execute este SQL no Supabase SQL Editor

-- 1. Primeiro, vamos ver as estruturas das tabelas
SELECT 'VERIFICANDO ESTRUTURAS:' as info;

SELECT 
    'PROFILES' as tabela,
    column_name as coluna,
    data_type as tipo
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT 
    'SUBSCRIBERS' as tabela,
    column_name as coluna,
    data_type as tipo
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'subscribers'
ORDER BY ordinal_position;

-- 2. Função simples que funciona
CREATE OR REPLACE FUNCTION public.create_user_profile_and_subscriber(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
    user_name TEXT;
    organization_name TEXT;
    telefone TEXT;
    user_confirmed BOOLEAN;
    result_msg TEXT := '';
BEGIN
    -- Pegar dados do usuário
    SELECT 
        email, 
        email_confirmed_at IS NOT NULL,
        COALESCE(raw_user_meta_data->>'name', 'Usuário'),
        COALESCE(raw_user_meta_data->>'organization_name', 'Minha Empresa'),
        COALESCE(raw_user_meta_data->>'telefone', '')
    INTO user_email, user_confirmed, user_name, organization_name, telefone
    FROM auth.users 
    WHERE id = user_uuid;
    
    -- Verificações básicas
    IF user_email IS NULL THEN
        RETURN 'ERRO: Usuário não encontrado';
    END IF;
    
    IF NOT user_confirmed THEN
        RETURN 'ERRO: Email não confirmado';
    END IF;
    
    -- 1. Criar/atualizar profile (SEM coluna email)
    BEGIN
        INSERT INTO public.profiles (
            id, name, organization_name, telefone, updated_at
        ) VALUES (
            user_uuid, user_name, organization_name, telefone, NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            organization_name = EXCLUDED.organization_name,
            telefone = EXCLUDED.telefone,
            updated_at = NOW();
        
        result_msg := result_msg || 'Profile: SUCESSO; ';
        
    EXCEPTION WHEN OTHERS THEN
        result_msg := result_msg || 'Profile: ERRO - ' || SQLERRM || '; ';
    END;
    
    -- 2. Criar subscriber (COM coluna email)
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM public.subscribers WHERE user_id = user_uuid) THEN
            INSERT INTO public.subscribers (
                user_id, email, subscribed, subscription_tier,
                trial_start, trial_end, created_at, updated_at
            ) VALUES (
                user_uuid, user_email, true, 'Trial',
                NOW(), NOW() + INTERVAL '7 days', NOW(), NOW()
            );
            
            result_msg := result_msg || 'Subscriber: CRIADO; ';
        ELSE
            result_msg := result_msg || 'Subscriber: JÁ EXISTE; ';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        result_msg := result_msg || 'Subscriber: ERRO - ' || SQLERRM || '; ';
    END;
    
    RETURN result_msg;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile_and_subscriber(UUID) TO authenticated;

-- 4. Função que retorna JSON (para o frontend)
CREATE OR REPLACE FUNCTION public.auto_create_user_records_simple(user_uuid UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id UUID;
    result_text TEXT;
    success_status BOOLEAN;
BEGIN
    -- Usar parâmetro ou auth.uid()
    current_user_id := COALESCE(user_uuid, auth.uid());
    
    IF current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Usuário não autenticado'
        );
    END IF;
    
    -- Chamar função que faz o trabalho
    result_text := public.create_user_profile_and_subscriber(current_user_id);
    
    -- Determinar sucesso baseado no resultado
    success_status := (result_text LIKE '%Profile: SUCESSO%') AND 
                     (result_text LIKE '%Subscriber: CRIADO%' OR result_text LIKE '%Subscriber: JÁ EXISTE%');
    
    RETURN json_build_object(
        'success', success_status,
        'user_id', current_user_id,
        'message', result_text,
        'timestamp', NOW()
    );
END;
$$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION public.auto_create_user_records_simple(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_create_user_records_simple() TO authenticated;

-- 6. Teste (descomente para testar)
-- SELECT public.auto_create_user_records_simple();
