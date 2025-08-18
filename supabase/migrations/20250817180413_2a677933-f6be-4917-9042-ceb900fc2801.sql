-- This migration refreshes the database types by adding a comment to trigger type regeneration
-- Since all tables already exist, we just add a harmless comment to force types to regenerate
COMMENT ON TABLE public.categorias IS 'Categories for income and expenses - updated for type generation';