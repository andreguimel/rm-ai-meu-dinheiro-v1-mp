-- Teste específico da função de onboarding com user_id real
-- Execute este script no Supabase SQL Editor

-- 1. Testar a função de onboarding para garantir que o trial foi criado
SELECT auto_create_user_records_simple('d45e1bfa-0d58-4112-a689-9f8ffdc20511'::uuid);

-- 2. Verificar se foi criado/atualizado na tabela subscribers
SELECT 
    user_id,
    email,
    subscribed,
    subscription_tier,
    trial_start,
    trial_end,
    created_at,
    updated_at,
    (trial_end > now()) as trial_ativo,
    CASE 
        WHEN trial_end > now() THEN 
            CEIL(EXTRACT(epoch FROM (trial_end - now())) / 86400)
        ELSE 0
    END as dias_restantes
FROM subscribers 
WHERE user_id = 'd45e1bfa-0d58-4112-a689-9f8ffdc20511';

-- 3. Verificar se existe na tabela profiles também
SELECT 
    id,
    created_at,
    updated_at
FROM profiles 
WHERE id = 'd45e1bfa-0d58-4112-a689-9f8ffdc20511';

-- 4. Se não existir subscriber, vamos criar manualmente com trial
INSERT INTO subscribers (
    user_id,
    email,
    subscribed,
    subscription_tier,
    trial_start,
    trial_end,
    created_at,
    updated_at
)
VALUES (
    'd45e1bfa-0d58-4112-a689-9f8ffdc20511',
    'andreguimel@icloud.com',
    true,
    'Trial',
    now(),
    now() + interval '7 days',
    now(),
    now()
)
ON CONFLICT (user_id) DO UPDATE SET
    subscription_tier = 'Trial',
    trial_start = now(),
    trial_end = now() + interval '7 days',
    subscribed = true,
    updated_at = now();

-- 5. Verificar resultado final
SELECT 
    'Resultado final:' as info,
    user_id,
    email,
    subscribed,
    subscription_tier,
    trial_start,
    trial_end,
    (trial_end > now()) as trial_ativo,
    CASE 
        WHEN trial_end > now() THEN 
            CEIL(EXTRACT(epoch FROM (trial_end - now())) / 86400)
        ELSE 0
    END as dias_restantes
FROM subscribers 
WHERE user_id = 'd45e1bfa-0d58-4112-a689-9f8ffdc20511';

COMMENT ON SCHEMA public IS 'Teste específico de onboarding executado';
