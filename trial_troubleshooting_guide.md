# Guia de Troubleshooting - Sistema de Trial

## 🔍 Diagnóstico Passo a Passo

### 1. **Verificar se as Migrações foram Aplicadas**

```bash
# Aplicar todas as migrações
supabase db push

# Verificar se foram aplicadas
supabase db diff
```

### 2. **Testar Funções do Banco de Dados**

Execute no SQL Editor do Supabase:

```sql
-- 1. Verificar se as funções existem
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'ensure_user_has_trial',
  'get_user_access_status',
  'debug_user_trial_status'
);

-- 2. Verificar estrutura da tabela subscribers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscribers'
AND column_name IN ('trial_start', 'trial_end', 'trial_active');

-- 3. Testar com seu usuário (substitua pelo seu UUID)
SELECT * FROM debug_user_trial_status('SEU-USER-UUID-AQUI'::UUID);
```

### 3. **Verificar Logs da Edge Function**

No Supabase Dashboard → Edge Functions → start-trial → Logs:

Procure por:

- ✅ `"Function started"`
- ✅ `"User authenticated successfully"`
- ❌ `"Error creating trial using database function"`
- ❌ `"Trial creation returned false"`

### 4. **Testar Manualmente a Criação de Trial**

```sql
-- Substitua pelo seu UUID de usuário
SELECT ensure_user_has_trial('SEU-USER-UUID-AQUI'::UUID);

-- Verificar resultado
SELECT * FROM get_user_access_status('SEU-USER-UUID-AQUI'::UUID);

-- Ver dados do subscriber
SELECT * FROM subscribers WHERE user_id = 'SEU-USER-UUID-AQUI'::UUID;
```

### 5. **Verificar Autenticação**

No console do navegador (F12):

```javascript
// Verificar se usuário está autenticado
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("User:", user);

// Verificar sessão
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("Session:", session);

// Testar chamada da função
const { data, error } = await supabase.functions.invoke("start-trial");
console.log("Start trial result:", { data, error });
```

### 6. **Verificar ProtectedRoute**

No console do navegador, procure por logs:

- `"🆕 ProtectedRoute - Verificando necessidade de trial automático"`
- `"✅ Trial criado automaticamente para novo usuário"`
- `"⚠️ Falha na criação automática de trial"`

## 🚨 Problemas Comuns e Soluções

### **Problema 1: Função `ensure_user_has_trial` não existe**

**Solução:**

```bash
supabase db push
```

Se ainda não funcionar, execute manualmente:

```sql
-- Cole o conteúdo de 20250109_trial_system_complete_fix.sql
```

### **Problema 2: Usuário não confirmado**

**Verificar:**

```sql
SELECT email, email_confirmed_at
FROM auth.users
WHERE id = 'SEU-USER-UUID'::UUID;
```

**Solução:** Confirmar email do usuário no Supabase Dashboard → Authentication → Users

### **Problema 3: Subscriber já existe sem trial**

**Verificar:**

```sql
SELECT * FROM subscribers WHERE user_id = 'SEU-USER-UUID'::UUID;
```

**Solução:** Executar função que adiciona trial a subscriber existente:

```sql
SELECT ensure_user_has_trial('SEU-USER-UUID'::UUID);
```

### **Problema 4: RLS (Row Level Security) bloqueando**

**Verificar políticas:**

```sql
SELECT * FROM pg_policies WHERE tablename = 'subscribers';
```

**Solução temporária (apenas para teste):**

```sql
-- CUIDADO: Só para debug, remover depois
ALTER TABLE subscribers DISABLE ROW LEVEL SECURITY;
```

### **Problema 5: Edge Function com erro**

**Verificar logs detalhados:**

1. Supabase Dashboard → Edge Functions → start-trial → Logs
2. Procurar por stack traces e mensagens de erro

**Solução comum:**

```sql
-- Verificar se função RPC existe
SELECT * FROM pg_proc WHERE proname = 'ensure_user_has_trial';
```

## 🧪 Script de Teste Completo

Execute este script para testar tudo:

```sql
-- 1. Verificar usuário atual
SELECT
  'Current user:' as info,
  auth.uid() as user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- 2. Verificar status atual
SELECT * FROM debug_user_trial_status(auth.uid());

-- 3. Tentar criar trial
SELECT
  'Trial creation result:' as info,
  ensure_user_has_trial(auth.uid()) as success;

-- 4. Verificar status após criação
SELECT * FROM get_user_access_status(auth.uid());

-- 5. Ver dados do subscriber
SELECT
  'Subscriber data:' as info,
  user_id,
  email,
  subscription_tier,
  subscribed,
  trial_start,
  trial_end,
  trial_active
FROM subscribers
WHERE user_id = auth.uid();
```

## 📋 Checklist de Verificação

- [ ] Migrações aplicadas (`supabase db push`)
- [ ] Funções existem no banco
- [ ] Usuário está autenticado
- [ ] Email do usuário está confirmado
- [ ] Edge Function start-trial está funcionando
- [ ] Não há erros nos logs
- [ ] RLS não está bloqueando operações
- [ ] Tabela subscribers tem estrutura correta

## 🆘 Se Nada Funcionar

1. **Reset completo:**

```sql
-- Deletar subscriber existente (CUIDADO!)
DELETE FROM subscribers WHERE user_id = auth.uid();

-- Tentar criar novamente
SELECT ensure_user_has_trial(auth.uid());
```

2. **Verificar no Supabase Dashboard:**

   - Authentication → Users → Seu usuário → Confirmar email
   - Database → subscribers → Ver registros
   - Edge Functions → start-trial → Testar manualmente

3. **Logs detalhados:**
   - Console do navegador (F12)
   - Supabase Dashboard → Logs
   - Edge Functions → Logs

## 📞 Informações para Debug

Quando reportar o problema, inclua:

1. **Resultado do debug:**

```sql
SELECT * FROM debug_user_trial_status(auth.uid());
```

2. **Logs da Edge Function** (últimas 10 linhas)

3. **Dados do subscriber:**

```sql
SELECT * FROM subscribers WHERE user_id = auth.uid();
```

4. **Erros no console do navegador**

5. **Resultado do teste manual:**

```sql
SELECT ensure_user_has_trial(auth.uid());
```

Execute estes passos e me informe onde está falhando para podermos corrigir especificamente o problema!
