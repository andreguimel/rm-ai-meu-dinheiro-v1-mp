-- Migration: Setup webhook trigger for automatic user onboarding
-- This creates a webhook that will call our Edge Function when user confirms email

-- Create function to call the user-onboarding edge function
CREATE OR REPLACE FUNCTION public.handle_user_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  webhook_url TEXT;
  payload JSON;
  response TEXT;
BEGIN
  -- Only proceed if email was just confirmed (changed from NULL to a timestamp)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Create payload for the edge function
    payload := json_build_object(
      'type', 'UPDATE',
      'table', 'users',
      'record', json_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'email_confirmed_at', NEW.email_confirmed_at,
        'raw_user_meta_data', NEW.raw_user_meta_data
      ),
      'old_record', json_build_object(
        'id', OLD.id,
        'email', OLD.email,
        'email_confirmed_at', OLD.email_confirmed_at,
        'raw_user_meta_data', OLD.raw_user_meta_data
      )
    );

    -- Log the event
    RAISE LOG 'User email confirmed, triggering onboarding for: %', NEW.email;

    -- Use the http extension to call our Edge Function
    -- Note: This requires the http extension to be enabled
    -- You can enable it in Supabase Dashboard -> Database -> Extensions -> http
    
    BEGIN
      -- Get the edge function URL (you'll need to replace this with your actual project URL)
      webhook_url := current_setting('app.supabase_url', true) || '/functions/v1/user-onboarding';
      
      -- Make HTTP request to edge function (uncomment when http extension is enabled)
      -- SELECT http_post(
      --   webhook_url,
      --   payload::text,
      --   'application/json'
      -- ) INTO response;
      
      RAISE LOG 'Onboarding webhook would be called for user: %', NEW.email;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error calling onboarding webhook for %: %', NEW.email, SQLERRM;
    END;
    
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for email confirmation
-- Note: This might require superuser privileges, if it fails, use the RPC approach instead
DO $$
BEGIN
  -- Try to create trigger, catch error if not allowed
  BEGIN
    DROP TRIGGER IF EXISTS on_user_email_confirmed ON auth.users;
    CREATE TRIGGER on_user_email_confirmed
      AFTER UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_user_confirmation();
    
    RAISE LOG 'Trigger created successfully on auth.users';
    
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE LOG 'Cannot create trigger on auth.users - using RPC approach instead';
  END;
END $$;

-- Alternative RPC-based approach (safer, works without trigger privileges)
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
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;
  
  IF NOT user_confirmed THEN
    RETURN json_build_object('success', false, 'message', 'Email not confirmed');
  END IF;
  
  -- Check existing records
  SELECT COUNT(*) INTO existing_profile_count FROM public.profiles WHERE id = user_id;
  SELECT COUNT(*) INTO existing_subscriber_count FROM public.subscribers WHERE user_id = complete_user_onboarding.user_id;
  
  -- Create or update profile
  IF existing_profile_count = 0 OR force_recreate THEN
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
  END IF;
  
  -- Create subscriber with trial
  IF existing_subscriber_count = 0 OR force_recreate THEN
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
      updated_at = NOW();
  END IF;
  
  result := json_build_object(
    'success', true,
    'message', 'User onboarding completed',
    'user_id', user_id,
    'email', user_email,
    'profile_created', true,
    'subscriber_created', true,
    'trial_end', (NOW() + INTERVAL '7 days')::text
  );
  
  RAISE LOG 'User onboarding completed for: %', user_email;
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_user_confirmation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding(UUID, BOOLEAN) TO authenticated;

-- Comments
COMMENT ON FUNCTION public.handle_user_confirmation() IS 'Handles user email confirmation and triggers onboarding';
COMMENT ON FUNCTION public.complete_user_onboarding(UUID, BOOLEAN) IS 'Completes user onboarding by creating profile and subscriber records';

-- Instructions for manual setup if needed:
-- 1. Enable http extension in Supabase Dashboard -> Database -> Extensions -> http
-- 2. Set the app.supabase_url setting:
-- ALTER DATABASE postgres SET app.supabase_url = 'https://your-project-ref.supabase.co';
-- 3. Uncomment the http_post call in handle_user_confirmation function
