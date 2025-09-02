-- DEBUG COMMANDS FOR SUPABASE SQL EDITOR
-- Use these to debug why new users are being blocked

-- 1. Check all users in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check all subscribers
SELECT 
  user_id,
  email,
  subscribed,
  subscription_tier,
  trial_start,
  trial_end,
  subscription_start,
  subscription_end,
  created_at,
  updated_at
FROM public.subscribers 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check which users have subscribers records
SELECT 
  u.id as user_id,
  u.email as user_email,
  u.email_confirmed_at,
  s.email as subscriber_email,
  s.subscribed,
  s.subscription_tier,
  s.trial_start,
  s.trial_end,
  CASE 
    WHEN s.user_id IS NULL THEN 'NO SUBSCRIBER RECORD'
    WHEN s.trial_end > NOW() THEN 'TRIAL ACTIVE'
    WHEN s.subscription_end > NOW() AND s.subscribed = true THEN 'SUBSCRIPTION ACTIVE'
    ELSE 'EXPIRED'
  END as status
FROM auth.users u
LEFT JOIN public.subscribers s ON u.id = s.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- 4. Test the ensure_user_has_trial function for a specific user
-- Replace 'USER_ID_HERE' with actual user ID from auth.users
-- SELECT public.ensure_user_has_trial('USER_ID_HERE');

-- 5. Check what happens when we call the function
-- First get a user ID:
-- SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL LIMIT 1;

-- Then test the function:
-- SELECT public.ensure_user_has_trial((SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL LIMIT 1));

-- 6. Check if the function worked:
-- SELECT * FROM public.subscribers WHERE user_id = (SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL LIMIT 1);
