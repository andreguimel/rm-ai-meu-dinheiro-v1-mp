-- Migration: Auto-create subscriber with trial when user signs up
-- Purpose: Create function to be called by webhook or edge function when user confirms email

-- Create function to auto-create subscriber with trial
CREATE OR REPLACE FUNCTION public.create_subscriber_trial(user_id UUID, user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trial_start_date TIMESTAMPTZ;
  trial_end_date TIMESTAMPTZ;
  existing_subscriber_count INTEGER;
BEGIN
  -- Check if subscriber already exists
  SELECT COUNT(*) INTO existing_subscriber_count
  FROM public.subscribers 
  WHERE email = user_email OR user_id = create_subscriber_trial.user_id;
  
  -- Only create if doesn't exist
  IF existing_subscriber_count = 0 THEN
    -- Calculate trial dates (7 days from now)
    trial_start_date := NOW();
    trial_end_date := trial_start_date + INTERVAL '7 days';
    
    -- Insert new subscriber with trial
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
      create_subscriber_trial.user_id,
      user_email,
      NULL,
      true,
      'Trial',
      trial_start_date,
      trial_end_date,
      trial_start_date,
      trial_end_date,
      NOW(),
      NOW()
    );
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Create RPC function that can be called from edge functions
CREATE OR REPLACE FUNCTION public.ensure_user_has_trial(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
  user_confirmed BOOLEAN;
  result BOOLEAN;
BEGIN
  -- Get user info from auth.users (we can read, just not trigger)
  SELECT email, email_confirmed_at IS NOT NULL 
  INTO user_email, user_confirmed
  FROM auth.users 
  WHERE id = check_user_id;
  
  -- Only proceed if user is confirmed and we found them
  IF user_confirmed AND user_email IS NOT NULL THEN
    SELECT public.create_subscriber_trial(check_user_id, user_email) INTO result;
    RETURN result;
  END IF;
  
  RETURN false;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_subscriber_trial(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_has_trial(UUID) TO authenticated;

-- Add comments explaining the functions
COMMENT ON FUNCTION public.create_subscriber_trial(UUID, TEXT) IS 'Creates subscriber record with 7-day trial for new user';
COMMENT ON FUNCTION public.ensure_user_has_trial(UUID) IS 'Ensures authenticated user has subscriber record with trial (call from edge functions)';

-- Create a policy to allow users to call the trial function for themselves
CREATE POLICY "Users can ensure their own trial" ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
