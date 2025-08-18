-- Create admin_users table to manage administrator accounts
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users table
CREATE POLICY "Admin users can view admin list" 
ON public.admin_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid() AND au.active = true
  )
);

-- Function to check if a user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = $1 AND active = true
  );
$$;

-- Function to check if a user is admin by email
CREATE OR REPLACE FUNCTION public.is_admin_by_email(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email AND active = true
  );
$$;

-- Insert the admin user
INSERT INTO public.admin_users (user_id, email) 
SELECT id, email FROM auth.users 
WHERE email = 'andreguimel@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();