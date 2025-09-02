-- Script para investigar os dados da tabela subscribers
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura da tabela subscribers
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'subscribers' 
ORDER BY ordinal_position;

-- 2. Verificar todos os subscribers (últimos 10)
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
        WHEN trial_end IS NULL THEN 'Sem trial'
        WHEN trial_end > now() THEN 'Trial ativo'
        ELSE 'Trial expirado'
    END as status_trial
FROM subscribers 
ORDER BY updated_at DESC 
LIMIT 10;

-- 3. Buscar especificamente pelo seu user_id
-- Usando o user_id real: d45e1bfa-0d58-4112-a689-9f8ffdc20511
SELECT 
    user_id,
    email,
    subscribed,
    subscription_tier,
    subscription_start,
    subscription_end,
    trial_start,
    trial_end,
    payment_method_type,
    last_payment_status,
    created_at,
    updated_at,
    (trial_end > now()) as trial_ativo,
    CASE 
        WHEN trial_end > now() THEN 
            CEIL(EXTRACT(epoch FROM (trial_end - now())) / 86400)
        ELSE 0
    END as dias_restantes
FROM subscribers 
WHERE email = 'andreguimel@icloud.com'
   OR user_id = 'd45e1bfa-0d58-4112-a689-9f8ffdc20511';

-- 4. Verificar dados de auth.users também
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'andreguimel@icloud.com';

COMMENT ON SCHEMA public IS 'Debug da tabela subscribers executado';
