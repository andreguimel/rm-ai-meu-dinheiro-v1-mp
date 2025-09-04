-- Verificar status do usuário andreguimel@icloud.com

-- 1. Verificar se existe na tabela auth.users
SELECT 
  'auth.users' as table_name,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'andreguimel@icloud.com';

-- 2. Verificar se é admin
SELECT 
  'admin_users' as table_name,
  user_id,
  email,
  active,
  created_at
FROM public.admin_users 
WHERE email = 'andreguimel@icloud.com';

-- 3. Verificar dados de assinatura na tabela subscribers
SELECT 
  'subscribers' as table_name,
  user_id,
  email,
  subscribed,
  subscription_tier,
  subscription_start,
  subscription_end,
  trial_start,
  trial_end,
  created_at,
  updated_at
FROM public.subscribers 
WHERE email = 'andreguimel@icloud.com';

-- 4. Verificar função is_admin_by_email
SELECT 
  'is_admin_by_email' as check_type,
  public.is_admin_by_email('andreguimel@icloud.com') as result;

-- 5. Verificar se trial está ativo (se existir)
SELECT 
  'trial_status' as check_type,
  email,
  trial_end,
  CASE 
    WHEN trial_end IS NULL THEN 'No trial'
    WHEN trial_end > NOW() THEN 'Active trial'
    ELSE 'Expired trial'
  END as trial_status,
  CASE 
    WHEN trial_end IS NOT NULL AND trial_end > NOW() THEN 
      EXTRACT(DAY FROM trial_end - NOW())::integer 
    ELSE 0 
  END as days_remaining
FROM public.subscribers 
WHERE email = 'andreguimel@icloud.com';
