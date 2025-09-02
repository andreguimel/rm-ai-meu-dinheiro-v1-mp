-- Add created_by_shared_user_id field to track which shared user created each item

-- Add the field to receitas table
ALTER TABLE public.receitas 
ADD COLUMN created_by_shared_user_id uuid REFERENCES public.shared_users(id);

-- Add the field to despesas table  
ALTER TABLE public.despesas 
ADD COLUMN created_by_shared_user_id uuid REFERENCES public.shared_users(id);

-- Add the field to transacoes table
ALTER TABLE public.transacoes 
ADD COLUMN created_by_shared_user_id uuid REFERENCES public.shared_users(id);

-- Add the field to dividas table
ALTER TABLE public.dividas 
ADD COLUMN created_by_shared_user_id uuid REFERENCES public.shared_users(id);

-- Add the field to metas table
ALTER TABLE public.metas 
ADD COLUMN created_by_shared_user_id uuid REFERENCES public.shared_users(id);

-- Add indexes for better performance on filtering
CREATE INDEX idx_receitas_created_by_shared_user ON public.receitas(created_by_shared_user_id);
CREATE INDEX idx_despesas_created_by_shared_user ON public.despesas(created_by_shared_user_id);
CREATE INDEX idx_transacoes_created_by_shared_user ON public.transacoes(created_by_shared_user_id);
CREATE INDEX idx_dividas_created_by_shared_user ON public.dividas(created_by_shared_user_id);
CREATE INDEX idx_metas_created_by_shared_user ON public.metas(created_by_shared_user_id);

-- Add comments to document the purpose
COMMENT ON COLUMN public.receitas.created_by_shared_user_id IS 'ID of the shared user who created this receita (null if created by main account owner)';
COMMENT ON COLUMN public.despesas.created_by_shared_user_id IS 'ID of the shared user who created this despesa (null if created by main account owner)';
COMMENT ON COLUMN public.transacoes.created_by_shared_user_id IS 'ID of the shared user who created this transacao (null if created by main account owner)';
COMMENT ON COLUMN public.dividas.created_by_shared_user_id IS 'ID of the shared user who created this divida (null if created by main account owner)';
COMMENT ON COLUMN public.metas.created_by_shared_user_id IS 'ID of the shared user who created this meta (null if created by main account owner)';
