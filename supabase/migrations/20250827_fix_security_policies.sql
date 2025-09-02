-- Fix security issues in RLS policies
BEGIN;

-- 1. Fix overly permissive subscribers table policies
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Create more secure policies for subscribers table
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. Add unique constraint on user_id for subscribers to prevent duplicates
ALTER TABLE public.subscribers 
ADD CONSTRAINT unique_subscriber_user_id UNIQUE (user_id);

-- 3. Improve admin function security
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = check_user_id 
    AND active = true
  );
$$;

-- 4. Add index for better performance on subscription checks
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id_subscribed 
ON public.subscribers (user_id, subscribed);

CREATE INDEX IF NOT EXISTS idx_subscribers_trial_end 
ON public.subscribers (trial_end) WHERE trial_end IS NOT NULL;

COMMIT;
