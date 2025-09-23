-- Teste simples da função is_admin
SELECT 
  'Testando função is_admin' as test_description,
  public.is_admin() as is_admin_result;

-- Verificar se a tabela admin_users existe
SELECT 
  'Verificando tabela admin_users' as test_description,
  COUNT(*) as admin_users_count
FROM public.admin_users;

-- Verificar se há usuários admin
SELECT 
  'Usuários admin cadastrados' as test_description,
  user_id,
  active
FROM public.admin_users
WHERE active = true;