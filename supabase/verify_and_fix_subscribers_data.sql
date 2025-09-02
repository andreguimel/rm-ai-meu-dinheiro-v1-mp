-- SQL para verificar e corrigir dados de assinatura inconsistentes
-- Execute este script manualmente no Supabase para limpar dados de outros usuários

-- 1. Verificar se há registros duplicados por user_id
SELECT 
  user_id, 
  email,
  COUNT(*) as count,
  array_agg(id) as record_ids
FROM public.subscribers 
GROUP BY user_id, email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Verificar se há inconsistências entre user_id e dados de pagamento
SELECT 
  id,
  user_id,
  email,
  subscription_tier,
  subscribed,
  last_payment_status,
  stripe_customer_id,
  updated_at
FROM public.subscribers 
WHERE subscribed = true 
  AND subscription_tier IS NOT NULL
ORDER BY updated_at DESC;

-- 3. Para limpar possíveis inconsistências (EXECUTE APENAS SE NECESSÁRIO):
-- CUIDADO: Este comando remove dados. Execute apenas se identificar problemas.

-- Remover registros duplicados mantendo apenas o mais recente por user_id
/*
DELETE FROM public.subscribers 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM public.subscribers 
  ORDER BY user_id, updated_at DESC
);
*/

-- 4. Verificar integridade dos dados após limpeza
SELECT 
  COUNT(*) as total_subscribers,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE subscribed = true) as active_subscriptions,
  COUNT(*) FILTER (WHERE trial_end > NOW()) as active_trials
FROM public.subscribers;

-- 5. Verificar se há users órfãos (sem registro na tabela auth.users)
SELECT s.user_id, s.email, s.subscription_tier
FROM public.subscribers s
LEFT JOIN auth.users u ON s.user_id = u.id
WHERE u.id IS NULL;

-- 6. Log de auditoria: verificar últimas alterações
SELECT 
  user_id,
  email,
  subscription_tier,
  subscribed,
  updated_at,
  (updated_at > NOW() - INTERVAL '1 hour') as recent_update
FROM public.subscribers 
ORDER BY updated_at DESC 
LIMIT 20;
