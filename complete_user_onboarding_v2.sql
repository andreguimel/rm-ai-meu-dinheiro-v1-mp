-- FUNÇÃO SIMPLIFICADA PARA TESTAR INSERÇÃO EM SUBSCRIBERS
-- Execute este SQL no Supabase para substituir a função

CREATE OR REPLACE FUNCTION public.complete_user_onboarding_v2(
  user_id UUID DEFAULT auth.uid(),
  force_recreate BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  organization_name TEXT;
  telefone TEXT;
  user_confirmed BOOLEAN;
  profile_result TEXT := 'not_attempted';
  subscriber_result TEXT := 'not_attempted';
  result JSON;
BEGIN
  -- Log início
  RAISE LOG 'Starting onboarding v2 for user: %', user_id;
  
  -- Get user info
  SELECT 
    email, 
    email_confirmed_at IS NOT NULL,
    COALESCE(raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(raw_user_meta_data->>'organization_name', 'Minha Empresa'),
    COALESCE(raw_user_meta_data->>'telefone', '')
  INTO user_email, user_confirmed, user_name, organization_name, telefone
  FROM auth.users 
  WHERE id = user_id;
  
  -- Validações básicas
  IF user_email IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;
  
  IF NOT user_confirmed THEN
    RETURN json_build_object('success', false, 'message', 'Email not confirmed');
  END IF;
  
  RAISE LOG 'User validated: % (confirmed: %)', user_email, user_confirmed;
  
  -- 1. Tentar criar/atualizar profile
  BEGIN
    INSERT INTO public.profiles (
      id, email, name, organization_name, telefone, updated_at
    ) VALUES (
      user_id, user_email, user_name, organization_name, telefone, NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      organization_name = EXCLUDED.organization_name,
      telefone = EXCLUDED.telefone,
      updated_at = NOW();
    
    profile_result := 'success';
    RAISE LOG 'Profile created/updated successfully for: %', user_email;
    
  EXCEPTION WHEN OTHERS THEN
    profile_result := 'error: ' || SQLERRM;
    RAISE LOG 'Profile error for %: %', user_email, SQLERRM;
  END;
  
  -- 2. Tentar criar subscriber - Abordagem 1: INSERT simples
  BEGIN
    -- Primeiro, verificar se já existe
    IF NOT EXISTS (SELECT 1 FROM public.subscribers WHERE user_id = complete_user_onboarding_v2.user_id) THEN
      INSERT INTO public.subscribers (
        user_id, 
        email, 
        subscribed, 
        subscription_tier,
        trial_start, 
        trial_end, 
        created_at, 
        updated_at
      ) VALUES (
        user_id, 
        user_email, 
        true, 
        'Trial',
        NOW(), 
        NOW() + INTERVAL '7 days',
        NOW(), 
        NOW()
      );
      
      subscriber_result := 'success_new';
      RAISE LOG 'New subscriber created for: %', user_email;
    ELSE
      subscriber_result := 'already_exists';
      RAISE LOG 'Subscriber already exists for: %', user_email;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    subscriber_result := 'error_attempt1: ' || SQLERRM;
    RAISE LOG 'Subscriber creation error (attempt 1) for %: %', user_email, SQLERRM;
    
    -- Abordagem 2: Tentar com UPSERT
    BEGIN
      INSERT INTO public.subscribers (
        user_id, 
        email, 
        subscribed, 
        subscription_tier,
        trial_start, 
        trial_end, 
        created_at, 
        updated_at
      ) VALUES (
        user_id, 
        user_email, 
        true, 
        'Trial',
        NOW(), 
        NOW() + INTERVAL '7 days',
        NOW(), 
        NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        subscription_tier = EXCLUDED.subscription_tier,
        trial_start = EXCLUDED.trial_start,
        trial_end = EXCLUDED.trial_end,
        updated_at = NOW();
      
      subscriber_result := 'success_upsert';
      RAISE LOG 'Subscriber upserted for: %', user_email;
      
    EXCEPTION WHEN OTHERS THEN
      subscriber_result := 'error_attempt2: ' || SQLERRM;
      RAISE LOG 'Subscriber upsert error for %: %', user_email, SQLERRM;
    END;
  END;
  
  -- 3. Verificar resultados finais
  result := json_build_object(
    'success', profile_result = 'success' AND (subscriber_result LIKE 'success%' OR subscriber_result = 'already_exists'),
    'user_id', user_id,
    'email', user_email,
    'profile_result', profile_result,
    'subscriber_result', subscriber_result,
    'trial_end', (NOW() + INTERVAL '7 days')::text
  );
  
  RAISE LOG 'Onboarding v2 completed for %: profile=%, subscriber=%', user_email, profile_result, subscriber_result;
  RETURN result;
  
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding_v2(UUID, BOOLEAN) TO authenticated;

-- Test the function
-- SELECT public.complete_user_onboarding_v2();

-- Verificar resultados
-- SELECT * FROM public.profiles WHERE id = auth.uid();
-- SELECT * FROM public.subscribers WHERE user_id = auth.uid();
