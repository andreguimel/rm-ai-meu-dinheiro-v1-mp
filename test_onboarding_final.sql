-- Script de teste completo para validar o onboarding
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, aplique a função atualizada
-- (Cole o conteúdo do arquivo final_onboarding_with_correct_schema.sql antes de executar este teste)

-- 2. Teste com um user_id simulado
-- IMPORTANTE: Substitua 'seu-user-id-aqui' por um ID real de usuário para teste
DO $$
DECLARE
    test_user_id uuid := 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; -- Substitua por um ID real
    result json;
BEGIN
    -- Executar a função de onboarding
    SELECT auto_create_user_records_simple(test_user_id) INTO result;
    
    -- Exibir resultado
    RAISE NOTICE 'Resultado do teste: %', result;
END $$;

-- 3. Verificar se os registros foram criados
-- IMPORTANTE: Substitua o UUID abaixo pelo mesmo usado no teste acima

-- Verificar profile criado
SELECT 
    'profiles' as tabela,
    id::text as id,
    created_at,
    updated_at
FROM profiles 
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Verificar subscriber criado
SELECT 
    'subscribers' as tabela,
    user_id::text as id,
    trial_start as created_at,
    trial_end as updated_at
FROM subscribers 
WHERE user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- 4. Verificar detalhes do subscriber criado
SELECT 
    user_id,
    email,
    subscribed,
    subscription_tier,
    trial_start,
    trial_end,
    (trial_end > now()) as trial_ativo
FROM subscribers 
WHERE user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

COMMENT ON SCHEMA public IS 'Teste de onboarding executado';
