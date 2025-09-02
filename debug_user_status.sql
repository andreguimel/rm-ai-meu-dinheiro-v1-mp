-- Debug: Verificar status do usuário atual
-- Buscar usuário mais recente (provavelmente o que acabou de se cadastrar)

SELECT 
    'PROFILES' as table_name,
    p.id,
    p.email,
    p.full_name,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 5;

SELECT 
    'SUBSCRIBERS' as table_name,
    s.user_id,
    s.email,
    s.subscription_tier,
    s.subscribed,
    s.trial_start,
    s.trial_end,
    s.trial_days_remaining,
    s.subscription_start,
    s.subscription_end,
    s.created_at,
    s.updated_at,
    -- Calcular dias restantes do trial manualmente
    CASE 
        WHEN s.trial_end IS NOT NULL THEN
            GREATEST(0, EXTRACT(DAY FROM (s.trial_end::timestamp - NOW())))
        ELSE 0
    END as calculated_trial_days
FROM subscribers s
ORDER BY s.created_at DESC
LIMIT 5;

-- Verificar se existe usuário com email específico
SELECT 
    'USER_SEARCH' as info,
    s.user_id,
    s.email,
    s.subscription_tier,
    s.subscribed,
    s.trial_end,
    CASE 
        WHEN s.trial_end IS NOT NULL THEN
            GREATEST(0, EXTRACT(DAY FROM (s.trial_end::timestamp - NOW())))
        ELSE 0
    END as calculated_trial_days
FROM subscribers s
WHERE s.email = 'andreguimel@icloud.com'
   OR s.email ILIKE '%andre%'
ORDER BY s.created_at DESC;
