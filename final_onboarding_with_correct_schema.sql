-- Função de onboarding atualizada baseada na estrutura real da tabela subscribers
-- Esta função usa os campos exatos que existem na tabela

CREATE OR REPLACE FUNCTION auto_create_user_records_simple(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_email text;
    v_result json;
    v_profile_exists boolean := false;
    v_subscriber_exists boolean := false;
    v_trial_start timestamptz;
    v_trial_end timestamptz;
BEGIN
    -- Log início da função
    RAISE NOTICE 'Iniciando onboarding para user_id: %', p_user_id;
    
    -- Buscar email do usuário autenticado
    SELECT raw_user_meta_data->>'email' INTO v_email
    FROM auth.users 
    WHERE id = p_user_id;
    
    IF v_email IS NULL THEN
        SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
    END IF;
    
    RAISE NOTICE 'Email encontrado: %', v_email;
    
    -- Definir datas do trial (7 dias)
    v_trial_start := now();
    v_trial_end := now() + interval '7 days';
    
    -- Verificar se profile já existe
    SELECT EXISTS(
        SELECT 1 FROM profiles WHERE id = p_user_id
    ) INTO v_profile_exists;
    
    -- Verificar se subscriber já existe
    SELECT EXISTS(
        SELECT 1 FROM subscribers WHERE user_id = p_user_id
    ) INTO v_subscriber_exists;
    
    -- Criar profile se não existir
    IF NOT v_profile_exists THEN
        RAISE NOTICE 'Criando profile para user_id: %', p_user_id;
        
        -- Inserir apenas campos que sabemos que existem
        INSERT INTO profiles (id, created_at, updated_at)
        VALUES (p_user_id, now(), now())
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Profile criado com sucesso';
    ELSE
        RAISE NOTICE 'Profile já existe para user_id: %', p_user_id;
    END IF;
    
    -- Criar subscriber se não existir
    IF NOT v_subscriber_exists THEN
        RAISE NOTICE 'Criando subscriber para user_id: %', p_user_id;
        
        INSERT INTO subscribers (
            user_id,
            email,
            subscribed,
            trial_start,
            trial_end,
            subscription_tier,
            created_at,
            updated_at
        )
        VALUES (
            p_user_id,
            COALESCE(v_email, 'user@example.com'),
            false, -- subscribed = false (em trial)
            v_trial_start,
            v_trial_end,
            'trial', -- subscription_tier = trial
            now(),
            now()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            trial_start = EXCLUDED.trial_start,
            trial_end = EXCLUDED.trial_end,
            subscription_tier = 'trial',
            updated_at = now();
        
        RAISE NOTICE 'Subscriber criado com trial até: %', v_trial_end;
    ELSE
        RAISE NOTICE 'Subscriber já existe para user_id: %', p_user_id;
    END IF;
    
    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'user_id', p_user_id,
        'email', v_email,
        'profile_created', NOT v_profile_exists,
        'subscriber_created', NOT v_subscriber_exists,
        'trial_start', v_trial_start,
        'trial_end', v_trial_end,
        'message', 'Onboarding concluído com sucesso'
    );
    
    RAISE NOTICE 'Resultado final: %', v_result;
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro no onboarding: % %', SQLSTATE, SQLERRM;
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'sqlstate', SQLSTATE,
        'user_id', p_user_id
    );
END;
$$;
