-- Allow shared_user_id to be nullable for cases where we share access by name/phone only
ALTER TABLE public.shared_users 
ALTER COLUMN shared_user_id DROP NOT NULL;