-- Fix trial creation logic to handle existing subscriber records properly
-- The issue is that check-mercadopago-subscription creates empty subscriber records
-- which then prevents trial creation

-- Update ensure_user_has_trial to handle existing subscriber records without trials
CREATE OR REPLACE FUNCTION public.ensure_user_has_trial(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
  user_confirmed BOOLEAN;
  existing_subscriber RECORD;
  trial_start_date TIMESTAMPTZ;
  trial_end_date TIMESTAMPTZ;
BEGIN
  -- Get user info from auth.users
  SELECT email, email_confirmed_at IS NOT NULL 
  INTO user_email, user_confirmed
  FROM auth.users 
  WHERE id = check_user_id;
  
  -- Only proceed if user is confirmed and we found them
  IF NOT user_confirmed OR user_email IS NULL THEN
    RETURN false;
  END IF;

  -- Check if subscriber record exists
  SELECT *
  INTO existing_subscriber
  FROM public.subscribers
  WHERE user_id = check_user_id;

  -- If no subscriber record exists, create one with trial
  IF NOT FOUND THEN
    RETURN public.create_subscriber_trial(check_user_id, user_email);
  END IF;

  -- If subscriber exists but has no trial history, add trial to existing record
  IF existing_subscriber.trial_start IS NULL THEN
    -- Calculate trial dates (7 days from now)
    trial_start_date := NOW();
    trial_end_date := trial_start_date + INTERVAL '7 days';
    
    -- Update existing subscriber record with trial
    UPDATE public.subscribers
    SET 
      trial_start = trial_start_date,
      trial_end = trial_end_date,
      subscription_tier = COALESCE(subscription_tier, 'Trial'),
      updated_at = NOW()
    WHERE user_id = check_user_id;
    
    RETURN true;
  END IF;

  -- User already has trial history
  RETURN false;
END;
$$;

-- Create a function to safely create or update subscriber with trial
CREATE OR REPLACE FUNCTION public.create_or_update_subscriber_trial(
  user_id UUID, 
  user_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trial_start_date TIMESTAMPTZ;
  trial_end_date TIMESTAMPTZ;
  existing_subscriber RECORD;
BEGIN
  -- Calculate trial dates (7 days from now)
  trial_start_date := NOW();
  trial_end_date := trial_start_date + INTERVAL '7 days';

  -- Check if subscriber record exists
  SELECT *
  INTO existing_subscriber
  FROM public.subscribers
  WHERE subscribers.user_id = create_or_update_subscriber_trial.user_id;

  -- If subscriber exists
  IF FOUND THEN
    -- Only add trial if they don't have trial history
    IF existing_subscriber.trial_start IS NULL THEN
      UPDATE public.subscribers
      SET 
        trial_start = trial_start_date,
        trial_end = trial_end_date,
        subscription_tier = COALESCE(subscription_tier, 'Trial'),
        updated_at = NOW()
      WHERE subscribers.user_id = create_or_update_subscriber_trial.user_id;
      
      RETURN true;
    ELSE
      -- User already has trial history
      RETURN false;
    END IF;
  ELSE
    -- Create new subscriber with trial
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
      create_or_update_subscriber_trial.user_id,
      user_email,
      NULL,
      false, -- Trial users are not subscribed
      'Trial',
      NULL, -- No subscription for trial users
      NULL,
      trial_start_date,
      trial_end_date,
      NOW(),
      NOW()
    );
    
    RETURN true;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_or_update_subscriber_trial(UUID, TEXT) TO authenticated;

-- Update the create_subscriber_trial function to use the new logic
CREATE OR REPLACE FUNCTION public.create_subscriber_trial(user_id UUID, user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN public.create_or_update_subscriber_trial(user_id, user_email);
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION public.create_or_update_subscriber_trial(UUID, TEXT) IS 
'Creates new subscriber with trial or adds trial to existing subscriber record if they have no trial history';

COMMENT ON FUNCTION public.ensure_user_has_trial(UUID) IS 
'Ensures authenticated user has subscriber record with trial. Handles both new users and existing users without trials.';

-- Create a function to check current trial status for debugging
CREATE OR REPLACE FUNCTION public.debug_user_trial_status(check_user_id UUID)
RETURNS TABLE (
  user_exists BOOLEAN,
  user_confirmed BOOLEAN,
  subscriber_exists BOOLEAN,
  has_trial_history BOOLEAN,
  trial_currently_active BOOLEAN,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  subscription_tier TEXT,
  subscribed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  subscriber_record RECORD;
BEGIN
  -- Get user info
  SELECT 
    id IS NOT NULL as exists,
    email_confirmed_at IS NOT NULL as confirmed
  INTO user_record
  FROM auth.users 
  WHERE id = check_user_id;

  -- Get subscriber info
  SELECT 
    user_id IS NOT NULL as exists,
    trial_start IS NOT NULL as has_trial,
    trial_active as currently_active,
    trial_start,
    trial_end,
    subscription_tier,
    subscribed
  INTO subscriber_record
  FROM public.subscribers
  WHERE user_id = check_user_id;

  RETURN QUERY SELECT
    COALESCE(user_record.exists, false) as user_exists,
    COALESCE(user_record.confirmed, false) as user_confirmed,
    COALESCE(subscriber_record.exists, false) as subscriber_exists,
    COALESCE(subscriber_record.has_trial, false) as has_trial_history,
    COALESCE(subscriber_record.currently_active, false) as trial_currently_active,
    subscriber_record.trial_start,
    subscriber_record.trial_end,
    subscriber_record.subscription_tier,
    subscriber_record.subscribed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_user_trial_status(UUID) TO authenticated;

COMMENT ON FUNCTION public.debug_user_trial_status(UUID) IS 
'Debug function to check user and trial status. Useful for troubleshooting trial creation issues.';