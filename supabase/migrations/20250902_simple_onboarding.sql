-- Migration: Simple user onboarding without trial
-- Remove trial logic and create simple onboarding

-- Drop existing trial functions
DROP FUNCTION IF EXISTS public.create_subscriber_trial(UUID, TEXT);
DROP FUNCTION IF EXISTS public.ensure_user_has_trial(UUID);
DROP FUNCTION IF EXISTS public.complete_user_onboarding(UUID, BOOLEAN);

-- Create simple onboarding function
CREATE OR REPLACE FUNCTION public.create_user_profile_simple(
  user_id UUID DEFAULT auth.uid(),
  user_email TEXT DEFAULT auth.email(),
  user_name TEXT DEFAULT 'Usuário',
  organization_name TEXT DEFAULT 'Minha Empresa',
  telefone TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  profile_exists BOOLEAN;
  subscriber_exists BOOLEAN;
BEGIN
  -- Check if user is authenticated
  IF user_id IS NULL OR user_email IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not authenticated');
  END IF;

  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;
  
  -- Check if subscriber already exists
  SELECT EXISTS(SELECT 1 FROM public.subscribers WHERE user_id = create_user_profile_simple.user_id) INTO subscriber_exists;

  -- Create profile if doesn't exist
  IF NOT profile_exists THEN
    INSERT INTO public.profiles (
      id, email, name, organization_name, telefone, updated_at
    ) VALUES (
      user_id, user_email, user_name, organization_name, telefone, NOW()
    );
    RAISE LOG 'Profile created for user: %', user_email;
  END IF;

  -- Create basic subscriber record without trial
  IF NOT subscriber_exists THEN
    INSERT INTO public.subscribers (
      user_id, 
      email, 
      stripe_customer_id, 
      subscribed, 
      subscription_tier,
      subscription_end,
      created_at, 
      updated_at
    ) VALUES (
      user_id, 
      user_email, 
      NULL, 
      false, 
      NULL,
      NULL,
      NOW(), 
      NOW()
    );
    RAISE LOG 'Subscriber record created for user: %', user_email;
  END IF;

  result := json_build_object(
    'success', true,
    'message', 'User profile created successfully',
    'user_id', user_id,
    'email', user_email,
    'profile_created', NOT profile_exists,
    'subscriber_created', NOT subscriber_exists
  );

  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile_simple(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Comment
COMMENT ON FUNCTION public.create_user_profile_simple(UUID, TEXT, TEXT, TEXT, TEXT) IS 'Creates basic profile and subscriber records for new users without trial';
