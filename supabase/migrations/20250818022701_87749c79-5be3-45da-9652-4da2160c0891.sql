-- Create table for shared users
CREATE TABLE public.shared_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid NOT NULL, -- The main account owner
  shared_user_id uuid NOT NULL, -- The user who has access
  name text NOT NULL,
  whatsapp text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  
  -- Ensure unique sharing relationship
  UNIQUE(owner_user_id, shared_user_id)
);

-- Enable RLS
ALTER TABLE public.shared_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared_users table
CREATE POLICY "Users can view shared access to their account" 
ON public.shared_users 
FOR SELECT 
USING (auth.uid() = owner_user_id OR auth.uid() = shared_user_id);

CREATE POLICY "Users can create shared access for their account" 
ON public.shared_users 
FOR INSERT 
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update shared access for their account" 
ON public.shared_users 
FOR UPDATE 
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete shared access for their account" 
ON public.shared_users 
FOR DELETE 
USING (auth.uid() = owner_user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_shared_users_updated_at
  BEFORE UPDATE ON public.shared_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get the main account owner for a user
CREATE OR REPLACE FUNCTION public.get_main_account_user_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  -- If the user is a shared user, return the owner's ID
  -- Otherwise, return the user's own ID
  SELECT COALESCE(
    (SELECT owner_user_id FROM public.shared_users WHERE shared_user_id = user_id AND active = true LIMIT 1),
    user_id
  );
$$;

-- Function to check if user has access to main account data
CREATE OR REPLACE FUNCTION public.has_account_access(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT (
    -- User is the owner themselves
    auth.uid() = target_user_id
    OR
    -- User has shared access to this account
    EXISTS (
      SELECT 1 FROM public.shared_users 
      WHERE owner_user_id = target_user_id 
      AND shared_user_id = auth.uid() 
      AND active = true
    )
    OR
    -- The target user has shared access to current user's account (both share same main account)
    public.get_main_account_user_id(auth.uid()) = public.get_main_account_user_id(target_user_id)
  );
$$;

-- Add constraint to limit shared users to maximum 3
CREATE OR REPLACE FUNCTION public.check_shared_users_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.shared_users WHERE owner_user_id = NEW.owner_user_id AND active = true) >= 3 THEN
    RAISE EXCEPTION 'Máximo de 3 usuários compartilhados permitidos por conta.';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce limit
CREATE TRIGGER enforce_shared_users_limit
  BEFORE INSERT ON public.shared_users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_shared_users_limit();