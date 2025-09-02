-- SOLUÇÃO: Criar registro de trial para o usuário
-- Execute este script no Supabase SQL Editor

-- 1. Executar função de onboarding primeiro
SELECT auto_create_user_records_simple('d45e1bfa-0d58-4112-a689-9f8ffdc20511'::uuid);

-- 2. Verificar se foi criado
SELECT 
    'Verificação após onboarding:' as info,
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

-- 3. Se não criou, vamos inserir manualmente
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

-- 4. Resultado final - seu trial ativo
SELECT 
    '🎁 SEU TRIAL CONFIGURADO:' as status,
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
    END as dias_restantes,
    'Trial de 7 dias criado com sucesso!' as mensagem
FROM subscribers 
WHERE user_id = 'd45e1bfa-0d58-4112-a689-9f8ffdc20511';

COMMENT ON SCHEMA public IS 'Trial configurado para usuário específico';
