# 🚨 CORREÇÃO URGENTE: Domínio mdinheiro.com.br na VPS

## 🔍 PROBLEMA IDENTIFICADO

O **docker-compose.yml** estava configurado com o domínio errado:
- ❌ Configurado: `meu-dinheiro.com`
- ✅ Correto: `mdinheiro.com.br`

Isso explica por que:
- ✅ IP local (192.168.0.5:3001) funciona no iPhone
- ❌ Domínio (mdinheiro.com.br) não funciona no iPhone

## 🛠️ SOLUÇÃO COMPLETA PARA VPS

### 1. Conectar na VPS
```bash
ssh seu-usuario@seu-servidor-vps
```

### 2. Navegar para o diretório do projeto
```bash
cd /caminho/para/seu/projeto
```

### 3. Parar containers atuais
```bash
docker compose down
# ou se usar versão antiga:
docker-compose down
```

### 4. Editar docker-compose.yml
```bash
nano docker-compose.yml
```

**Alterar as linhas:**
```yaml
# ANTES (ERRADO):
- "traefik.http.routers.app.rule=Host(`meu-dinheiro.com`) || Host(`www.meu-dinheiro.com`)"
- "traefik.http.routers.app-secure.rule=Host(`meu-dinheiro.com`) || Host(`www.meu-dinheiro.com`)"

# DEPOIS (CORRETO):
- "traefik.http.routers.app.rule=Host(`mdinheiro.com.br`) || Host(`www.mdinheiro.com.br`)"
- "traefik.http.routers.app-secure.rule=Host(`mdinheiro.com.br`) || Host(`www.mdinheiro.com.br`)"
```

### 5. Verificar se Traefik está rodando
```bash
docker ps | grep traefik
```

**Se não estiver rodando, iniciar Traefik:**
```bash
# Criar rede se não existir
docker network create traefik-network

# Iniciar Traefik
docker run -d \
  --name traefik-app \
  --restart unless-stopped \
  --network traefik-network \
  -p 80:80 \
  -p 443:443 \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v traefik-certificates:/certificates \
  --label "traefik.enable=true" \
  traefik:v3.0 \
  --api.dashboard=true \
  --api.insecure=true \
  --providers.docker=true \
  --providers.docker.network=traefik-network \
  --providers.docker.exposedbydefault=false \
  --entrypoints.web.address=:80 \
  --entrypoints.websecure.address=:443 \
  --certificatesresolvers.letsencrypt.acme.email=admin@mdinheiro.com.br \
  --certificatesresolvers.letsencrypt.acme.storage=/certificates/acme.json \
  --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
```

### 6. Iniciar aplicação com domínio correto
```bash
docker compose up -d
# ou:
docker-compose up -d
```

### 7. Verificar logs
```bash
# Logs da aplicação
docker logs app-app -f

# Logs do Traefik
docker logs traefik-app -f
```

### 8. Testar conectividade
```bash
# Testar HTTP
curl -H "Host: mdinheiro.com.br" http://localhost

# Testar HTTPS (pode demorar alguns minutos para certificado)
curl -I https://mdinheiro.com.br

# Verificar se Traefik detectou o domínio
curl -s http://localhost:8080/api/http/routers | grep mdinheiro
```

## 🔧 COMANDOS DE DIAGNÓSTICO

### Verificar status dos containers
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Verificar rede Traefik
```bash
docker network inspect traefik-network
```

### Verificar configuração do container
```bash
docker inspect app-app | grep -A 20 "Labels"
```

### Dashboard do Traefik
```bash
# Acessar: http://SEU-IP-VPS:8080
# Verificar se mdinheiro.com.br aparece nos routers
```

## ✅ VERIFICAÇÃO FINAL

1. **Aguardar 2-3 minutos** para certificados SSL
2. **Testar no navegador:** https://mdinheiro.com.br
3. **Testar no iPhone Safari:** https://mdinheiro.com.br
4. **Verificar se não há tela branca**

## 🚨 SE AINDA NÃO FUNCIONAR

### Verificar DNS
```bash
# Verificar se o domínio aponta para o IP correto
nslookup mdinheiro.com.br
dig mdinheiro.com.br
```

### Forçar rebuild completo
```bash
docker compose down
docker system prune -f
docker compose up -d --build
```

### Verificar firewall
```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443

# CentOS/RHEL
sudo firewall-cmd --list-all
sudo firewall-cmd --add-port=80/tcp --permanent
sudo firewall-cmd --add-port=443/tcp --permanent
sudo firewall-cmd --reload
```

## 📱 TESTE ESPECÍFICO PARA IPHONE

Após aplicar as correções:

1. **Limpar cache do Safari** no iPhone
2. **Acessar:** https://mdinheiro.com.br
3. **Verificar se carrega** sem tela branca
4. **Testar navegação** entre páginas

## 🎯 RESULTADO ESPERADO

Após seguir estes passos:
- ✅ https://mdinheiro.com.br deve carregar no iPhone
- ✅ Todas as páginas devem funcionar
- ✅ Não deve haver tela branca
- ✅ SSL/HTTPS funcionando corretamente

---

**💡 DICA:** Se você não tem acesso SSH à VPS, entre em contato com seu provedor de hospedagem para aplicar essas correções.