-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- Cria a função de onboarding automático para novos usuários

-- Função principal para completar o onboarding do usuário
CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
  user_id UUID DEFAULT auth.uid(),
  force_recreate BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  organization_name TEXT;
  telefone TEXT;
  user_confirmed BOOLEAN;
  existing_profile_count INTEGER;
  existing_subscriber_count INTEGER;
  result JSON;
BEGIN
  -- Log início da função
  RAISE LOG 'Starting onboarding for user: %', user_id;
  
  -- Get user info from auth.users
  SELECT 
    email, 
    email_confirmed_at IS NOT NULL,
    COALESCE(raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(raw_user_meta_data->>'organization_name', 'Minha Empresa'),
    COALESCE(raw_user_meta_data->>'telefone', '')
  INTO user_email, user_confirmed, user_name, organization_name, telefone
  FROM auth.users 
  WHERE id = user_id;
  
  -- Check if user exists and is confirmed
  IF user_email IS NULL THEN
    RAISE LOG 'User not found: %', user_id;
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;
  
  IF NOT user_confirmed THEN
    RAISE LOG 'Email not confirmed for user: %', user_email;
    RETURN json_build_object('success', false, 'message', 'Email not confirmed');
  END IF;
  
  RAISE LOG 'User data found: email=%, name=%, org=%', user_email, user_name, organization_name;
  
  -- Check existing records
  SELECT COUNT(*) INTO existing_profile_count FROM public.profiles WHERE id = user_id;
  SELECT COUNT(*) INTO existing_subscriber_count FROM public.subscribers WHERE user_id = complete_user_onboarding.user_id;
  
  RAISE LOG 'Existing records: profiles=%, subscribers=%', existing_profile_count, existing_subscriber_count;
  
  -- Create or update profile
  IF existing_profile_count = 0 OR force_recreate THEN
    RAISE LOG 'Creating/updating profile for: %', user_email;
    
    INSERT INTO public.profiles (
      id, email, name, organization_name, telefone, updated_at
    ) VALUES (
      user_id, user_email, user_name, organization_name, telefone, NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      organization_name = EXCLUDED.organization_name,
      telefone = EXCLUDED.telefone,
      updated_at = NOW();
      
    RAISE LOG 'Profile created/updated for: %', user_email;
  ELSE
    RAISE LOG 'Profile already exists for: %', user_email;
  END IF;
  
  -- Create subscriber with trial
  IF existing_subscriber_count = 0 OR force_recreate THEN
    RAISE LOG 'Creating/updating subscriber with trial for: %', user_email;
    
    INSERT INTO public.subscribers (
      user_id, email, stripe_customer_id, subscribed, subscription_tier,
      subscription_start, subscription_end, trial_start, trial_end, created_at, updated_at
    ) VALUES (
      user_id, user_email, NULL, true, 'Trial',
      NOW(), NOW() + INTERVAL '7 days',
      NOW(), NOW() + INTERVAL '7 days',
      NOW(), NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      subscription_tier = EXCLUDED.subscription_tier,
      subscribed = EXCLUDED.subscribed,
      trial_start = EXCLUDED.trial_start,
      trial_end = EXCLUDED.trial_end,
      updated_at = NOW();
      
    RAISE LOG 'Subscriber created/updated for: %', user_email;
  ELSE
    RAISE LOG 'Subscriber already exists for: %', user_email;
  END IF;
  
  result := json_build_object(
    'success', true,
    'message', 'User onboarding completed',
    'user_id', user_id,
    'email', user_email,
    'profile_created', existing_profile_count = 0 OR force_recreate,
    'subscriber_created', existing_subscriber_count = 0 OR force_recreate,
    'trial_end', (NOW() + INTERVAL '7 days')::text
  );
  
  RAISE LOG 'Onboarding completed successfully for: %', user_email;
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in onboarding for %: % - %', user_email, SQLERRM, SQLSTATE;
  RETURN json_build_object(
    'success', false, 
    'message', 'Error during onboarding',
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding(UUID, BOOLEAN) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.complete_user_onboarding(UUID, BOOLEAN) IS 'Completes user onboarding by creating profile and subscriber records with trial';

-- Test the function (uncomment and replace with real user ID)
-- SELECT public.complete_user_onboarding();

-- Check results
-- SELECT * FROM public.profiles WHERE id = auth.uid();
-- SELECT * FROM public.subscribers WHERE user_id = auth.uid();
