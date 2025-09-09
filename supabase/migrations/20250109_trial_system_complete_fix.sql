-- Complete Trial System Fix
-- This migration fixes all trial-related issues from scratch

-- First, let's ensure the subscribers table has the correct structure
-- Add trial_active computed column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscribers' AND column_name = 'trial_active'
  ) THEN
    ALTER TABLE public.subscribers 
    ADD COLUMN trial_active BOOLEAN 
    GENERATED ALWAYS AS (
      trial_end IS NOT NULL AND trial_end > NOW()
    ) STORED;
    
    CREATE INDEX IF NOT EXISTS idx_subscribers_trial_active ON public.subscribers (trial_active);
  END IF;
END $$;

-- Fix any existing trial users that were created incorrectly
UPDATE public.subscribers 
SET 
  subscribed = false,
  subscription_start = NULL,
  subscription_end = NULL,
  updated_at = NOW()
WHERE 
  subscription_tier = 'Trial' 
  AND subscribed = true 
  AND trial_start IS NOT NULL 
  AND trial_end IS NOT NULL;

-- Create or replace the main trial creation function
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
  WHERE email = user_email OR subscribers.user_id = create_subscriber_trial.user_id;
  
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
      false, -- Trial users are NOT subscribed
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
  
  RETURN false;
END;
$$;

-- Create enhanced ensure_user_has_trial function
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
  WHERE subscribers.user_id = check_user_id;

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
      subscribed = false, -- Ensure trial users are not marked as subscribed
      updated_at = NOW()
    WHERE subscribers.user_id = check_user_id;
    
    RETURN true;
  END IF;

  -- User already has trial history
  RETURN false;
END;
$$;

-- Create or replace get_user_access_status function
CREATE OR REPLACE FUNCTION public.get_user_access_status(check_user_id UUID)
RETURNS TABLE (
  has_paid_subscription BOOLEAN,
  trial_active BOOLEAN,
  trial_days_remaining INTEGER,
  access_level TEXT,
  effective_subscription BOOLEAN,
  subscription_tier TEXT,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  subscriber_record RECORD;
  has_paid BOOLEAN;
  trial_is_active BOOLEAN;
  days_left INTEGER;
BEGIN
  -- Get comprehensive subscriber information
  SELECT 
    s.subscribed,
    s.subscription_tier,
    s.trial_start,
    s.trial_end,
    s.trial_active,
    s.subscription_start,
    s.subscription_end
  INTO subscriber_record
  FROM public.subscribers s
  WHERE s.user_id = check_user_id;

  -- If no subscriber record found, return no access
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false::BOOLEAN as has_paid_subscription,
      false::BOOLEAN as trial_active,
      0::INTEGER as trial_days_remaining,
      'none'::TEXT as access_level,
      false::BOOLEAN as effective_subscription,
      NULL::TEXT as subscription_tier,
      NULL::TIMESTAMPTZ as trial_start,
      NULL::TIMESTAMPTZ as trial_end;
    RETURN;
  END IF;

  -- Determine if user has paid subscription (not trial)
  -- A paid subscription is when subscribed=true AND subscription_tier != 'Trial'
  has_paid := COALESCE(subscriber_record.subscribed, false) 
              AND COALESCE(subscriber_record.subscription_tier, '') != 'Trial';
  trial_is_active := COALESCE(subscriber_record.trial_active, false);

  -- Calculate days remaining for trial
  days_left := CASE
    WHEN subscriber_record.trial_end IS NOT NULL AND subscriber_record.trial_end > NOW() THEN
      CEIL(EXTRACT(epoch FROM (subscriber_record.trial_end - NOW())) / 86400)::INTEGER
    ELSE 0
  END;

  -- Return comprehensive status
  RETURN QUERY SELECT
    has_paid as has_paid_subscription,
    trial_is_active as trial_active,
    days_left as trial_days_remaining,
    CASE
      WHEN has_paid THEN 'premium'::TEXT
      WHEN trial_is_active THEN 'trial'::TEXT
      ELSE 'none'::TEXT
    END as access_level,
    (has_paid OR trial_is_active) as effective_subscription,
    subscriber_record.subscription_tier,
    subscriber_record.trial_start,
    subscriber_record.trial_end;
END;
$$;

-- Create debug function for troubleshooting
CREATE OR REPLACE FUNCTION public.debug_user_trial_status(check_user_id UUID)
RETURNS TABLE (
  user_exists BOOLEAN,
  user_confirmed BOOLEAN,
  user_email TEXT,
  subscriber_exists BOOLEAN,
  has_trial_history BOOLEAN,
  trial_currently_active BOOLEAN,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  subscription_tier TEXT,
  subscribed BOOLEAN,
  days_remaining INTEGER
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
    email_confirmed_at IS NOT NULL as confirmed,
    email
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
    subscribed,
    CASE
      WHEN trial_end IS NOT NULL AND trial_end > NOW() THEN
        CEIL(EXTRACT(epoch FROM (trial_end - NOW())) / 86400)::INTEGER
      ELSE 0
    END as days_left
  INTO subscriber_record
  FROM public.subscribers
  WHERE subscribers.user_id = check_user_id;

  RETURN QUERY SELECT
    COALESCE(user_record.exists, false) as user_exists,
    COALESCE(user_record.confirmed, false) as user_confirmed,
    user_record.email as user_email,
    COALESCE(subscriber_record.exists, false) as subscriber_exists,
    COALESCE(subscriber_record.has_trial, false) as has_trial_history,
    COALESCE(subscriber_record.currently_active, false) as trial_currently_active,
    subscriber_record.trial_start,
    subscriber_record.trial_end,
    subscriber_record.subscription_tier,
    subscriber_record.subscribed,
    COALESCE(subscriber_record.days_left, 0) as days_remaining;
END;
$$;

-- Create helper function for current user
CREATE OR REPLACE FUNCTION public.get_my_access_status()
RETURNS TABLE (
  has_paid_subscription BOOLEAN,
  trial_active BOOLEAN,
  trial_days_remaining INTEGER,
  access_level TEXT,
  effective_subscription BOOLEAN,
  subscription_tier TEXT,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.get_user_access_status(auth.uid());
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_subscriber_trial(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_has_trial(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_access_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_access_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_user_trial_status(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.create_subscriber_trial(UUID, TEXT) IS 
'Creates subscriber record with 7-day trial for new user. Sets subscribed=false for trial users.';

COMMENT ON FUNCTION public.ensure_user_has_trial(UUID) IS 
'Ensures authenticated user has subscriber record with trial. Handles both new users and existing users without trials.';

COMMENT ON FUNCTION public.get_user_access_status(UUID) IS 
'Returns comprehensive access status considering both paid subscriptions and active trials.';

COMMENT ON FUNCTION public.debug_user_trial_status(UUID) IS 
'Debug function to check user and trial status. Useful for troubleshooting trial creation issues.';