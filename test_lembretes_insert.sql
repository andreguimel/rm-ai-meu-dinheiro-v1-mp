-- Teste de inserção direta na tabela lembretes
-- Execute este script no Supabase SQL Editor para testar se a tabela está funcionando

-- Primeiro, vamos verificar se a tabela existe
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'lembretes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se há usuários na tabela auth.users
SELECT id, email FROM auth.users LIMIT 1;

-- Tentar inserir um lembrete de teste (substitua o user_id por um ID real)
-- INSERT INTO public.lembretes (
--     user_id,
--     titulo,
--     descricao,
--     data_lembrete,
--     concluido,
--     notificado
-- ) VALUES (
--     'SUBSTITUA_PELO_USER_ID_REAL',
--     'Teste de Lembrete',
--     'Este é um teste de inserção direta',
--     NOW() + INTERVAL '1 day',
--     false,
--     false
-- );

-- Verificar lembretes existentes
SELECT * FROM public.lembretes ORDER BY created_at DESC LIMIT 10;