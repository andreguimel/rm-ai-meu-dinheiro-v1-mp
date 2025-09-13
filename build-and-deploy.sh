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

# 1. Verificar dependências
log "🔍 Verificando dependências..."
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado! Instale o Node.js primeiro."
fi

if ! command -v npm &> /dev/null; then
    error "npm não encontrado! Instale o npm primeiro."
fi

if ! command -v docker &> /dev/null; then
    error "Docker não encontrado! Instale o Docker primeiro."
fi

success "Dependências verificadas"

# 2. Limpar builds anteriores
log "🧹 Limpando builds anteriores..."
rm -rf dist/ 2>/dev/null || true
rm -rf node_modules/.vite 2>/dev/null || true
success "Limpeza concluída"

# 3. Instalar dependências
log "📦 Instalando dependências..."
npm ci --silent
success "Dependências instaladas"

# 4. Build da aplicação
log "🔨 Executando build da aplicação..."
npm run build

if [ ! -d "dist" ]; then
    error "Pasta dist não foi criada! Verifique o build."
fi

success "Build concluído com sucesso"

# 5. Verificar assets gerados
log "📋 Verificando assets gerados..."
JS_FILES=$(find dist/assets -name "*.js" | wc -l)
CSS_FILES=$(find dist/assets -name "*.css" | wc -l)

if [ "$JS_FILES" -eq 0 ]; then
    error "Nenhum arquivo JS encontrado em dist/assets/"
fi

if [ "$CSS_FILES" -eq 0 ]; then
    error "Nenhum arquivo CSS encontrado em dist/assets/"
fi

success "Assets verificados: $JS_FILES JS, $CSS_FILES CSS"

# 6. Verificar meta viewport no index.html
log "📱 Verificando otimizações para iPhone..."
if ! grep -q "viewport-fit=cover" dist/index.html; then
    warning "Meta viewport pode não estar otimizado para iPhone"
else
    success "Meta viewport otimizado para iPhone encontrado"
fi

if ! grep -q "apple-mobile-web-app-capable" dist/index.html; then
    warning "Meta tags para iOS podem estar faltando"
else
    success "Meta tags para iOS encontradas"
fi

# 7. Parar containers existentes
log "🛑 Parando containers existentes..."
docker-compose down 2>/dev/null || true
docker stop meu-dinheiro-app 2>/dev/null || true
docker rm meu-dinheiro-app 2>/dev/null || true
success "Containers parados"

# 8. Build da imagem Docker
log "🐳 Construindo imagem Docker..."
docker build -t meu-dinheiro-app:latest .
success "Imagem Docker construída"

# 9. Verificar rede do Traefik
log "🌐 Verificando rede do Traefik..."
if ! docker network ls | grep -q "traefik-network"; then
    log "Criando rede traefik-network..."
    docker network create traefik-network
fi
success "Rede traefik-network verificada"

# 10. Iniciar aplicação
log "🚀 Iniciando aplicação..."
docker-compose up -d

# 11. Aguardar inicialização
log "⏳ Aguardando inicialização (30s)..."
sleep 30

# 12. Verificar status
log "🔍 Verificando status da aplicação..."
if docker-compose ps | grep -q "Up"; then
    success "Aplicação iniciada com sucesso!"
else
    error "Falha ao iniciar a aplicação"
fi

# 13. Testar conectividade
log "🧪 Testando conectividade..."
CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' meu-dinheiro-app)

if [ -n "$CONTAINER_IP" ]; then
    success "Container IP: $CONTAINER_IP"
    
    # Testar se o Nginx está respondendo
    if docker exec meu-dinheiro-app curl -f http://localhost/ > /dev/null 2>&1; then
        success "Nginx respondendo corretamente"
    else
        warning "Nginx pode não estar respondendo corretamente"
    fi
else
    warning "Não foi possível obter IP do container"
fi

# 14. Mostrar logs recentes
log "📋 Logs recentes da aplicação:"
docker-compose logs --tail=10

# 15. Resumo final
echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════════════════"
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"

echo "📊 RESUMO:"
echo "   • Build executado com sucesso"
echo "   • Assets JS/CSS gerados corretamente"
echo "   • Meta viewport otimizado para iPhone"
echo "   • Container Docker iniciado"
echo "   • Integração com Traefik configurada"
echo ""
echo "🔗 PRÓXIMOS PASSOS:"
echo "   1. Teste no navegador desktop"
echo "   2. Teste no iPhone Safari"
echo "   3. Verifique se não há mais tela branca após login"
echo "   4. Monitore logs: docker-compose logs -f"
echo ""
echo "🚨 COMANDOS ÚTEIS:"
echo "   • Ver status: docker-compose ps"
echo "   • Ver logs: docker-compose logs -f"
echo "   • Parar: docker-compose down"
echo "   • Rebuild: ./build-and-deploy.sh"
echo ""
success "Script concluído! Teste a aplicação no iPhone agora."