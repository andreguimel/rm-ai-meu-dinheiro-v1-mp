-- FUNÇÃO RPC MELHORADA COM DEBUG LOGS
-- Execute este SQL no Supabase para substituir a função existente

-- Função melhorada com debug logs
CREATE OR REPLACE FUNCTION public.ensure_user_has_trial(check_user_id UUID DEFAULT auth.uid())
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
  user_confirmed BOOLEAN;
  existing_count INTEGER;
  insert_result BOOLEAN;
  result JSON;
BEGIN
  -- Log de início
  RAISE LOG 'ensure_user_has_trial called for user: %', check_user_id;
  
  -- Get user info from auth.users
  SELECT email, email_confirmed_at IS NOT NULL 
  INTO user_email, user_confirmed
  FROM auth.users 
  WHERE id = check_user_id;
  
  -- Log user info
  RAISE LOG 'User found: email=%, confirmed=%', user_email, user_confirmed;
  
  -- Check if user exists and is confirmed
  IF user_email IS NULL THEN
    result := json_build_object(
      'success', false,
      'message', 'User not found',
      'user_id', check_user_id
    );
    RAISE LOG 'User not found: %', check_user_id;
    RETURN result;
  END IF;
  
  IF NOT user_confirmed THEN
    result := json_build_object(
      'success', false,
      'message', 'User email not confirmed',
      'user_id', check_user_id,
      'email', user_email
    );
    RAISE LOG 'User email not confirmed: %', user_email;
    RETURN result;
  END IF;
  
  -- Check if subscriber already exists
  SELECT COUNT(*) INTO existing_count
  FROM public.subscribers 
  WHERE user_id = check_user_id OR email = user_email;
  
  RAISE LOG 'Existing subscriber count: %', existing_count;
  
  IF existing_count > 0 THEN
    result := json_build_object(
      'success', true,
      'message', 'Subscriber already exists',
      'user_id', check_user_id,
      'email', user_email,
      'created_new', false
    );
    RAISE LOG 'Subscriber already exists for: %', user_email;
    RETURN result;
  END IF;
  
  -- Try to create new subscriber
  BEGIN
    INSERT INTO public.subscribers (
      user_id,
      email,
      stripe_customer_id,
      subscribed,
      subscription_tier,
      subscription_start,
      subscription_end,
      trial_start,
      trial_end,
      created_at,
      updated_at
    ) VALUES (
      check_user_id,
      user_email,
      NULL,
      true,
      'Trial',
      NOW(),
      NOW() + INTERVAL '7 days',
      NOW(),
      NOW() + INTERVAL '7 days',
      NOW(),
      NOW()
    );
    
    result := json_build_object(
      'success', true,
      'message', 'Trial subscriber created successfully',
      'user_id', check_user_id,
      'email', user_email,
      'created_new', true,
      'trial_end', NOW() + INTERVAL '7 days'
    );
    
    RAISE LOG 'Trial subscriber created successfully for: %', user_email;
    RETURN result;
    
  EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'message', 'Failed to create subscriber',
      'user_id', check_user_id,
      'email', user_email,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
    
    RAISE LOG 'Failed to create subscriber for %, error: %', user_email, SQLERRM;
    RETURN result;
  END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.ensure_user_has_trial(UUID) TO authenticated;

-- Test the function (uncomment and replace with real user ID)
-- SELECT public.ensure_user_has_trial('your-user-id-here');
