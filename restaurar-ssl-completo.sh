#!/bin/bash

# 🔒 RESTAURAR SSL COMPLETO - mdinheiro.com.br
# Script para restaurar SSL/HTTPS com Let's Encrypt no domínio

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🔒 RESTAURANDO SSL PARA mdinheiro.com.br"
echo "========================================"

# 1. Verificar se está rodando como root ou com sudo
if [[ $EUID -ne 0 ]]; then
   log_error "Este script precisa ser executado como root ou com sudo"
   exit 1
fi

# 2. Backup dos logs atuais
BACKUP_DIR=~/backup-ssl-$(date +%Y%m%d-%H%M%S)
log_info "Criando backup em $BACKUP_DIR..."
mkdir -p $BACKUP_DIR
docker logs traefik-app > $BACKUP_DIR/traefik-logs.txt 2>&1 || true
docker logs app-app > $BACKUP_DIR/app-logs.txt 2>&1 || true

# 3. Parar containers atuais
log_info "Parando containers atuais..."
docker stop traefik-app app-app 2>/dev/null || true
docker rm traefik-app app-app 2>/dev/null || true

# 4. Limpar volumes e certificados antigos
log_info "Limpando certificados antigos..."
docker volume rm traefik-certificates 2>/dev/null || true
docker volume create traefik-certificates

# 5. Verificar/criar rede
log_info "Verificando rede traefik-network..."
if ! docker network ls | grep -q traefik-network; then
    log_info "Criando rede traefik-network..."
    docker network create traefik-network
    log_success "Rede traefik-network criada!"
else
    log_success "Rede traefik-network já existe!"
fi

# 6. Verificar DNS antes de continuar
log_info "Verificando DNS do domínio..."
DOMAIN_IP=$(nslookup mdinheiro.com.br | grep -A1 "Name:" | tail -1 | awk '{print $2}')
SERVER_IP=$(curl -s ifconfig.me)

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    log_warning "DNS pode não estar apontando corretamente:"
    log_warning "Domínio aponta para: $DOMAIN_IP"
    log_warning "Servidor IP: $SERVER_IP"
    log_warning "Continuando mesmo assim..."
fi

# 7. Iniciar Traefik com SSL
log_info "Iniciando Traefik com configuração SSL..."
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
  --certificatesresolvers.letsencrypt.acme.httpchallenge=true \
  --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web \
  --log.level=INFO \
  --accesslog=true

if [ $? -eq 0 ]; then
    log_success "Traefik iniciado com sucesso!"
else
    log_error "Falha ao iniciar Traefik"
    exit 1
fi

# 8. Aguardar Traefik inicializar
log_info "Aguardando Traefik inicializar..."
sleep 15

# 9. Atualizar docker-compose.yml para SSL
log_info "Atualizando configuração do docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - VITE_SUPABASE_PROJECT_ID=ponxumxwjodpgwhepwxc
        - VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE
        - VITE_SUPABASE_URL=https://ponxumxwjodpgwhepwxc.supabase.co
        - VITE_ALLOW_TRIALS=true
        - VITE_APP_URL=https://mdinheiro.com.br
    container_name: meu-dinheiro-app
    restart: unless-stopped
    networks:
      - traefik-network
    
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    
    labels:
      # Traefik configuration
      - "traefik.enable=true"
      - "traefik.docker.network=traefik-network"
      
      # HTTP to HTTPS redirect
      - "traefik.http.routers.app-http.rule=Host(`mdinheiro.com.br`) || Host(`www.mdinheiro.com.br`)"
      - "traefik.http.routers.app-http.entrypoints=web"
      - "traefik.http.routers.app-http.middlewares=redirect-to-https"
      
      # HTTPS configuration
      - "traefik.http.routers.app-https.rule=Host(`mdinheiro.com.br`) || Host(`www.mdinheiro.com.br`)"
      - "traefik.http.routers.app-https.entrypoints=websecure"
      - "traefik.http.routers.app-https.tls=true"
      - "traefik.http.routers.app-https.tls.certresolver=letsencrypt"
      
      # Service configuration
      - "traefik.http.services.app.loadbalancer.server.port=80"
      
      # Middlewares
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"
      
      # Security headers
      - "traefik.http.middlewares.security-headers.headers.frameDeny=true"
      - "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"
      - "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"
      - "traefik.http.middlewares.security-headers.headers.referrerPolicy=strict-origin-when-cross-origin"
      - "traefik.http.middlewares.security-headers.headers.forceSTSHeader=true"
      - "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"
      - "traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true"
      - "traefik.http.middlewares.security-headers.headers.stsPreload=true"
      
      # iPhone/Safari optimization
      - "traefik.http.middlewares.iphone-headers.headers.customResponseHeaders.X-UA-Compatible=IE=edge,chrome=1"
      - "traefik.http.middlewares.iphone-headers.headers.customResponseHeaders.X-iPhone-Optimized=true"
      
      # Apply middlewares to HTTPS route
      - "traefik.http.routers.app-https.middlewares=security-headers,iphone-headers"
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

networks:
  traefik-network:
    external: true
EOF

log_success "docker-compose.yml atualizado com configuração SSL!"

# 10. Iniciar aplicação com SSL
log_info "Iniciando aplicação com configuração SSL..."
docker-compose up -d --build

# 11. Aguardar certificado SSL ser gerado
log_info "Aguardando certificado SSL ser gerado (pode demorar 2-3 minutos)..."
for i in {1..12}; do
    echo -n "."
    sleep 10
done
echo ""

# 12. Verificar status dos containers
log_info "Verificando status dos containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 13. Verificar logs do Traefik
log_info "Verificando logs do Traefik..."
docker logs --tail 20 traefik-app

# 14. Testar conectividade
log_info "Testando conectividade..."

# Testar HTTP (deve redirecionar para HTTPS)
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://mdinheiro.com.br)
if [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    log_success "HTTP redirecionando para HTTPS corretamente!"
else
    log_warning "HTTP não está redirecionando (Status: $HTTP_STATUS)"
fi

# Testar HTTPS
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://mdinheiro.com.br)
if [ "$HTTPS_STATUS" = "200" ]; then
    log_success "HTTPS funcionando!"
else
    log_warning "HTTPS ainda não está funcionando (Status: $HTTPS_STATUS)"
fi

# 15. Verificar certificado SSL
log_info "Verificando certificado SSL..."
if echo | openssl s_client -servername mdinheiro.com.br -connect mdinheiro.com.br:443 2>/dev/null | openssl x509 -noout -checkend 86400 > /dev/null; then
    log_success "Certificado SSL válido!"
    
    # Mostrar detalhes do certificado
    CERT_EXPIRY=$(echo | openssl s_client -servername mdinheiro.com.br -connect mdinheiro.com.br:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
    log_info "Certificado expira em: $CERT_EXPIRY"
else
    log_warning "Certificado SSL ainda sendo gerado ou inválido"
fi

# 16. Verificar se Traefik detectou o roteamento
log_info "Verificando API do Traefik..."
if curl -s http://localhost:8080/api/rawdata | grep -q "mdinheiro.com.br"; then
    log_success "Traefik detectou o roteamento para mdinheiro.com.br!"
else
    log_warning "Traefik ainda não detectou o roteamento"
fi

# 17. Resumo final
echo ""
log_success "🎯 RESTAURAÇÃO SSL CONCLUÍDA!"
echo "============================"

# Status final
if docker ps | grep -q "traefik-app.*Up" && docker ps | grep -q "meu-dinheiro-app.*Up"; then
    log_success "✅ Containers rodando corretamente"
else
    log_error "❌ Problemas com containers"
fi

if [ "$HTTPS_STATUS" = "200" ]; then
    log_success "✅ HTTPS funcionando"
else
    log_warning "⚠️  HTTPS ainda não funcionando (aguarde mais alguns minutos)"
fi

echo ""
log_info "📋 Informações importantes:"
echo "   • URL: https://mdinheiro.com.br"
echo "   • Dashboard Traefik: http://$(curl -s ifconfig.me):8080"
echo "   • Backup salvo em: $BACKUP_DIR"

echo ""
log_info "🔧 Comandos úteis:"
echo "   • Logs Traefik: docker logs -f traefik-app"
echo "   • Logs App: docker logs -f meu-dinheiro-app"
echo "   • Verificar certificado: openssl s_client -connect mdinheiro.com.br:443"
echo "   • Reiniciar SSL: docker restart traefik-app"

echo ""
log_info "📱 Teste no iPhone:"
echo "   1. Limpe o cache do Safari"
echo "   2. Acesse: https://mdinheiro.com.br"
echo "   3. Verifique se não aparece mais 'ligação não é privada'"

echo ""
if [ "$HTTPS_STATUS" = "200" ]; then
    log_success "🎉 SSL RESTAURADO COM SUCESSO!"
    log_success "🌐 Acesse: https://mdinheiro.com.br"
else
    log_warning "⏳ Aguarde 2-3 minutos e teste novamente"
    log_info "Se ainda não funcionar, execute: docker logs traefik-app"
fi

echo "========================================"