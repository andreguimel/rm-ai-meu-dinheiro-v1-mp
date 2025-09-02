-- Script para identificar e corrigir usuários em trial marcados incorretamente como subscribed
-- Execute este SQL no Supabase para diagnosticar e corrigir o problema

-- 1. DIAGNÓSTICO: Verificar usuários em trial marcados como subscribed
SELECT 
  user_id,
  email,
  subscribed,
  subscription_tier,
  trial_start,
  trial_end,
  last_payment_amount,
  last_payment_status,
  updated_at,
  (trial_end > NOW()) as trial_active,
  CASE 
    WHEN subscribed = true AND subscription_tier = 'Trial' AND last_payment_amount IS NULL THEN 'TRIAL_MISLABELED'
    WHEN subscribed = true AND last_payment_amount IS NOT NULL THEN 'PAID_SUBSCRIPTION'
    WHEN subscribed = false AND trial_end > NOW() THEN 'TRIAL_CORRECT'
    WHEN subscribed = false AND (trial_end IS NULL OR trial_end <= NOW()) THEN 'NOT_SUBSCRIBED'
    ELSE 'OTHER'
  END as status_analysis
FROM public.subscribers
ORDER BY updated_at DESC;

-- 2. CORREÇÃO: Corrigir usuários em trial marcados incorretamente como subscribed
-- CUIDADO: Execute apenas após verificar os resultados acima!

-- Descomente as linhas abaixo para aplicar a correção:
/*
UPDATE public.subscribers 
SET 
  subscribed = false,
  updated_at = NOW()
WHERE 
  subscribed = true 
  AND subscription_tier = 'Trial' 
  AND last_payment_amount IS NULL 
  AND trial_end > NOW();
*/

-- 3. VERIFICAÇÃO: Confirmar que a correção foi aplicada
-- Execute após a correção para verificar:
/*
SELECT 
  user_id,
  email,
  subscribed,
  subscription_tier,
  trial_end > NOW() as trial_active,
  last_payment_amount IS NOT NULL as has_payment
FROM public.subscribers
WHERE trial_end > NOW() OR subscribed = true
ORDER BY updated_at DESC;
*/

-- 4. RELATÓRIO: Resumo do status atual
SELECT 
  subscription_tier,
  subscribed,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE trial_end > NOW()) as active_trials,
  COUNT(*) FILTER (WHERE last_payment_amount IS NOT NULL) as with_payments
FROM public.subscribers
GROUP BY subscription_tier, subscribed
ORDER BY subscription_tier, subscribed;
