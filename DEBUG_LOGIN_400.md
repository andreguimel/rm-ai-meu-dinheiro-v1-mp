# Diagnóstico do Erro 400 - Bad Request no Login

## 🚨 Problema Identificado

```
useAuth.ts:32  POST https://ponxumxwjodpgwhepwxc.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
```

## 🔍 Possíveis Causas do Erro 400

### 1. **Credenciais Inválidas**

- Email ou senha incorretos
- Usuário não existe no sistema
- Email não confirmado

### 2. **Formato de Dados Incorreto**

- Email com formato inválido
- Senha muito curta (< 6 caracteres)
- Caracteres especiais problemáticos

### 3. **Configuração do Supabase**

- URL ou chave pública incorreta
- Problemas de CORS
- Configurações de autenticação no dashboard

### 4. **Problemas de Rede**

- Conexão instável
- Firewall bloqueando requisições
- Proxy ou VPN interferindo

## ✅ Melhorias Implementadas

### 1. **LoginForm.tsx**

- ✅ Adicionado tratamento de erros detalhado
- ✅ Validações de email e senha antes do envio
- ✅ Mensagens de erro específicas para diferentes cenários
- ✅ Logs detalhados no console para debug
- ✅ Toast notifications para feedback visual
- ✅ Estados de loading e error

### 2. **useAuth.ts**

- ✅ Logs detalhados em cada etapa do login
- ✅ Validação prévia de email/senha
- ✅ Melhor tratamento de erros do Supabase
- ✅ Informações de debug no console

## 🧪 Como Testar

### Passos para Reproduzir/Debug:

1. **Abrir DevTools** (F12)
2. **Ir para aba Console** para ver logs detalhados
3. **Tentar fazer login** com diferentes cenários:

#### Cenário A: Credenciais Válidas

- Email: [use um email válido cadastrado]
- Senha: [use a senha correta]
- **Esperado**: Login bem-sucedido ou erro específico

#### Cenário B: Email Inválido

- Email: `email-invalido`
- Senha: `qualquer`
- **Esperado**: Erro de validação antes de enviar

#### Cenário C: Senha Muito Curta

- Email: `test@test.com`
- Senha: `123`
- **Esperado**: Erro de validação antes de enviar

#### Cenário D: Usuário Inexistente

- Email: `naoexiste@test.com`
- Senha: `123456`
- **Esperado**: Erro "Email ou senha incorretos"

### Logs para Observar:

```
🔐 Tentando fazer login com: { email: "..." }
🔐 useAuth.signIn - Iniciando login para: ...
✅/❌ Resultado do login: { data, authError }
```

## 🔧 Próximos Passos se Erro Persistir

### 1. **Verificar Configuração Supabase**

```sql
-- No Supabase SQL Editor, verificar se usuário existe:
SELECT email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'seu@email.com';
```

### 2. **Testar Diretamente no Supabase Dashboard**

- Ir para Authentication > Users
- Tentar criar usuário manualmente
- Verificar configurações de auth

### 3. **Verificar Network Tab**

- Abrir DevTools > Network
- Tentar login
- Ver detalhes da requisição POST falha
- Verificar headers e payload

### 4. **Testar com cURL**

```bash
curl -X POST 'https://ponxumxwjodpgwhepwxc.supabase.co/auth/v1/token?grant_type=password' \
-H 'Content-Type: application/json' \
-H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
-d '{"email":"test@test.com","password":"123456"}'
```

## 📋 Checklist de Verificação

- [ ] Console mostra logs detalhados do login
- [ ] Validações de email/senha funcionam
- [ ] Mensagens de erro são específicas
- [ ] Network tab mostra detalhes da requisição falha
- [ ] Supabase dashboard permite login manual
- [ ] Configurações de auth estão corretas
- [ ] URL e chaves do Supabase estão corretas
