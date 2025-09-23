# Resolução do Erro de Refresh Token do Supabase

## Problema
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

## Causa
O refresh token armazenado no localStorage está corrompido ou expirado, causando falha na autenticação automática.

## Solução Rápida

### 1. Limpar o armazenamento do navegador
Abra o console do navegador (F12) e execute os seguintes comandos:

```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Fazer login novamente
Após a limpeza do cache, faça login novamente com suas credenciais.

## Solução Alternativa (se o problema persistir)

### 1. Verificar configuração do Supabase
O cliente está configurado corretamente em `src/integrations/supabase/client.ts` com:
- `autoRefreshToken: true`
- `persistSession: true`
- `flowType: "pkce"`

### 2. Verificar conectividade
Certifique-se de que a URL do Supabase está acessível:
- URL: https://ponxumxwjodpgwhepwxc.supabase.co

### 3. Reiniciar o servidor de desenvolvimento
Se necessário, reinicie o servidor:
```bash
npm run dev
```

## Prevenção
Este erro geralmente ocorre quando:
- O token expira e não consegue ser renovado
- Há problemas de conectividade com o Supabase
- O localStorage foi corrompido
- Mudanças na configuração do projeto Supabase

## Status
✅ Solução implementada: Limpeza do localStorage
⏳ Próximo passo: Testar login e acesso de administrador