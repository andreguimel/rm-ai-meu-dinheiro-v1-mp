#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔧 RESOLVER PROBLEMAS COM CONTAINERS"
echo "===================================="
echo ""

# 1. Verificar status atual dos containers
log_info "1. Verificando status atual dos containers..."
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.State}}"
echo ""

# 2. Verificar se containers existem mas estão parados
log_info "2. Verificando containers parados..."
STOPPED_CONTAINERS=$(docker ps -a --filter "status=exited" --format "{{.Names}}" | grep -E "(traefik|app)")

if [ ! -z "$STOPPED_CONTAINERS" ]; then
    log_warning "Containers parados encontrados:"
    echo "$STOPPED_CONTAINERS"
    echo ""
    
    log_info "Iniciando containers parados..."
    echo "$STOPPED_CONTAINERS" | while read container; do
        if [ ! -z "$container" ]; then
            log_info "Iniciando container: $container"
            docker start "$container"
        fi
    done
    echo ""
fi

# 3. Verificar se containers não existem
log_info "3. Verificando se containers existem..."
if ! docker ps -a | grep -q "traefik-app"; then
    log_error "Container traefik-app não existe!"
    NEED_RECREATE=true
fi

if ! docker ps -a | grep -q "app-app"; then
    log_error "Container app-app não existe!"
    NEED_RECREATE=true
fi

# 4. Recriar containers se necessário
if [ "$NEED_RECREATE" = true ]; then
    log_warning "Containers não existem. Recriando com docker-compose..."
    
    # Verificar se docker-compose.yml existe
    if [ -f "docker-compose.yml" ]; then
        log_info "Parando containers existentes..."
        docker-compose down
        
        log_info "Recriando containers..."
        docker-compose up -d
        
        log_info "Aguardando containers iniciarem..."
        sleep 10
    else
        log_error "Arquivo docker-compose.yml não encontrado!"
        log_info "Criando docker-compose.yml básico..."
        
        cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  traefik:
    image: traefik:v2.9
    container_name: traefik-app
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certificates:/certificates
    networks:
      - web
    command:
      - --api.dashboard=true
      - --api.insecure=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.httpchallenge=true
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
      - --certificatesresolvers.letsencrypt.acme.email=admin@mdinheiro.com.br
      - --certificatesresolvers.letsencrypt.acme.storage=/certificates/acme.json
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https

  app:
    build: .
    container_name: app-app
    restart: unless-stopped
    networks:
      - web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
      - "traefik.http.services.app.loadbalancer.server.port=80"
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  web:
    external: true

volumes:
  traefik-certificates:
    external: true
EOF
        
        log_info "Criando rede e volume..."
        docker network create web 2>/dev/null || true
        docker volume create traefik-certificates 2>/dev/null || true
        
        log_info "Iniciando containers..."
        docker-compose up -d
    fi
fi

# 5. Verificar health dos containers
log_info "5. Verificando health dos containers..."
sleep 5

# Verificar Traefik
if docker ps | grep -q "traefik-app.*Up"; then
    log_success "✅ Traefik rodando"
else
    log_error "❌ Traefik com problemas"
    log_info "Logs do Traefik:"
    docker logs traefik-app --tail 10
fi

# Verificar App
if docker ps | grep -q "app-app.*Up"; then
    log_success "✅ App rodando"
    
    # Verificar health check
    HEALTH_STATUS=$(docker inspect app-app --format='{{.State.Health.Status}}' 2>/dev/null || echo "no-healthcheck")
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        log_success "✅ App healthy"
    elif [ "$HEALTH_STATUS" = "unhealthy" ]; then
        log_warning "⚠️ App unhealthy"
    else
        log_info "ℹ️ Health check: $HEALTH_STATUS"
    fi
else
    log_error "❌ App com problemas"
    log_info "Logs do App:"
    docker logs app-app --tail 10
fi

# 6. Verificar conectividade interna
log_info "6. Testando conectividade interna..."
if docker exec traefik-app wget -qO- http://app-app:80 --timeout=5 >/dev/null 2>&1; then
    log_success "✅ Conectividade interna OK"
else
    log_warning "⚠️ Problemas de conectividade interna"
fi

# 7. Verificar portas
log_info "7. Verificando portas expostas..."
netstat -tlnp | grep -E ":80|:443|:8080" || log_warning "Algumas portas podem não estar abertas"

# 8. Teste final
log_info "8. Teste final de conectividade..."
if curl -s https://mdinheiro.com.br --connect-timeout 5 --max-time 10 >/dev/null; then
    log_success "✅ Site acessível via HTTPS"
else
    log_error "❌ Site não acessível"
fi

echo ""
echo "🎯 RESUMO FINAL"
echo "==============="

# Status dos containers
if docker ps | grep -q "traefik-app.*Up" && docker ps | grep -q "app-app.*Up"; then
    log_success "✅ Containers rodando corretamente"
else
    log_error "❌ Ainda há problemas com containers"
    echo ""
    log_info "🔧 Comandos para debug:"
    echo "   docker ps -a"
    echo "   docker logs traefik-app"
    echo "   docker logs app-app"
    echo "   docker-compose logs"
fi

echo ""
log_info "💡 Monitoramento:"
echo "   - Status: docker ps"
echo "   - Logs: docker logs -f traefik-app"
echo "   - Dashboard: http://$(curl -s ifconfig.me 2>/dev/null || echo 'SEU-IP'):8080"
echo "   - Site: https://mdinheiro.com.br"