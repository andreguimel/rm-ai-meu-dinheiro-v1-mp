#!/bin/bash

# Script para corrigir domínio mdinheiro.com.br na VPS
# Execute: chmod +x corrigir-dominio-vps.sh && ./corrigir-dominio-vps.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo -e "${BLUE}🚨 CORREÇÃO DOMÍNIO MDINHEIRO.COM.BR${NC}"
echo "==========================================="
echo ""

# 1. Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    log_error "docker-compose.yml não encontrado!"
    log_info "Navegue para o diretório do projeto primeiro."
    exit 1
fi

log_info "Verificando docker-compose.yml..."

# 2. Fazer backup do arquivo atual
log_info "Fazendo backup do docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
log_success "Backup criado!"

# 3. Verificar se o domínio está errado
if grep -q "meu-dinheiro.com" docker-compose.yml; then
    log_warning "Domínio incorreto detectado: meu-dinheiro.com"
    log_info "Corrigindo para: mdinheiro.com.br"
    
    # Corrigir o domínio
    sed -i 's/meu-dinheiro\.com/mdinheiro.com.br/g' docker-compose.yml
    sed -i 's/www\.meu-dinheiro\.com/www.mdinheiro.com.br/g' docker-compose.yml
    
    log_success "Domínio corrigido no docker-compose.yml!"
else
    log_info "Domínio já está correto ou não encontrado."
fi

# 4. Parar containers
log_info "Parando containers..."
if command -v docker-compose &> /dev/null; then
    docker-compose down
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    docker compose down
else
    log_error "Docker Compose não encontrado!"
    exit 1
fi
log_success "Containers parados!"

# 5. Verificar se Traefik está rodando
log_info "Verificando Traefik..."
if ! docker ps | grep -q traefik; then
    log_warning "Traefik não está rodando. Iniciando..."
    
    # Criar rede se não existir
    docker network create traefik-network 2>/dev/null || true
    
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
    
    log_success "Traefik iniciado!"
else
    log_success "Traefik já está rodando!"
fi

# 6. Iniciar aplicação
log_info "Iniciando aplicação..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi
log_success "Aplicação iniciada!"

# 7. Aguardar inicialização
log_info "Aguardando inicialização..."
sleep 15

# 8. Verificar status
log_info "Verificando status dos containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 9. Testar conectividade
log_info "Testando conectividade..."

# Testar se Traefik detectou o domínio
if curl -s http://localhost:8080/api/http/routers | grep -q "mdinheiro.com.br"; then
    log_success "Traefik detectou mdinheiro.com.br!"
else
    log_warning "Traefik ainda não detectou mdinheiro.com.br"
fi

# Testar HTTP local
if curl -s -H "Host: mdinheiro.com.br" http://localhost | grep -q "<!DOCTYPE\|<html"; then
    log_success "HTTP funcionando localmente!"
else
    log_warning "HTTP ainda não está funcionando"
fi

# Testar HTTPS (pode demorar para certificado)
log_info "Testando HTTPS (pode demorar alguns minutos para certificado)..."
if curl -s -k -I https://mdinheiro.com.br | head -1 | grep -q "200\|301\|302"; then
    log_success "HTTPS funcionando!"
else
    log_warning "HTTPS ainda não está funcionando (normal nos primeiros minutos)"
fi

echo ""
log_success "CORREÇÃO CONCLUÍDA!"
echo "====================="
log_info "Próximos passos:"
echo "1. Aguarde 2-3 minutos para certificados SSL"
echo "2. Acesse: https://mdinheiro.com.br"
echo "3. Teste no iPhone Safari"
echo "4. Monitore: docker logs -f app-app"
echo ""
log_info "Para monitoramento:"
echo "- Dashboard Traefik: http://$(curl -s ifconfig.me):8080"
echo "- Logs App: docker logs -f app-app"
echo "- Logs Traefik: docker logs -f traefik-app"
echo ""
log_info "Se ainda não funcionar:"
echo "1. Verifique DNS: nslookup mdinheiro.com.br"
echo "2. Verifique firewall: sudo ufw status"
echo "3. Aguarde mais alguns minutos para SSL"
echo ""
log_success "🎯 TESTE FINAL: Acesse https://mdinheiro.com.br no iPhone!"