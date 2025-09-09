-- Diagnóstico Completo do Sistema de Trial
-- Execute este script para verificar o estado atual do sistema

-- 1. Verificar se as tabelas existem
SELECT 
  'subscribers' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'subscribers') as exists
UNION ALL
SELECT 
  'trial_events' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'trial_events') as exists;

-- 2. Verificar estrutura da tabela subscribers
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'subscribers' 
ORDER BY ordinal_position;

-- 3. Verificar se a coluna trial_active existe (computed column)
SELECT 
  column_name,
  data_type,
  generation_expression
FROM information_schema.columns 
WHERE table_name = 'subscribers' 
AND column_name = 'trial_active';

-- 4. Verificar funções existentes
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'ensure_user_has_trial',
  'create_subscriber_trial',
  'get_user_access_status',
  'debug_user_trial_status',
  'log_trial_event'
)
ORDER BY routine_name;

-- 5. Verificar dados na tabela subscribers
SELECT 
  COUNT(*) as total_subscribers,
  COUNT(CASE WHEN trial_start IS NOT NULL THEN 1 END) as with_trial,
  COUNT(CASE WHEN trial_active = true THEN 1 END) as active_trials,
  COUNT(CASE WHEN subscribed = true THEN 1 END) as paid_subscribers
FROM subscribers;

-- 6. Ver alguns exemplos de subscribers (sem dados sensíveis)
SELECT 
  LEFT(user_id::text, 8) || '...' as user_id_partial,
  subscription_tier,
  subscribed,
  trial_start IS NOT NULL as has_trial_start,
  trial_end IS NOT NULL as has_trial_end,
  trial_active,
  created_at
FROM subscribers 
LIMIT 5;

-- 7. Testar função get_user_access_status (se existir)
-- Substitua 'test-user-id' por um UUID real se quiser testar
-- SELECT * FROM get_user_access_status('test-user-id'::UUID);

-- 8. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('subscribers', 'trial_events');

-- 9. Verificar se há erros nas funções
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'ensure_user_has_trial';