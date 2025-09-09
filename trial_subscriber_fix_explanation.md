# Correção do Problema de Criação de Subscribers para Trials

## Problema Identificado

A tabela `subscribers` não estava sendo preenchida corretamente para usuários em período de teste, causando problemas na detecção do status do trial. O problema tinha várias causas:

### 1. **Conflito de Lógica na Função `create_subscriber_trial`**

- A função estava definindo `subscribed = true` para usuários em trial
- A função `get_user_access_status` considera que uma assinatura paga é quando `subscribed = true` E `subscription_tier != 'Trial'`
- Isso criava uma inconsistência lógica

### 2. **Interferência da Função `check-mercadopago-subscription`**

- Esta função cria registros vazios na tabela `subscribers` quando não encontra assinatura ativa
- Esses registros vazios (sem trial) impediam a criação posterior do trial
- A função `ensure_user_has_trial` só criava trials se NÃO existisse um registro de subscriber

### 3. **Falta de Tratamento para Registros Existentes**

- Não havia lógica para adicionar trial a registros de subscribers já existentes
- Usuários que já tinham sido verificados pelo sistema de assinatura ficavam sem trial

## Soluções Implementadas

### 1. **Correção da Lógica de Trial (`20250109_fix_trial_subscriber_creation.sql`)**

```sql
-- Para usuários em trial:
subscribed = false  -- Trial users NÃO são considerados subscribed
subscription_tier = 'Trial'
trial_start = NOW()
trial_end = NOW() + 7 days
subscription_start = NULL  -- Sem assinatura paga
subscription_end = NULL
```

### 2. **Função Melhorada `ensure_user_has_trial`**

A função agora:

- ✅ Cria subscriber com trial se não existir registro
- ✅ Adiciona trial a registro existente se não tiver histórico de trial
- ✅ Não duplica trials para usuários que já tiveram trial

### 3. **Nova Função `create_or_update_subscriber_trial`**

Função robusta que:

- Verifica se subscriber existe
- Se existe mas não tem trial → adiciona trial
- Se não existe → cria com trial
- Se já tem trial → não faz nada

### 4. **Função de Debug `debug_user_trial_status`**

Para troubleshooting:

```sql
SELECT * FROM debug_user_trial_status('user-uuid-here');
```

Retorna:

- `user_exists`: Se o usuário existe na tabela auth.users
- `user_confirmed`: Se o email foi confirmado
- `subscriber_exists`: Se existe registro na tabela subscribers
- `has_trial_history`: Se já teve trial
- `trial_currently_active`: Se o trial está ativo agora
- Dados completos do trial e assinatura

### 5. **Correção de Registros Existentes**

A migração também corrige registros que foram criados incorretamente:

```sql
UPDATE public.subscribers
SET
  subscribed = false,
  subscription_start = NULL,
  subscription_end = NULL
WHERE
  subscription_tier = 'Trial'
  AND subscribed = true;
```

## Lógica Corrigida

### Estados Possíveis de um Usuário:

1. **Novo Usuário (sem subscriber)**

   - `ensure_user_has_trial()` → cria subscriber com trial
   - `subscribed = false`, `subscription_tier = 'Trial'`

2. **Usuário com Subscriber Vazio (criado por check-mercadopago)**

   - `ensure_user_has_trial()` → adiciona trial ao registro existente
   - Atualiza `trial_start`, `trial_end`, `subscription_tier = 'Trial'`

3. **Usuário com Trial Ativo**

   - `get_user_access_status()` → `trial_active = true`, `access_level = 'trial'`
   - `effective_subscription = true` (tem acesso via trial)

4. **Usuário com Assinatura Paga**

   - `subscribed = true`, `subscription_tier = 'Premium'`
   - `has_paid_subscription = true`, `access_level = 'premium'`

5. **Usuário com Trial Expirado**
   - `trial_active = false` (calculado automaticamente)
   - `access_level = 'none'` (se não tiver assinatura paga)

## Testes Implementados

### 1. **Teste de Criação de Trial (`trial-subscriber-creation.test.ts`)**

- ✅ Cria trial para usuário novo
- ✅ Adiciona trial a subscriber existente sem trial
- ✅ Não duplica trial para usuário que já tem
- ✅ Função de debug retorna informações corretas

### 2. **Teste de Status de Acesso**

- ✅ Usuário em trial tem `access_level = 'trial'`
- ✅ Usuário pago tem `access_level = 'premium'`
- ✅ `effective_subscription` correto para ambos os casos

## Como Verificar se Está Funcionando

### 1. **Verificar Status de um Usuário**

```sql
SELECT * FROM debug_user_trial_status('user-uuid-aqui');
```

### 2. **Verificar Access Status**

```sql
SELECT * FROM get_user_access_status('user-uuid-aqui');
```

### 3. **Criar Trial Manualmente**

```sql
SELECT ensure_user_has_trial('user-uuid-aqui');
```

### 4. **Ver Todos os Subscribers com Trial**

```sql
SELECT
  user_id,
  email,
  subscription_tier,
  subscribed,
  trial_active,
  trial_start,
  trial_end
FROM subscribers
WHERE trial_start IS NOT NULL;
```

## Próximos Passos

1. **Aplicar as Migrações**:

   ```bash
   # Aplicar as correções
   supabase db push
   ```

2. **Testar com Usuário Real**:

   - Criar novo usuário
   - Chamar função start-trial
   - Verificar se subscriber é criado corretamente

3. **Monitorar Analytics**:

   - Verificar se eventos de trial_created estão sendo logados
   - Confirmar que dashboard de analytics funciona

4. **Validar Edge Functions**:
   - Testar start-trial function
   - Verificar se check-mercadopago-subscription não interfere mais

A correção garante que a tabela `subscribers` seja preenchida corretamente e que o sistema de trials funcione de forma consistente e confiável.
