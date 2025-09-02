-- Script para corrigir o usuário específico
-- Adicionar o usuário à tabela subscribers com trial de 7 dias

-- Verificar se o usuário existe na tabela subscribers
SELECT 'ANTES - Usuário na tabela subscribers:' as info;
SELECT * FROM subscribers WHERE user_id = '273095a8-dfa8-45fd-96c5-db16bf25f4f0'::uuid;

-- Adicionar o usuário com trial de 7 dias
INSERT INTO subscribers (
    user_id,
    email,
    subscription_tier,
    subscribed,
    trial_start,
    trial_end,
    subscription_start,
    subscription_end,
    created_at,
    updated_at
) VALUES (
    '273095a8-dfa8-45fd-96c5-db16bf25f4f0'::uuid,
    'andreguimel@icloud.com',  -- substitua pelo email correto se necessário
    'Trial',
    true,
    NOW(),
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
) ON CONFLICT (user_id) 
DO UPDATE SET
    subscription_tier = 'Trial',
    subscribed = true,
    trial_start = NOW(),
    trial_end = NOW() + INTERVAL '7 days',
    subscription_start = NOW(),
    subscription_end = NOW() + INTERVAL '7 days',
    updated_at = NOW();

-- Verificar o resultado
SELECT 'DEPOIS - Usuário na tabela subscribers:' as info;
SELECT * FROM subscribers WHERE user_id = '273095a8-dfa8-45fd-96c5-db16bf25f4f0'::uuid;
