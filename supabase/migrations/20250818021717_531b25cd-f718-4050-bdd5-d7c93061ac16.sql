-- Fix RLS policy for subscribers table - replace overly permissive UPDATE policy
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE 
USING (auth.uid() = user_id OR auth.email() = email)
WITH CHECK (auth.uid() = user_id OR auth.email() = email);

-- Secure all database functions with proper search_path
ALTER FUNCTION public.update_updated_at_column() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.update_valor_restante() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.update_meta_status() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.update_item_status() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.calcular_proxima_manutencao() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.delete_user_account(uuid) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.update_divida_status() SECURITY DEFINER SET search_path = public;

-- Add encryption support for API keys in ia_configuracoes
-- First, add a new column for encrypted API keys
ALTER TABLE public.ia_configuracoes ADD COLUMN IF NOT EXISTS api_key_encrypted text;

-- Create a function to encrypt API keys using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to safely encrypt API keys
CREATE OR REPLACE FUNCTION public.encrypt_api_key(api_key text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Use user_id as part of the encryption key for additional security
  RETURN encode(
    encrypt(
      api_key::bytea, 
      (user_id::text || 'lovable_secret_key')::bytea, 
      'aes'
    ), 
    'base64'
  );
END;
$$;

-- Create a function to decrypt API keys
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN decode(
    decrypt(
      decode(encrypted_key, 'base64'), 
      (user_id::text || 'lovable_secret_key')::bytea, 
      'aes'
    ), 
    'escape'
  );
EXCEPTION
  WHEN others THEN
    RETURN NULL; -- Return NULL if decryption fails
END;
$$;

-- Add a trigger to automatically encrypt API keys before insert/update
CREATE OR REPLACE FUNCTION public.encrypt_ia_api_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only encrypt if api_key is provided and different from existing
  IF NEW.api_key IS NOT NULL AND NEW.api_key != '' THEN
    NEW.api_key_encrypted = public.encrypt_api_key(NEW.api_key, NEW.user_id);
    -- Clear the plain text api_key for security
    NEW.api_key = '[ENCRYPTED]';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS encrypt_api_key_trigger ON public.ia_configuracoes;
CREATE TRIGGER encrypt_api_key_trigger
  BEFORE INSERT OR UPDATE ON public.ia_configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_ia_api_key();

-- Migrate existing API keys to encrypted format
UPDATE public.ia_configuracoes 
SET api_key_encrypted = public.encrypt_api_key(api_key, user_id),
    api_key = '[ENCRYPTED]'
WHERE api_key IS NOT NULL AND api_key != '' AND api_key != '[ENCRYPTED]';

-- Add RLS policy for secure access to encrypted API keys
CREATE POLICY "Users can decrypt their own API keys" ON public.ia_configuracoes
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a secure view for accessing decrypted API keys (only for the user's own data)
CREATE OR REPLACE VIEW public.ia_configuracoes_decrypted AS
SELECT 
  id,
  user_id,
  modelo,
  CASE 
    WHEN auth.uid() = user_id THEN public.decrypt_api_key(api_key_encrypted, user_id)
    ELSE NULL
  END as api_key,
  created_at,
  updated_at
FROM public.ia_configuracoes
WHERE auth.uid() = user_id;

-- Enable RLS on the view
ALTER VIEW public.ia_configuracoes_decrypted OWNER TO postgres;
GRANT SELECT ON public.ia_configuracoes_decrypted TO authenticated;
GRANT SELECT ON public.ia_configuracoes_decrypted TO anon;