#!/bin/bash
# Script de Atualização Docker para VPS - mdinheiro.com.br
# Uso: ./update-vps-docker.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Este script deve ser executado como root (sudo)"
fi

log "🚀 Iniciando atualização Docker da aplicação mdinheiro.com.br"

# 1. Verificar containers atuais
log "📋 Verificando containers atuais..."
docker ps -a

if ! docker ps | grep -q "app-app"; then
    error "Container app-app não está rodando!"
fi

if ! docker ps | grep -q "traefik-app"; then
    warning "Container traefik-app não está rodando!"
fi

# 2. Criar backup da imagem atual
log "📦 Criando backup da imagem atual..."
BACKUP_TAG="app-app:backup-$(date +%Y%m%d-%H%M%S)"
docker commit app-app $BACKUP_TAG
log "✅ Backup criado: $BACKUP_TAG"

# 3. Verificar se existe código fonte mapeado
log "🔍 Verificando mapeamento de volumes..."
VOLUME_INFO=$(docker inspect app-app | grep -A 10 "Mounts" || true)
info "Volume info: $VOLUME_INFO"

# 4. Localizar diretório do projeto
log "📁 Localizando diretório do projeto..."
PROJECT_DIRS=("/opt/app" "/root/app" "/var/www/app" "/home/app")
PROJECT_DIR=""

for dir in "${PROJECT_DIRS[@]}"; do
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        PROJECT_DIR="$dir"
        log "📂 Projeto encontrado em: $PROJECT_DIR"
        break
    fi
done

# 5. Atualizar código fonte (se encontrado)
if [ -n "$PROJECT_DIR" ]; then
    log "📥 Atualizando código fonte..."
    cd "$PROJECT_DIR"
    
    # Verificar se é repositório git
    if [ -d ".git" ]; then
        log "🔄 Fazendo git pull..."
        git pull origin main || git pull origin master || warning "Falha no git pull"
    else
        warning "Não é um repositório git, pulando atualização do código"
    fi
    
    # Verificar se tem node_modules e package.json
    if [ -f "package.json" ]; then
        log "📦 Instalando dependências..."
        npm install --production
        
        log "🔨 Fazendo build da aplicação..."
        npm run build
        log "✅ Build concluído!"
    fi
else
    warning "Diretório do projeto não encontrado, continuando com rebuild do container"
fi

# 6. Obter configuração atual do container
log "⚙️ Obtendo configuração atual do container..."
CONTAINER_CONFIG=$(docker inspect app-app)
NETWORK=$(echo $CONTAINER_CONFIG | jq -r '.[0].NetworkSettings.Networks | keys[0]' 2>/dev/null || echo "traefik-network")
LABELS=$(docker inspect app-app --format='{{range $key, $value := .Config.Labels}}--label "{{$key}}={{$value}}" {{end}}' 2>/dev/null || echo "")

info "Network: $NETWORK"
info "Labels: $LABELS"

# 7. Parar e remover container atual
log "⏹️ Parando container atual..."
docker stop app-app

log "🗑️ Removendo container..."
docker rm app-app

# 8. Localizar Dockerfile
log "🔍 Localizando Dockerfile..."
DOCKERFILE_PATHS=("/root" "/opt/app" "/var/www/app" "$PROJECT_DIR")
DOCKERFILE_DIR=""

for dir in "${DOCKERFILE_PATHS[@]}"; do
    if [ -f "$dir/Dockerfile" ]; then
        DOCKERFILE_DIR="$dir"
        log "📄 Dockerfile encontrado em: $DOCKERFILE_DIR"
        break
    fi
done

if [ -z "$DOCKERFILE_DIR" ]; then
    error "Dockerfile não encontrado! Verifique a estrutura do projeto."
fi

# 9. Rebuild da imagem
log "🔨 Fazendo rebuild da imagem..."
cd "$DOCKERFILE_DIR"
docker build -t app-app . || error "Falha no build da imagem!"
log "✅ Imagem rebuilded com sucesso!"

# 10. Iniciar novo container
log "▶️ Iniciando novo container..."

# Comando base
DOCKER_RUN_CMD="docker run -d --name app-app"

# Adicionar network se encontrado
if [ -n "$NETWORK" ] && [ "$NETWORK" != "null" ]; then
    DOCKER_RUN_CMD="$DOCKER_RUN_CMD --network $NETWORK"
fi

# Adicionar labels padrão para Traefik
DOCKER_RUN_CMD="$DOCKER_RUN_CMD \
  --label 'traefik.enable=true' \
  --label 'traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)' \
  --label 'traefik.http.routers.app.tls=true' \
  --label 'traefik.http.routers.app.tls.certresolver=letsencrypt' \
  --label 'traefik.http.services.app.loadbalancer.server.port=80'"

# Adicionar imagem
DOCKER_RUN_CMD="$DOCKER_RUN_CMD app-app"

# Executar comando
eval $DOCKER_RUN_CMD || error "Falha ao iniciar o container!"

log "✅ Container iniciado com sucesso!"

# 11. Aguardar inicialização
log "⏳ Aguardando inicialização do container..."
sleep 15

# 12. Verificar saúde dos containers
log "🏥 Verificando saúde dos containers..."
docker ps

if docker ps | grep -q "app-app.*Up"; then
    log "✅ Container app-app está rodando!"
else
    error "❌ Container app-app não está rodando!"
fi

# 13. Verificar logs
log "📋 Verificando logs do container..."
docker logs app-app --tail 10

# 14. Testar endpoints
log "🧪 Testando conectividade..."

# Teste interno
if curl -f -s -I http://localhost/ > /dev/null; then
    log "✅ Teste interno (localhost) - OK"
else
    warning "⚠️ Teste interno (localhost) - FALHOU"
fi

# Teste externo
if curl -f -s -I https://mdinheiro.com.br/ > /dev/null; then
    log "✅ Teste externo (mdinheiro.com.br) - OK"
else
    warning "⚠️ Teste externo (mdinheiro.com.br) - FALHOU"
fi

# Teste assets
if curl -f -s -I https://mdinheiro.com.br/assets/ > /dev/null 2>&1; then
    log "✅ Teste assets - OK"
else
    warning "⚠️ Teste assets - Verificar se assets estão sendo servidos corretamente"
fi

# 15. Limpeza de imagens antigas
log "🧹 Limpando imagens não utilizadas..."
docker image prune -f

# 16. Resumo final
log "📊 RESUMO DA ATUALIZAÇÃO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 Containers ativos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📦 Backup criado: $BACKUP_TAG"
echo "🌐 URL: https://mdinheiro.com.br"
echo "📱 Teste no iPhone após a atualização!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log "🎉 Atualização concluída com sucesso!"
log "💡 Para rollback, use: docker stop app-app && docker rm app-app && docker run -d --name app-app [opções] $BACKUP_TAG"

# 17. Verificação final opcional
read -p "Deseja executar verificação completa dos assets? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "🔍 Executando verificação completa..."
    
    # Verificar se assets JS/CSS estão acessíveis
    docker exec app-app find /usr/share/nginx/html -name "*.js" -o -name "*.css" | head -5
    
    # Testar alguns assets específicos
    for asset in $(curl -s https://mdinheiro.com.br/ | grep -oP '(?<=src=")[^"]*\.js' | head -3); do
        if curl -f -s -I "https://mdinheiro.com.br$asset" > /dev/null; then
            log "✅ Asset OK: $asset"
        else
            warning "⚠️ Asset FALHOU: $asset"
        fi
    done
fi

log "🏁 Script finalizado!"