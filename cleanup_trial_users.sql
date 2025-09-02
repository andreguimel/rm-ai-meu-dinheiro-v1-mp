-- Script para remover trial de usuários existentes e resetar status de assinatura
-- Execute este script no Supabase Dashboard > SQL Editor

BEGIN;

-- 1. Resetar todos os registros de subscribers que têm trial
UPDATE public.subscribers 
SET 
  subscribed = false,
  subscription_tier = null,
  subscription_start = null,
  subscription_end = null,
  trial_start = null,
  trial_end = null,
  updated_at = NOW()
WHERE 
  subscription_tier = 'Trial' 
  OR trial_start IS NOT NULL 
  OR trial_end IS NOT NULL;

-- 2. Verificar quantos registros foram atualizados
SELECT 
  COUNT(*) as total_subscribers,
  COUNT(CASE WHEN subscribed = true THEN 1 END) as active_subscriptions,
  COUNT(CASE WHEN subscription_tier = 'Trial' THEN 1 END) as trial_subscriptions,
  COUNT(CASE WHEN subscription_tier = 'Premium' THEN 1 END) as premium_subscriptions,
  COUNT(CASE WHEN subscription_tier IS NULL THEN 1 END) as no_subscription
FROM public.subscribers;

-- 3. Log das alterações
SELECT 
  user_id,
  email,
  subscribed,
  subscription_tier,
  trial_start,
  trial_end,
  updated_at
FROM public.subscribers
ORDER BY updated_at DESC
LIMIT 10;

COMMIT;

-- Comentário: Este script remove toda lógica de trial e reseta usuários para "sem assinatura"
-- Apenas usuários com preapproval ativo no MercadoPago terão assinatura ativa
