#!/bin/bash

# 🔒 REBUILD COM SSL AUTOMÁTICO - mdinheiro.com.br
# Script que garante SSL funcionando após rebuild da aplicação
# Resolve o problema de ter que reativar SSL manualmente

set -e

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função de log
log_info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    exit 1
}

# Banner
echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════════"
echo "🔒 REBUILD COM SSL AUTOMÁTICO - mdinheiro.com.br"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

# 1. Verificar dependências
log_info "Verificando dependências..."
if ! command -v docker &> /dev/null; then
    log_error "Docker não encontrado!"
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose não encontrado!"
fi

log_success "Dependências verificadas"

# 2. Parar todos os containers
log_info "Parando containers existentes..."
docker-compose down 2>/dev/null || true
docker stop traefik-app app-app 2>/dev/null || true
docker rm traefik-app app-app 2>/dev/null || true
log_success "Containers parados"

# 3. Verificar/Criar rede Traefik
log_info "Verificando rede traefik-network..."
if ! docker network ls | grep -q "traefik-network"; then
    log_info "Criando rede traefik-network..."
    docker network create traefik-network
fi
log_success "Rede traefik-network configurada"

# 4. Verificar/Criar volume de certificados
log_info "Configurando volume de certificados..."
docker volume create traefik-certificates 2>/dev/null || true
log_success "Volume de certificados configurado"

# 5. Iniciar Traefik PRIMEIRO (com SSL)
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
    log_success "Traefik iniciado com SSL!"
else
    log_error "Falha ao iniciar Traefik"
fi

# 6. Aguardar Traefik inicializar
log_info "Aguardando Traefik inicializar (15s)..."
sleep 15

# 7. Build da aplicação
log_info "Fazendo build da aplicação..."
docker-compose build --no-cache
log_success "Build da aplicação concluído"

# 8. Iniciar aplicação
log_info "Iniciando aplicação..."
docker-compose up -d

# 9. Aguardar aplicação inicializar
log_info "Aguardando aplicação inicializar (30s)..."
sleep 30

# 10. Verificar status dos containers
log_info "Verificando status dos containers..."
if docker ps | grep -q "traefik-app.*Up" && docker ps | grep -q "app.*Up"; then
    log_success "Containers rodando corretamente!"
else
    log_warning "Alguns containers podem ter problemas"
    docker ps --format "table {{.Names}}\t{{.Status}}"
fi

# 11. Testar conectividade HTTP
log_info "Testando conectividade HTTP..."
if curl -f -s http://mdinheiro.com.br > /dev/null 2>&1; then
    log_success "HTTP funcionando!"
else
    log_warning "HTTP pode ter problemas"
fi

# 12. Aguardar certificado SSL ser gerado
log_info "Aguardando certificado SSL ser gerado (pode demorar 2-3 minutos)..."
for i in {1..12}; do
    if curl -f -s -k https://mdinheiro.com.br > /dev/null 2>&1; then
        log_success "HTTPS respondendo!"
        break
    fi
    echo -n "."
    sleep 15
done
echo ""

# 13. Verificar certificado SSL
log_info "Verificando certificado SSL..."
if echo | openssl s_client -servername mdinheiro.com.br -connect mdinheiro.com.br:443 2>/dev/null | openssl x509 -noout -checkend 86400 > /dev/null 2>&1; then
    log_success "Certificado SSL válido!"
    
    # Mostrar detalhes do certificado
    CERT_INFO=$(echo | openssl s_client -servername mdinheiro.com.br -connect mdinheiro.com.br:443 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null)
    if [ -n "$CERT_INFO" ]; then
        echo -e "${GREEN}Detalhes do certificado:${NC}"
        echo "$CERT_INFO"
    fi
else
    log_warning "Certificado SSL ainda sendo gerado ou com problemas"
    log_info "Isso é normal na primeira execução - aguarde alguns minutos"
fi

# 14. Mostrar logs recentes
log_info "Logs recentes do Traefik:"
docker logs traefik-app --tail 10

log_info "Logs recentes da aplicação:"
docker-compose logs --tail 10

# 15. Resumo final
echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════════════════"
echo "🎯 REBUILD COM SSL CONCLUÍDO!"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

echo "📊 RESUMO:"
echo "   ✅ Traefik iniciado com SSL automático"
echo "   ✅ Aplicação reconstruída e iniciada"
echo "   ✅ Rede e volumes configurados"
echo "   ✅ Certificados Let's Encrypt configurados"
echo ""
echo "🌐 ACESSO:"
echo "   • Site: https://mdinheiro.com.br"
echo "   • Dashboard Traefik: http://$(curl -s ifconfig.me):8080"
echo ""
echo "🔍 MONITORAMENTO:"
echo "   • Status containers: docker ps"
echo "   • Logs Traefik: docker logs -f traefik-app"
echo "   • Logs App: docker-compose logs -f"
echo "   • Certificados: docker exec traefik-app ls -la /certificates/"
echo ""
echo "🚨 COMANDOS ÚTEIS:"
echo "   • Rebuild completo: ./rebuild-with-ssl.sh"
echo "   • Verificar SSL: curl -I https://mdinheiro.com.br"
echo "   • Reiniciar tudo: docker-compose down && ./rebuild-with-ssl.sh"
echo ""

if docker ps | grep -q "traefik-app.*Up" && docker ps | grep -q "app.*Up"; then
    log_success "🎉 SISTEMA FUNCIONANDO COM SSL AUTOMÁTICO!"
    echo ""
    echo "💡 DICA: Agora você pode usar este script sempre que fizer rebuild"
    echo "   O SSL será configurado automaticamente, sem necessidade de intervenção manual!"
else
    log_warning "⚠️  Alguns containers podem precisar de atenção"
    echo ""
    echo "🔧 TROUBLESHOOTING:"
    echo "   1. Verifique os logs: docker logs traefik-app"
    echo "   2. Teste conectividade: curl -I http://mdinheiro.com.br"
    echo "   3. Aguarde mais alguns minutos para SSL"
fi

log_success "Script concluído!"