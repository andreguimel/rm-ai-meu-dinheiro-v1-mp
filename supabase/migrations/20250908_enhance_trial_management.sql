-- Migration: Enhance database schema and functions for trial management
-- Purpose: Add computed column for trial_active and create comprehensive trial status functions
-- Requirements: 1.1, 4.1, 4.3

BEGIN;

-- Add computed column for trial_active status
-- This column automatically calculates if trial is currently active
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS trial_active BOOLEAN 
GENERATED ALWAYS AS (
  trial_end IS NOT NULL AND trial_end > NOW()
) STORED;

-- Create index on trial_active for better query performance
CREATE INDEX IF NOT EXISTS idx_subscribers_trial_active ON public.subscribers (trial_active);

-- Create enhanced trial status calculation function
-- This function provides detailed trial status information for a specific user
CREATE OR REPLACE FUNCTION public.calculate_trial_status(check_user_id UUID)
RETURNS TABLE (
  trial_active BOOLEAN,
  days_remaining INTEGER,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  subscriber_record RECORD;
BEGIN
  -- Get subscriber record for the user
  SELECT 
    s.trial_start,
    s.trial_end,
    s.trial_active
  INTO subscriber_record
  FROM public.subscribers s
  WHERE s.user_id = check_user_id;

  -- If no subscriber record found, return default values
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false::BOOLEAN as trial_active,
      0::INTEGER as days_remaining,
      NULL::TIMESTAMPTZ as trial_start,
      NULL::TIMESTAMPTZ as trial_end;
    RETURN;
  END IF;

  -- Calculate days remaining
  RETURN QUERY SELECT
    COALESCE(subscriber_record.trial_active, false) as trial_active,
    CASE
      WHEN subscriber_record.trial_end IS NOT NULL AND subscriber_record.trial_end > NOW() THEN
        CEIL(EXTRACT(epoch FROM (subscriber_record.trial_end - NOW())) / 86400)::INTEGER
      ELSE 0
    END as days_remaining,
    subscriber_record.trial_start,
    subscriber_record.trial_end;
END;
$$;

-- Create comprehensive user access status function
-- This function determines the user's access level considering both trials and paid subscriptions
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.calculate_trial_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_access_status(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON COLUMN public.subscribers.trial_active IS 
'Computed column that automatically determines if trial is currently active (trial_end > NOW())';

COMMENT ON FUNCTION public.calculate_trial_status(UUID) IS 
'Returns detailed trial status information for a specific user including active status and days remaining';

COMMENT ON FUNCTION public.get_user_access_status(UUID) IS 
'Returns comprehensive access status considering both paid subscriptions and active trials. Determines effective subscription status and access level.';

-- Create a helper function for RPC calls that uses the current authenticated user
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

-- Grant execute permission for the helper function
GRANT EXECUTE ON FUNCTION public.get_my_access_status() TO authenticated;

COMMENT ON FUNCTION public.get_my_access_status() IS 
'Helper function that returns access status for the currently authenticated user. Can be called via RPC from frontend.';

COMMIT;