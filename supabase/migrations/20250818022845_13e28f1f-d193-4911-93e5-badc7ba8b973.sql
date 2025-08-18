-- Update RLS policies to support shared users using main account user_id

-- Drop existing policies for key tables
DROP POLICY IF EXISTS "Users can view their own despesas" ON public.despesas;
DROP POLICY IF EXISTS "Users can create their own despesas" ON public.despesas;
DROP POLICY IF EXISTS "Users can update their own despesas" ON public.despesas;
DROP POLICY IF EXISTS "Users can delete their own despesas" ON public.despesas;

-- Create new policies for despesas with shared access
CREATE POLICY "Users can view account despesas" 
ON public.despesas 
FOR SELECT 
USING (public.has_account_access(user_id));

CREATE POLICY "Users can create account despesas" 
ON public.despesas 
FOR INSERT 
WITH CHECK (public.get_main_account_user_id(auth.uid()) = user_id);

CREATE POLICY "Users can update account despesas" 
ON public.despesas 
FOR UPDATE 
USING (public.has_account_access(user_id));

CREATE POLICY "Users can delete account despesas" 
ON public.despesas 
FOR DELETE 
USING (public.has_account_access(user_id));

-- Update receitas policies
DROP POLICY IF EXISTS "Users can view their own receitas" ON public.receitas;
DROP POLICY IF EXISTS "Users can create their own receitas" ON public.receitas;
DROP POLICY IF EXISTS "Users can update their own receitas" ON public.receitas;
DROP POLICY IF EXISTS "Users can delete their own receitas" ON public.receitas;

CREATE POLICY "Users can view account receitas" 
ON public.receitas 
FOR SELECT 
USING (public.has_account_access(user_id));

CREATE POLICY "Users can create account receitas" 
ON public.receitas 
FOR INSERT 
WITH CHECK (public.get_main_account_user_id(auth.uid()) = user_id);

CREATE POLICY "Users can update account receitas" 
ON public.receitas 
FOR UPDATE 
USING (public.has_account_access(user_id));

CREATE POLICY "Users can delete account receitas" 
ON public.receitas 
FOR DELETE 
USING (public.has_account_access(user_id));

-- Update categorias policies
DROP POLICY IF EXISTS "Users can view their own categorias" ON public.categorias;
DROP POLICY IF EXISTS "Users can create their own categorias" ON public.categorias;
DROP POLICY IF EXISTS "Users can update their own categorias" ON public.categorias;
DROP POLICY IF EXISTS "Users can delete their own categorias" ON public.categorias;

CREATE POLICY "Users can view account categorias" 
ON public.categorias 
FOR SELECT 
USING (public.has_account_access(user_id));

CREATE POLICY "Users can create account categorias" 
ON public.categorias 
FOR INSERT 
WITH CHECK (public.get_main_account_user_id(auth.uid()) = user_id);

CREATE POLICY "Users can update account categorias" 
ON public.categorias 
FOR UPDATE 
USING (public.has_account_access(user_id));

CREATE POLICY "Users can delete account categorias" 
ON public.categorias 
FOR DELETE 
USING (public.has_account_access(user_id));

-- Update dividas policies
DROP POLICY IF EXISTS "Users can view their own dividas" ON public.dividas;
DROP POLICY IF EXISTS "Users can create their own dividas" ON public.dividas;
DROP POLICY IF EXISTS "Users can update their own dividas" ON public.dividas;
DROP POLICY IF EXISTS "Users can delete their own dividas" ON public.dividas;

CREATE POLICY "Users can view account dividas" 
ON public.dividas 
FOR SELECT 
USING (public.has_account_access(user_id));

CREATE POLICY "Users can create account dividas" 
ON public.dividas 
FOR INSERT 
WITH CHECK (public.get_main_account_user_id(auth.uid()) = user_id);

CREATE POLICY "Users can update account dividas" 
ON public.dividas 
FOR UPDATE 
USING (public.has_account_access(user_id));

CREATE POLICY "Users can delete account dividas" 
ON public.dividas 
FOR DELETE 
USING (public.has_account_access(user_id));