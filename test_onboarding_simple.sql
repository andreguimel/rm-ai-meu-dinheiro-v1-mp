-- Script de teste simplificado para validar o onboarding
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, aplique a função atualizada executando o arquivo:
-- final_onboarding_with_correct_schema.sql

-- 2. Teste com um user_id real
-- IMPORTANTE: Substitua pelo ID de um usuário real do seu sistema
SELECT auto_create_user_records_simple('f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid);

-- 3. Verificar profile criado
SELECT 
    'Profile criado:' as status,
    id,
    created_at,
    updated_at
FROM profiles 
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- 4. Verificar subscriber criado
SELECT 
    'Subscriber criado:' as status,
    user_id,
    email,
    subscribed,
    subscription_tier,
    trial_start,
    trial_end,
    (trial_end > now()) as trial_ativo
FROM subscribers 
WHERE user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- 5. Verificar todos os subscribers (últimos 5)
SELECT 
    'Últimos subscribers:' as info,
    user_id,
    email,
    subscription_tier,
    trial_start,
    (trial_end > now()) as trial_ativo
FROM subscribers 
ORDER BY created_at DESC 
LIMIT 5;
