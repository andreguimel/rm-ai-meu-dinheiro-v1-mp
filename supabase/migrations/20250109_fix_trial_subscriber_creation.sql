-- Fix trial subscriber creation to properly set trial status
-- The issue is that create_subscriber_trial was setting subscribed=true for trials
-- which conflicts with the logic in get_user_access_status

-- Update the create_subscriber_trial function to properly handle trial users
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
    -- IMPORTANT: For trial users, subscribed should be FALSE
    -- The trial_active computed column will handle trial status
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
      false, -- Changed from true to false for trial users
      'Trial',
      NULL, -- No subscription start for trial users
      NULL, -- No subscription end for trial users
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

-- Also update any existing trial users that might have been created incorrectly
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

-- Add a comment explaining the logic
COMMENT ON FUNCTION public.create_subscriber_trial(UUID, TEXT) IS 
'Creates subscriber record with 7-day trial for new user. Sets subscribed=false for trial users - the trial_active computed column handles trial status.';

-- Create a function to check if a user needs trial creation
CREATE OR REPLACE FUNCTION public.user_needs_trial_creation(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  subscriber_exists BOOLEAN;
  has_trial_history BOOLEAN;
BEGIN
  -- Check if subscriber record exists
  SELECT EXISTS(
    SELECT 1 FROM public.subscribers 
    WHERE user_id = check_user_id
  ) INTO subscriber_exists;
  
  -- If no subscriber record, they need trial creation
  IF NOT subscriber_exists THEN
    RETURN true;
  END IF;
  
  -- Check if they have trial history
  SELECT EXISTS(
    SELECT 1 FROM public.subscribers 
    WHERE user_id = check_user_id 
    AND trial_start IS NOT NULL
  ) INTO has_trial_history;
  
  -- If they have a subscriber record but no trial history, they can get a trial
  RETURN NOT has_trial_history;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_needs_trial_creation(UUID) TO authenticated;

COMMENT ON FUNCTION public.user_needs_trial_creation(UUID) IS 
'Checks if a user is eligible for trial creation (no existing subscriber record or no trial history).';