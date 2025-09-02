-- Teste da função de onboarding para o usuário mais recente
-- Este script simula o que deveria acontecer no signup

-- 1. Buscar o usuário mais recente
DO $$
DECLARE
    latest_user_id uuid;
    latest_user_email text;
    onboarding_result text;
BEGIN
    -- Buscar o usuário mais recente da tabela profiles
    SELECT id, email INTO latest_user_id, latest_user_email 
    FROM profiles 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF latest_user_id IS NOT NULL THEN
        RAISE NOTICE 'Usuário mais recente encontrado: % (%)', latest_user_email, latest_user_id;
        
        -- Verificar se já existe na tabela subscribers
        IF EXISTS(SELECT 1 FROM subscribers WHERE user_id = latest_user_id) THEN
            RAISE NOTICE 'Usuário já existe na tabela subscribers';
            
            -- Mostrar dados atuais do subscriber
            SELECT CONCAT(
                'Tier: ', subscription_tier, 
                ', Trial End: ', trial_end,
                ', Subscribed: ', subscribed,
                ', Created: ', created_at
            ) INTO onboarding_result
            FROM subscribers 
            WHERE user_id = latest_user_id;
            
            RAISE NOTICE 'Dados atuais do subscriber: %', onboarding_result;
        ELSE
            RAISE NOTICE 'Usuário NÃO existe na tabela subscribers - executando onboarding...';
            
            -- Executar a função de onboarding
            SELECT auto_create_user_records_simple(latest_user_id) INTO onboarding_result;
            RAISE NOTICE 'Resultado do onboarding: %', onboarding_result;
            
            -- Verificar resultado após onboarding
            SELECT CONCAT(
                'Tier: ', subscription_tier, 
                ', Trial End: ', trial_end,
                ', Subscribed: ', subscribed,
                ', Created: ', created_at
            ) INTO onboarding_result
            FROM subscribers 
            WHERE user_id = latest_user_id;
            
            RAISE NOTICE 'Dados após onboarding: %', onboarding_result;
        END IF;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado na tabela profiles';
    END IF;
END $$;
