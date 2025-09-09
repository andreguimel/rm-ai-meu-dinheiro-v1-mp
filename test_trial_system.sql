-- Script de Teste do Sistema de Trial
-- Execute este script após aplicar as migrações para testar o funcionamento

-- 1. Verificar se as funções foram criadas
SELECT 
  'Functions created:' as status,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'ensure_user_has_trial',
  'create_subscriber_trial',
  'get_user_access_status',
  'debug_user_trial_status'
);

-- 2. Verificar estrutura da tabela subscribers
SELECT 
  'Subscribers table structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscribers' 
AND column_name IN ('trial_start', 'trial_end', 'trial_active', 'subscribed', 'subscription_tier')
ORDER BY column_name;

-- 3. Testar com um usuário fictício (substitua pelo UUID real de um usuário)
-- IMPORTANTE: Substitua 'your-user-uuid-here' por um UUID real de usuário

-- Exemplo de como testar (descomente e substitua o UUID):
/*
-- Verificar status atual do usuário
SELECT * FROM debug_user_trial_status('your-user-uuid-here'::UUID);

-- Tentar criar trial
SELECT ensure_user_has_trial('your-user-uuid-here'::UUID) as trial_created;

-- Verificar status após criação
SELECT * FROM get_user_access_status('your-user-uuid-here'::UUID);

-- Ver dados do subscriber
SELECT 
  user_id,
  email,
  subscription_tier,
  subscribed,
  trial_start,
  trial_end,
  trial_active
FROM subscribers 
WHERE user_id = 'your-user-uuid-here'::UUID;
*/

-- 4. Verificar quantos subscribers existem com trial
SELECT 
  'Trial Statistics:' as info,
  COUNT(*) as total_subscribers,
  COUNT(CASE WHEN trial_start IS NOT NULL THEN 1 END) as with_trial_history,
  COUNT(CASE WHEN trial_active = true THEN 1 END) as active_trials,
  COUNT(CASE WHEN subscribed = true AND subscription_tier != 'Trial' THEN 1 END) as paid_subscribers
FROM subscribers;

-- 5. Ver exemplos de subscribers (dados anonimizados)
SELECT 
  'Sample subscribers:' as info,
  LEFT(user_id::text, 8) || '...' as user_id_partial,
  subscription_tier,
  subscribed,
  trial_start IS NOT NULL as has_trial,
  trial_active,
  CASE 
    WHEN trial_end IS NOT NULL AND trial_end > NOW() THEN
      CEIL(EXTRACT(epoch FROM (trial_end - NOW())) / 86400)::INTEGER
    ELSE 0
  END as days_remaining
FROM subscribers 
ORDER BY created_at DESC
LIMIT 5;

-- 6. Verificar se há problemas de lógica
SELECT 
  'Logic check:' as info,
  COUNT(*) as problematic_records
FROM subscribers 
WHERE subscription_tier = 'Trial' 
  AND subscribed = true  -- Trial users should NOT be subscribed
  AND trial_start IS NOT NULL;

-- Se o resultado acima for > 0, há registros problemáticos que precisam ser corrigidos