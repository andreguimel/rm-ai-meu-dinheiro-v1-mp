#!/bin/bash
# Script de atualização rápida para aplicação Docker
# Uso: ./update-docker-app.sh

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 ATUALIZAÇÃO DOCKER - mdinheiro.com.br${NC}"
echo "================================================"

# Função para log com timestamp
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# 1. Verificar se Docker está rodando
log "Verificando Docker..."
if ! docker --version > /dev/null 2>&1; then
    error "Docker não está instalado ou não está rodando!"
    exit 1
fi

# 2. Verificar se existe docker-compose.yml
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    COMPOSE_FILE="docker-compose.yml"
    [ -f "docker-compose.yaml" ] && COMPOSE_FILE="docker-compose.yaml"
    log "Usando $COMPOSE_FILE"
    USE_COMPOSE=true
else
    warning "docker-compose.yml não encontrado, usando comandos docker diretos"
    USE_COMPOSE=false
fi

# 3. Fazer backup do estado atual
log "Fazendo backup do container atual..."
if [ "$USE_COMPOSE" = true ]; then
    docker-compose ps > backup_containers_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null || true
else
    docker ps > backup_containers_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null || true
fi

# 4. Parar containers
log "Parando containers..."
if [ "$USE_COMPOSE" = true ]; then
    docker-compose down
else
    # Tentar parar containers relacionados ao projeto
    CONTAINERS=$(docker ps -q --filter "name=meu-dinheiro" --filter "name=mdinheiro")
    if [ ! -z "$CONTAINERS" ]; then
        docker stop $CONTAINERS
        docker rm $CONTAINERS
    fi
fi

# 5. Atualizar código do Git
log "Atualizando código do repositório..."
if git status > /dev/null 2>&1; then
    git stash push -m "Auto stash before update $(date)" 2>/dev/null || true
    git pull origin main || git pull origin master
    log "Código atualizado com sucesso!"
else
    warning "Não é um repositório Git, pulando atualização do código"
fi

# 6. Rebuild da aplicação
log "Fazendo rebuild da aplicação..."
if [ "$USE_COMPOSE" = true ]; then
    # Com docker-compose
    docker-compose build --no-cache
    if [ $? -eq 0 ]; then
        log "Build com docker-compose concluído!"
    else
        error "Falha no build com docker-compose!"
        exit 1
    fi
else
    # Sem docker-compose, assumir Dockerfile na raiz
    if [ -f "Dockerfile" ]; then
        docker build --no-cache -t mdinheiro-app .
        if [ $? -eq 0 ]; then
            log "Build com Dockerfile concluído!"
        else
            error "Falha no build com Dockerfile!"
            exit 1
        fi
    else
        error "Nem docker-compose.yml nem Dockerfile encontrados!"
        exit 1
    fi
fi

# 7. Verificar se imagem foi criada
log "Verificando imagem criada..."
if [ "$USE_COMPOSE" = true ]; then
    IMAGE_COUNT=$(docker images | grep -c "$(basename $(pwd))" || echo "0")
else
    IMAGE_COUNT=$(docker images | grep -c "mdinheiro-app" || echo "0")
fi

if [ "$IMAGE_COUNT" -gt 0 ]; then
    log "Imagem criada com sucesso!"
else
    error "Imagem não foi criada corretamente!"
    exit 1
fi

# 8. Iniciar containers
log "Iniciando containers..."
if [ "$USE_COMPOSE" = true ]; then
    docker-compose up -d
else
    # Iniciar container sem compose
    docker run -d \
        --name mdinheiro-app \
        -p 80:80 \
        -p 443:443 \
        --restart unless-stopped \
        mdinheiro-app
fi

# 9. Aguardar containers iniciarem
log "Aguardando containers iniciarem..."
sleep 10

# 10. Verificar se containers estão rodando
log "Verificando status dos containers..."
if [ "$USE_COMPOSE" = true ]; then
    RUNNING=$(docker-compose ps | grep -c "Up" || echo "0")
else
    RUNNING=$(docker ps | grep -c "mdinheiro-app" || echo "0")
fi

if [ "$RUNNING" -gt 0 ]; then
    log "✅ Containers estão rodando!"
else
    error "❌ Containers não estão rodando!"
    echo "Status atual:"
    if [ "$USE_COMPOSE" = true ]; then
        docker-compose ps
    else
        docker ps -a | grep mdinheiro
    fi
    exit 1
fi

# 11. Testar se aplicação está respondendo
log "Testando aplicação..."
sleep 5

# Testar localhost primeiro
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200\|301\|302"; then
    log "✅ Aplicação respondendo em localhost!"
else
    warning "⚠️ Aplicação não responde em localhost"
fi

# Testar domínio se disponível
if curl -s -o /dev/null -w "%{http_code}" https://mdinheiro.com.br/ | grep -q "200\|301\|302"; then
    log "✅ Aplicação respondendo em mdinheiro.com.br!"
else
    warning "⚠️ Aplicação não responde em mdinheiro.com.br (pode ser normal se DNS não estiver configurado)"
fi

# 12. Verificar assets específicos
log "Verificando assets..."
if [ "$USE_COMPOSE" = true ]; then
    CONTAINER_NAME=$(docker-compose ps -q | head -1)
else
    CONTAINER_NAME="mdinheiro-app"
fi

if [ ! -z "$CONTAINER_NAME" ]; then
    # Verificar se assets existem no container
    ASSETS_COUNT=$(docker exec $CONTAINER_NAME find /usr/share/nginx/html -name "*.js" -o -name "*.css" 2>/dev/null | wc -l || echo "0")
    if [ "$ASSETS_COUNT" -gt 0 ]; then
        log "✅ Assets encontrados no container ($ASSETS_COUNT arquivos)!"
    else
        warning "⚠️ Assets não encontrados, pode causar tela branca"
        # Tentar fazer build dentro do container
        log "Tentando fazer build dentro do container..."
        docker exec $CONTAINER_NAME npm run build 2>/dev/null || true
    fi
fi

# 13. Mostrar logs recentes
log "Logs recentes dos containers:"
if [ "$USE_COMPOSE" = true ]; then
    docker-compose logs --tail=10
else
    docker logs --tail=10 mdinheiro-app 2>/dev/null || true
fi

# 14. Resumo final
echo ""
echo -e "${GREEN}🎉 ATUALIZAÇÃO CONCLUÍDA!${NC}"
echo "================================================"
echo -e "${BLUE}📋 Resumo:${NC}"
echo "   ✅ Containers parados e atualizados"
echo "   ✅ Código atualizado do Git"
echo "   ✅ Rebuild da aplicação realizado"
echo "   ✅ Containers reiniciados"
echo ""
echo -e "${BLUE}🌐 URLs para testar:${NC}"
echo "   • Local: http://localhost/"
echo "   • Produção: https://mdinheiro.com.br/"
echo ""
echo -e "${BLUE}🔧 Comandos úteis:${NC}"
if [ "$USE_COMPOSE" = true ]; then
    echo "   • Ver logs: docker-compose logs -f"
    echo "   • Status: docker-compose ps"
    echo "   • Parar: docker-compose down"
else
    echo "   • Ver logs: docker logs -f mdinheiro-app"
    echo "   • Status: docker ps"
    echo "   • Parar: docker stop mdinheiro-app"
fi
echo ""
echo -e "${YELLOW}💡 Se ainda houver tela branca:${NC}"
echo "   1. Verifique se os assets foram gerados corretamente"
echo "   2. Teste em modo incógnito/privado"
echo "   3. Limpe o cache do navegador"
echo "   4. Verifique os logs do container"
echo ""
log "Script concluído com sucesso!"