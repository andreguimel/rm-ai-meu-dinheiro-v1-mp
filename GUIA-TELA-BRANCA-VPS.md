# 🔧 Guia de Troubleshooting - Tela Branca no Domínio

## Problema Identificado
- ✅ **IP Local funciona**: `http://192.168.0.5:3000/`
- ❌ **Domínio com tela branca**: `https://mdinheiro.com.br`

## Diagnóstico Rápido

### 1. Execute o Script de Diagnóstico
```javascript
// Acesse https://mdinheiro.com.br
// Abra o Console (F12)
// Cole e execute o conteúdo do arquivo debug-tela-branca.js
```

### 2. Verificações Essenciais na VPS

#### A. Variáveis de Ambiente
```bash
# Verifique se o .env está correto na VPS
cat .env

# Deve conter:
VITE_APP_URL="https://mdinheiro.com.br"
PORT="3000"
```

#### B. Build da Aplicação
```bash
# Na VPS, execute:
npm run build

# Verifique se a pasta dist foi criada:
ls -la dist/

# Deve conter:
# - index.html
# - assets/ (com arquivos .js e .css)
```

#### C. Servidor em Produção
```bash
# Para servir o build:
npm run preview

# Ou se usando PM2:
pm2 start "npm run preview" --name "mdinheiro-app"

# Verificar se está rodando:
pm2 status
```

## Possíveis Causas e Soluções

### 🔴 Causa 1: Build não atualizado
**Sintomas**: Funciona local, mas não no domínio

**Solução**:
```bash
# Na VPS:
rm -rf dist/
npm run build
npm run preview
```

### 🔴 Causa 2: Configuração CORS
**Sintomas**: Erros de CORS no console

**Solução**: Já configurado no `vite.config.ts`
```typescript
cors: {
  origin: mode === "production" 
    ? [process.env.VITE_APP_URL || "*"] 
    : true,
  credentials: true
}
```

### 🔴 Causa 3: Proxy Reverso (Nginx/Apache)
**Sintomas**: 502 Bad Gateway ou recursos não carregam

**Solução Nginx**:
```nginx
# Use o arquivo nginx-vps.conf
# Certifique-se que está apontando para a porta correta
proxy_pass http://localhost:3000;
```

### 🔴 Causa 4: Variáveis de Ambiente
**Sintomas**: App carrega mas funcionalidades não funcionam

**Solução**:
```bash
# Verifique se todas as variáveis estão definidas:
echo $VITE_APP_URL
echo $PORT
echo $VITE_SUPABASE_URL
```

### 🔴 Causa 5: Modo de Produção
**Sintomas**: Configurações de desenvolvimento em produção

**Solução**:
```bash
# Defina o modo de produção:
export NODE_ENV=production
npm run build
npm run preview
```

## Checklist de Verificação

### ✅ No Servidor (VPS)
- [ ] `.env` configurado com `VITE_APP_URL="https://mdinheiro.com.br"`
- [ ] `npm run build` executado sem erros
- [ ] Pasta `dist/` existe e tem conteúdo
- [ ] Aplicação rodando na porta 3000
- [ ] Firewall liberado para porta 3000
- [ ] Nginx/Apache configurado corretamente

### ✅ No Navegador (mdinheiro.com.br)
- [ ] Console sem erros JavaScript
- [ ] Elemento `#root` existe e tem conteúdo
- [ ] Recursos (.js, .css) carregam com status 200
- [ ] Sem erros de CORS
- [ ] Variáveis de ambiente acessíveis

## Comandos de Emergência

### Reiniciar Tudo
```bash
# Na VPS:
pkill -f "npm"
rm -rf dist/ node_modules/
npm install
npm run build
NODE_ENV=production npm run preview
```

### Verificar Logs
```bash
# Logs do Nginx:
sudo tail -f /var/log/nginx/error.log

# Logs da aplicação:
pm2 logs mdinheiro-app

# Verificar processos:
ps aux | grep node
netstat -tulpn | grep :3000
```

## Teste Final

1. **Acesse**: `https://mdinheiro.com.br`
2. **Abra Console**: F12 → Console
3. **Execute diagnóstico**: Cole o script `debug-tela-branca.js`
4. **Analise resultados**: Procure por erros em vermelho
5. **Reporte**: Envie os logs do console

## Contatos de Emergência

Se o problema persistir, forneça:
- [ ] Logs do console do navegador
- [ ] Logs do servidor (nginx/pm2)
- [ ] Resultado do script de diagnóstico
- [ ] Configuração atual do nginx
- [ ] Conteúdo do arquivo `.env`