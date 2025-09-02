-- Fix trial users access - mark trial users as subscribed for access control
-- This ensures users in trial period can access the application features

BEGIN;

-- Update existing trial users to be marked as subscribed
-- Only update users who have an active trial (trial_end in the future) but are marked as not subscribed
UPDATE public.subscribers 
SET 
  subscribed = true,
  updated_at = now()
WHERE 
  subscription_tier = 'Trial' 
  AND trial_end IS NOT NULL 
  AND trial_end > now()
  AND subscribed = false;

-- Create function to auto-mark trial users as subscribed when trial data is inserted/updated
CREATE OR REPLACE FUNCTION public.ensure_trial_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is a trial user with valid trial dates, mark as subscribed
  IF NEW.subscription_tier = 'Trial' 
     AND NEW.trial_end IS NOT NULL 
     AND NEW.trial_end > now() THEN
    NEW.subscribed = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically ensure trial users are marked as subscribed
DROP TRIGGER IF EXISTS ensure_trial_access_trigger ON public.subscribers;
CREATE TRIGGER ensure_trial_access_trigger
  BEFORE INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_trial_access();

COMMIT;

-- Add comment explaining the trigger
COMMENT ON FUNCTION public.ensure_trial_access() IS 
'Automatically marks trial users as subscribed for access control. Trial users need subscribed=true to access application features through SubscriptionGuard.';
