# Resolver Erros Críticos do Traefik

## Problemas Identificados nos Logs
```
2025-09-13T00:12:41Z ERR error="accept tcp [::]:8080: use of closed network connection" entryPointName=traefik
2025-09-13T00:12:41Z ERR error="accept tcp [::]:80: use of closed network connection" entryPointName=web
2025-09-13T00:12:41Z ERR error="accept tcp [::]:443: use of closed network connection" entryPointName=websecure
2025-09-13T00:12:51Z ERR Failed to list containers for docker error="Get \"http://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/json\": context canceled" providerName=docker
```

## Análise dos Erros

### 1. **Conexões de Rede Fechadas**
- Portas 80, 443 e 8080 com "closed network connection"
- Indica que o Traefik não consegue bind nas portas
- Possível conflito de portas ou container mal configurado

### 2. **Falha na Comunicação com Docker**
- Erro ao acessar `/var/run/docker.sock`
- Traefik não consegue descobrir containers
- Socket Docker pode não estar montado corretamente

## Solução Imediata

### Passo 1: Parar e Remover Traefik Problemático
```bash
# Parar Traefik atual
docker stop traefik-app

# Remover container problemático
docker rm traefik-app

# Instalar net-tools se necessário
apt update && apt install -y net-tools

# Verificar se portas estão livres (método 1 - netstat)
netstat -tlnp | grep -E ":(80|443|8080)\s"

# Alternativa se netstat não estiver disponível (método 2 - ss)
ss -tlnp | grep -E ":(80|443|8080)\s"

# Alternativa usando lsof (método 3)
lsof -i :80 -i :443 -i :8080

# Matar processos usando as portas se necessário
sudo fuser -k 80/tcp 443/tcp 8080/tcp
```

### Passo 2: Recriar Traefik Corretamente
```bash
# Criar rede se não existir
docker network create traefik-network 2>/dev/null || echo "Rede já existe"

# Criar diretório para certificados
mkdir -p /opt/traefik
touch /opt/traefik/acme.json
chmod 600 /opt/traefik/acme.json

# Recriar Traefik com configuração correta
docker run -d --name traefik-app \
  --restart unless-stopped \
  --network traefik-network \
  -p 80:80 \
  -p 443:443 \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /opt/traefik/acme.json:/acme.json \
  traefik:v3.0 \
  --api.dashboard=true \
  --api.insecure=true \
  --providers.docker=true \
  --providers.docker.exposedbydefault=false \
  --providers.docker.network=traefik-network \
  --entrypoints.web.address=:80 \
  --entrypoints.websecure.address=:443 \
  --certificatesresolvers.letsencrypt.acme.httpchallenge=true \
  --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web \
  --certificatesresolvers.letsencrypt.acme.email=admin@mdinheiro.com.br \
  --certificatesresolvers.letsencrypt.acme.storage=/acme.json
```

### Passo 3: Verificar e Recriar Container da Aplicação
```bash
# Parar e remover app-app se existir
docker stop app-app 2>/dev/null || true
docker rm app-app 2>/dev/null || true

# Recriar container da aplicação
docker run -d --name app-app \
  --restart unless-stopped \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.entrypoints=web,websecure" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  --label "traefik.http.routers.app.middlewares=redirect-to-https" \
  --label "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https" \
  app-app:latest
```

## Script de Resolução Completa
```bash
#!/bin/bash
# resolver-traefik-critico.sh

set -e

echo "🚨 RESOLVENDO ERROS CRÍTICOS DO TRAEFIK"
echo "======================================"

# Função para log colorido
log_info() { echo -e "\033[34mℹ️  $1\033[0m"; }
log_success() { echo -e "\033[32m✅ $1\033[0m"; }
log_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
log_error() { echo -e "\033[31m❌ $1\033[0m"; }

# 1. Parar todos os containers relacionados
log_info "Parando containers existentes..."
docker stop traefik-app app-app 2>/dev/null || log_warning "Alguns containers já estavam parados"

# 2. Remover containers problemáticos
log_info "Removendo containers problemáticos..."
docker rm traefik-app app-app 2>/dev/null || log_warning "Alguns containers já foram removidos"

# 3. Instalar net-tools se necessário
log_info "Verificando e instalando net-tools..."
if ! command -v netstat &> /dev/null; then
    log_warning "netstat não encontrado, instalando net-tools..."
    apt update && apt install -y net-tools
    log_success "net-tools instalado"
fi

# 4. Verificar portas em uso
log_info "Verificando portas em uso..."
if netstat -tlnp 2>/dev/null | grep -E ":(80|443|8080)\s" | grep -v docker; then
    log_warning "Portas ainda em uso por outros processos"
    log_info "Processos usando as portas:"
    netstat -tlnp | grep -E ":(80|443|8080)\s" || ss -tlnp | grep -E ":(80|443|8080)\s"
    
    read -p "Deseja matar os processos? (y/N): " kill_processes
    if [[ $kill_processes =~ ^[Yy]$ ]]; then
        sudo fuser -k 80/tcp 443/tcp 8080/tcp 2>/dev/null || true
        log_success "Processos terminados"
    fi
else
    log_success "Portas 80, 443 e 8080 estão livres"
fi

# 4. Criar rede
log_info "Criando rede traefik-network..."
if docker network create traefik-network 2>/dev/null; then
    log_success "Rede traefik-network criada"
else
    log_warning "Rede traefik-network já existe"
fi

# 5. Preparar diretório para certificados
log_info "Preparando certificados..."
sudo mkdir -p /opt/traefik
sudo touch /opt/traefik/acme.json
sudo chmod 600 /opt/traefik/acme.json
sudo chown root:root /opt/traefik/acme.json
log_success "Certificados preparados"

# 6. Verificar Docker socket
log_info "Verificando Docker socket..."
if [ -S /var/run/docker.sock ]; then
    log_success "Docker socket disponível"
    ls -la /var/run/docker.sock
else
    log_error "Docker socket não encontrado!"
    exit 1
fi

# 7. Recriar Traefik
log_info "Recriando Traefik com configuração correta..."
docker run -d --name traefik-app \
  --restart unless-stopped \
  --network traefik-network \
  -p 80:80 \
  -p 443:443 \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /opt/traefik/acme.json:/acme.json \
  traefik:v3.0 \
  --api.dashboard=true \
  --api.insecure=true \
  --providers.docker=true \
  --providers.docker.exposedbydefault=false \
  --providers.docker.network=traefik-network \
  --entrypoints.web.address=:80 \
  --entrypoints.websecure.address=:443 \
  --certificatesresolvers.letsencrypt.acme.httpchallenge=true \
  --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web \
  --certificatesresolvers.letsencrypt.acme.email=admin@mdinheiro.com.br \
  --certificatesresolvers.letsencrypt.acme.storage=/acme.json

if [ $? -eq 0 ]; then
    log_success "Traefik recriado com sucesso!"
else
    log_error "Falha ao recriar Traefik"
    exit 1
fi

# 8. Aguardar Traefik inicializar
log_info "Aguardando Traefik inicializar..."
sleep 10

# 9. Verificar logs do Traefik
log_info "Verificando logs do Traefik..."
docker logs --tail 20 traefik-app

# 10. Recriar container da aplicação
log_info "Recriando container da aplicação..."
docker run -d --name app-app \
  --restart unless-stopped \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.entrypoints=web,websecure" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  --label "traefik.http.routers.app.middlewares=redirect-to-https" \
  --label "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https" \
  app-app:latest

if [ $? -eq 0 ]; then
    log_success "Container da aplicação recriado!"
else
    log_error "Falha ao recriar container da aplicação"
    exit 1
fi

# 11. Aguardar aplicação inicializar
log_info "Aguardando aplicação inicializar..."
sleep 15

# 12. Verificar status final
log_info "Status final dos containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 13. Testar conectividade
log_info "Testando conectividade..."

# Testar API do Traefik
if curl -s http://localhost:8080/api/rawdata | grep -q "mdinheiro.com.br"; then
    log_success "Traefik detectou mdinheiro.com.br!"
else
    log_warning "Traefik ainda não detectou mdinheiro.com.br"
fi

# Testar HTTP
if curl -s -H "Host: mdinheiro.com.br" http://localhost | grep -q "<!DOCTYPE\|<html"; then
    log_success "HTTP funcionando!"
else
    log_warning "HTTP ainda não está funcionando"
fi

# Testar HTTPS (pode demorar para certificado)
if curl -s -k -I https://mdinheiro.com.br | head -1 | grep -q "200\|301\|302"; then
    log_success "HTTPS funcionando!"
else
    log_warning "HTTPS ainda não está funcionando (normal nos primeiros minutos)"
fi

echo ""
log_success "RESOLUÇÃO CRÍTICA CONCLUÍDA!"
echo "============================="
log_info "Próximos passos:"
echo "1. Aguarde 2-3 minutos para certificados SSL"
echo "2. Acesse: http://localhost:8080 (Dashboard Traefik)"
echo "3. Teste: https://mdinheiro.com.br"
echo "4. Monitore: docker logs -f traefik-app"
echo "5. Teste no iPhone Safari"
echo ""
log_info "Para monitoramento:"
echo "- Logs Traefik: docker logs -f traefik-app"
echo "- Logs App: docker logs -f app-app"
echo "- Dashboard: http://localhost:8080"
echo "- Status: docker ps"
```

## Verificação Pós-Resolução
```bash
# 1. Verificar containers rodando
docker ps | grep -E "(traefik|app-app)"

# 2. Verificar logs sem erros
docker logs traefik-app --tail 20
docker logs app-app --tail 20

# 3. Testar API Traefik
curl -s http://localhost:8080/api/rawdata | jq .

# 4. Testar roteamento
curl -H "Host: mdinheiro.com.br" http://localhost

# 5. Testar HTTPS
curl -I https://mdinheiro.com.br

# 6. Verificar certificados
curl -s https://mdinheiro.com.br | head -10
```

## Comandos de Emergência
```bash
# Se ainda houver problemas
docker system prune -f
docker network prune -f
sudo systemctl restart docker

# Verificar recursos do sistema
df -h
free -h
docker system df

# Logs detalhados
docker logs traefik-app --details
docker inspect traefik-app
```

## Prevenção de Problemas Futuros
1. **Usar --restart unless-stopped** em todos os containers
2. **Monitorar logs regularmente**
3. **Verificar espaço em disco**
4. **Backup da configuração**
5. **Health checks nos containers**

## Próximos Passos
1. Executar: `chmod +x resolver-traefik-critico.sh && ./resolver-traefik-critico.sh`
2. Aguardar 3-5 minutos para estabilização completa
3. Testar aplicação no navegador
4. Verificar resolução da tela branca no iPhone
5. Implementar monitoramento contínuo