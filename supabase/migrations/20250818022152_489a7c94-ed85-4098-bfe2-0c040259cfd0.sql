-- Fix the security definer view by making it a regular view with proper RLS
DROP VIEW IF EXISTS public.ia_configuracoes_decrypted;

-- Create a regular view without SECURITY DEFINER to respect RLS
CREATE VIEW public.ia_configuracoes_decrypted AS
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

-- Set proper ownership and permissions
GRANT SELECT ON public.ia_configuracoes_decrypted TO authenticated;