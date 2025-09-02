-- Função para criar transações via API externa
CREATE OR REPLACE FUNCTION create_external_transaction(
  p_tipo text,
  p_descricao text,
  p_valor numeric,
  p_data date,
  p_categoria_nome text DEFAULT NULL,
  p_shared_user_name text DEFAULT NULL,
  p_account_owner_id uuid
) RETURNS json AS $$
DECLARE
  v_categoria_id uuid;
  v_shared_user_id uuid;
  v_resultado json;
  v_tabela text;
BEGIN
  -- Validar tipo
  IF p_tipo NOT IN ('receita', 'despesa') THEN
    RETURN json_build_object('error', 'Tipo deve ser receita ou despesa');
  END IF;

  -- Buscar categoria se fornecida
  IF p_categoria_nome IS NOT NULL THEN
    SELECT id INTO v_categoria_id 
    FROM categorias 
    WHERE nome = p_categoria_nome 
      AND user_id = p_account_owner_id 
      AND tipo = p_tipo
    LIMIT 1;
  END IF;

  -- Buscar shared user se fornecido
  IF p_shared_user_name IS NOT NULL THEN
    SELECT id INTO v_shared_user_id 
    FROM shared_users 
    WHERE name = p_shared_user_name 
      AND owner_user_id = p_account_owner_id 
      AND active = true
    LIMIT 1;
  END IF;

  -- Determinar tabela
  v_tabela := CASE WHEN p_tipo = 'receita' THEN 'receitas' ELSE 'despesas' END;

  -- Inserir registro
  IF p_tipo = 'receita' THEN
    INSERT INTO receitas (user_id, categoria_id, created_by_shared_user_id, descricao, valor, data)
    VALUES (p_account_owner_id, v_categoria_id, v_shared_user_id, p_descricao, p_valor, p_data)
    RETURNING json_build_object(
      'id', id,
      'descricao', descricao,
      'valor', valor,
      'data', data,
      'tipo', 'receita'
    ) INTO v_resultado;
  ELSE
    INSERT INTO despesas (user_id, categoria_id, created_by_shared_user_id, descricao, valor, data)
    VALUES (p_account_owner_id, v_categoria_id, v_shared_user_id, p_descricao, p_valor, p_data)
    RETURNING json_build_object(
      'id', id,
      'descricao', descricao,
      'valor', valor,
      'data', data,
      'tipo', 'despesa'
    ) INTO v_resultado;
  END IF;

  RETURN json_build_object(
    'success', true,
    'data', v_resultado,
    'message', p_tipo || ' criada com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'error', 'Erro ao criar ' || p_tipo,
      'details', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
