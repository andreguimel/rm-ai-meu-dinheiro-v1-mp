#!/bin/bash

# Script de Build e Deploy Otimizado - Resolver Tela Branca iPhone
# Criado para resolver problemas de assets 404 e otimizações mobile

set -e  # Parar em caso de erro

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    exit 1
}

# Banner
echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════════"
echo "🚀 BUILD E DEPLOY OTIMIZADO - RESOLVER TELA BRANCA IPHONE"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

# 1. Verificar dependências Docker
log "🔍 Verificando dependências Docker..."
if ! command -v docker &> /dev/null; then
    error "Docker não encontrado! Instale o Docker primeiro."
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não encontrado! Instale o Docker Compose primeiro."
fi

success "Docker e Docker Compose verificados"

# 2. Parar containers existentes
log "🛑 Parando containers existentes..."
docker-compose down 2>/dev/null || true
docker stop rm-ai-meu-dinheiro 2>/dev/null || true
docker rm rm-ai-meu-dinheiro 2>/dev/null || true
success "Containers parados"

# 3. Verificar rede do Traefik
log "🌐 Verificando rede do Traefik..."
if ! docker network ls | grep -q "traefik-network"; then
    log "Criando rede traefik-network..."
    docker network create traefik-network
fi
success "Rede traefik-network verificada"

# 4. Build da imagem Docker (com build da aplicação incluído)
log "🐳 Construindo imagem Docker (inclui build da aplicação)..."
docker-compose build --no-cache
success "Imagem Docker construída"

# 5. Iniciar aplicação
log "🚀 Iniciando aplicação..."
docker-compose up -d

# 6. Aguardar inicialização
log "⏳ Aguardando inicialização (30s)..."
sleep 30

# 7. Verificar status
log "🔍 Verificando status da aplicação..."
if docker-compose ps | grep -q "Up"; then
    success "Aplicação iniciada com sucesso!"
else
    error "Falha ao iniciar a aplicação"
fi

# 8. Testar conectividade
log "🧪 Testando conectividade..."
CONTAINER_NAME=$(docker-compose ps -q)

if [ -n "$CONTAINER_NAME" ]; then
    CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER_NAME)
    success "Container IP: $CONTAINER_IP"
    
    # Testar se o Nginx está respondendo
    if docker exec $CONTAINER_NAME curl -f http://localhost/ > /dev/null 2>&1; then
        success "Nginx respondendo corretamente"
    else
        warning "Nginx pode não estar respondendo corretamente"
    fi
else
    warning "Não foi possível obter informações do container"
fi

# 9. Mostrar logs recentes
log "📋 Logs recentes da aplicação:"
docker-compose logs --tail=10

# 10. Resumo final
echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════════════════"
echo "✅ DEPLOY DOCKER CONCLUÍDO COM SUCESSO!"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

echo "📊 RESUMO:"
echo "   • Imagem Docker construída com build da aplicação"
echo "   • Container iniciado com Nginx otimizado"
echo "   • Rede Traefik configurada"
echo "   • Otimizações para iPhone incluídas"
echo "   • Healthcheck configurado"
echo ""
echo "🔗 PRÓXIMOS PASSOS:"
echo "   1. Acesse via Traefik (se configurado)"
echo "   2. Teste no iPhone Safari"
echo "   3. Verifique se não há mais tela branca"
echo "   4. Monitore logs: docker-compose logs -f"
echo ""
echo "🚨 COMANDOS DOCKER ÚTEIS:"
echo "   • Ver status: docker-compose ps"
echo "   • Ver logs: docker-compose logs -f"
echo "   • Parar: docker-compose down"
echo "   • Rebuild: docker-compose build --no-cache"
echo "   • Restart: docker-compose restart"
echo "   • Deploy completo: ./build-and-deploy.sh"
echo ""
success "Deploy Docker concluído! Aplicação rodando em container otimizado."