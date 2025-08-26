BEGIN;

-- Método de pagamento (campos separados)
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS payment_method_type text,
  ADD COLUMN IF NOT EXISTS payment_method_brand text,
  ADD COLUMN IF NOT EXISTS payment_method_last4 text,
  ADD COLUMN IF NOT EXISTS payment_method_exp_month integer,
  ADD COLUMN IF NOT EXISTS payment_method_exp_year integer;

-- Último pagamento (padronizado)
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS last_payment_amount integer,       -- em centavos
  ADD COLUMN IF NOT EXISTS last_payment_currency text,
  ADD COLUMN IF NOT EXISTS last_payment_status text,
  ADD COLUMN IF NOT EXISTS last_payment_date timestamptz;

-- Optional: index para consultas por email/user_id ou por status/último pagamento
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers (user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_last_payment_status ON public.subscribers (last_payment_status);

COMMIT;
