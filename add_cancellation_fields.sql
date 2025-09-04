-- Script para adicionar campos de cancelamento na tabela subscribers
-- Execute este script no SQL Editor do Supabase Dashboard

-- Adicionar campos de cancelamento
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Dropar a função existente primeiro
DROP FUNCTION IF EXISTS public.get_user_subscription_secure(UUID);

-- Recriar a função get_user_subscription_secure para incluir os novos campos
CREATE FUNCTION public.get_user_subscription_secure(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  subscribed BOOLEAN,
  subscription_tier TEXT,
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  payment_method_type TEXT,
  payment_method_brand TEXT,
  payment_method_last4 TEXT,
  payment_method_exp_month INTEGER,
  payment_method_exp_year INTEGER,
  last_payment_amount INTEGER,
  last_payment_currency TEXT,
  last_payment_status TEXT,
  last_payment_date TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  cancelled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- CRITICAL: Only return data for the authenticated user
  SELECT 
    s.user_id,
    s.email,
    s.subscribed,
    s.subscription_tier,
    s.subscription_start,
    s.subscription_end,
    s.trial_start,
    s.trial_end,
    s.payment_method_type,
    s.payment_method_brand,
    s.payment_method_last4,
    s.payment_method_exp_month,
    s.payment_method_exp_year,
    s.last_payment_amount,
    s.last_payment_currency,
    s.last_payment_status,
    s.last_payment_date,
    s.cancel_at_period_end,
    s.cancelled_at,
    s.updated_at
  FROM public.subscribers s
  WHERE s.user_id = user_uuid
  AND s.user_id = auth.uid() -- DOUBLE CHECK: Ensure user can only see their own data
  LIMIT 1; -- Extra safety: only one record
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_user_subscription_secure(UUID) IS 
'Securely retrieves subscription data for the authenticated user only. Updated to include cancellation tracking fields.';
