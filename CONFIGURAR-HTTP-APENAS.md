# 🔓 Configurar Sistema para HTTP Apenas (Remover HTTPS)

## ⚠️ **AVISO IMPORTANTE**

Esta configuração remove a segurança HTTPS e deve ser usada apenas para:

- Desenvolvimento local
- Testes internos
- Ambientes que não lidam com dados sensíveis

**NÃO recomendado para produção com dados reais de usuários!**

---

## 📋 **Passos para Aplicar na VPS**

### 1. **Fazer Backup da Configuração Atual**

```bash
# Conectar na VPS
ssh root@161.97.97.169

# Fazer backup do docker-compose.yml atual
cp docker-compose.yml docker-compose.yml.backup-https
```

### 2. **Atualizar o docker-compose.yml na VPS**

```bash
# Parar os containers
docker compose down

# Editar o arquivo (use nano ou vi)
nano docker-compose.yml
```

**Substitua o conteúdo pelas mudanças já feitas no arquivo local:**

- `VITE_APP_URL=http://mdinheiro.com.br` (linha 12)
- Remover todas as configurações HTTPS dos labels do Traefik
- Manter apenas configurações HTTP

### 3. **Recriar a Rede Traefik (Opcional)**

```bash
# Remover rede existente (se necessário)
docker network rm traefik-network

# Criar nova rede
docker network create traefik-network
```

### 4. **Iniciar Traefik Apenas com HTTP**

```bash
# Parar Traefik atual
docker stop traefik-app
docker rm traefik-app

# Iniciar Traefik apenas com HTTP (SEM HTTPS)
docker run -d \
  --name traefik-app \
  --restart unless-stopped \
  --network traefik-network \
  -p 80:80 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  traefik:v3.0 \
  --api.dashboard=true \
  --api.insecure=true \
  --providers.docker=true \
  --providers.docker.exposedbydefault=false \
  --providers.docker.network=traefik-network \
  --entrypoints.web.address=:80
```

### 5. **Iniciar a Aplicação**

```bash
# Iniciar aplicação com nova configuração
docker compose up -d

# Verificar status
docker ps
```

### 6. **Testar Conectividade**

```bash
# Testar HTTP local
curl -I http://localhost

# Testar HTTP domínio
curl -I http://mdinheiro.com.br

# Verificar se não há redirecionamento para HTTPS
curl -v http://mdinheiro.com.br
```

---

## 🔍 **Verificações Pós-Configuração**

### ✅ **O que deve funcionar:**

- `http://mdinheiro.com.br` - ✅ Deve carregar normalmente
- `http://www.mdinheiro.com.br` - ✅ Deve carregar normalmente
- Porta 80 aberta e funcionando

### ❌ **O que NÃO deve funcionar:**

- `https://mdinheiro.com.br` - ❌ Deve dar erro ou timeout
- Porta 443 não deve estar em uso
- Certificados SSL não devem ser gerados

---

## 🔄 **Para Voltar ao HTTPS (Reverter)**

Se quiser voltar ao HTTPS posteriormente:

```bash
# Restaurar backup
cp docker-compose.yml.backup-https docker-compose.yml

# Parar containers
docker compose down

# Remover Traefik HTTP-only
docker stop traefik-app
docker rm traefik-app

# Iniciar Traefik com HTTPS novamente
docker run -d \
  --name traefik-app \
  --restart unless-stopped \
  --network traefik-network \
  -p 80:80 \
  -p 443:443 \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v traefik-certificates:/certificates \
  traefik:v3.0 \
  --api.dashboard=true \
  --providers.docker=true \
  --providers.docker.exposedbydefault=false \
  --providers.docker.network=traefik-network \
  --entrypoints.web.address=:80 \
  --entrypoints.websecure.address=:443 \
  --certificatesresolvers.letsencrypt.acme.email=admin@mdinheiro.com.br \
  --certificatesresolvers.letsencrypt.acme.storage=/certificates/acme.json \
  --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web

# Reiniciar aplicação
docker compose up -d
```

---

## 🛠️ **Troubleshooting**

### Problema: Site não carrega

```bash
# Verificar containers
docker ps

# Verificar logs
docker logs traefik-app
docker logs app-app

# Verificar portas
ss -tlnp | grep :80
```

### Problema: Ainda redireciona para HTTPS

```bash
# Verificar se há cache do navegador
# Limpar cache ou usar modo incógnito

# Verificar configuração do Traefik
docker exec traefik-app cat /etc/traefik/traefik.yml
```

---

## 📝 **Resumo das Mudanças**

1. ✅ **VITE_APP_URL**: `https://` → `http://`
2. ✅ **Traefik Labels**: Removidas configurações HTTPS
3. ✅ **Certificados**: Removido Let's Encrypt
4. ✅ **Redirecionamentos**: Removido redirect para HTTPS
5. ✅ **Porta 443**: Não mais utilizada
6. ✅ **Headers**: Removido `X-Forwarded-Proto=https`

**Resultado**: Sistema funcionando apenas com HTTP na porta 80.
