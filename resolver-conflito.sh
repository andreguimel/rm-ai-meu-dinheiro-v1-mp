#!/bin/bash
# Script para resolver conflito de container Docker
# Uso: ./resolver-conflito.sh

set -e

echo "🔧 RESOLVENDO CONFLITO DE CONTAINER DOCKER"
echo "==========================================="

# Função para log colorido
log_info() {
    echo -e "\033[34mℹ️  $1\033[0m"
}

log_success() {
    echo -e "\033[32m✅ $1\033[0m"
}

log_warning() {
    echo -e "\033[33m⚠️  $1\033[0m"
}

log_error() {
    echo -e "\033[31m❌ $1\033[0m"
}

# Verificar se Docker está rodando
if ! docker info >/dev/null 2>&1; then
    log_error "Docker não está rodando!"
    exit 1
fi

log_info "Verificando containers existentes..."
docker ps -a | grep app-app || log_warning "Nenhum container app-app encontrado"

# Parar container se estiver rodando
log_info "Parando container app-app..."
if docker stop app-app 2>/dev/null; then
    log_success "Container app-app parado"
else
    log_warning "Container app-app já estava parado ou não existe"
fi

# Remover container
log_info "Removendo container app-app..."
if docker rm app-app 2>/dev/null; then
    log_success "Container app-app removido"
else
    log_warning "Container app-app já estava removido ou não existe"
fi

# Verificar se imagem existe
log_info "Verificando imagem app-app:latest..."
if ! docker images | grep -q "app-app.*latest"; then
    log_error "Imagem app-app:latest não encontrada!"
    log_info "Construindo imagem..."
    if [ -f "Dockerfile" ]; then
        docker build -t app-app:latest .
        log_success "Imagem construída"
    else
        log_error "Dockerfile não encontrado!"
        exit 1
    fi
fi

# Verificar rede Traefik
log_info "Verificando rede traefik-network..."
if ! docker network ls | grep -q traefik-network; then
    log_warning "Rede traefik-network não existe, criando..."
    docker network create traefik-network
    log_success "Rede traefik-network criada"
fi

# Iniciar novo container
log_info "Iniciando novo container app-app..."
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app:latest

if [ $? -eq 0 ]; then
    log_success "Container app-app iniciado com sucesso!"
else
    log_error "Falha ao iniciar container app-app"
    exit 1
fi

# Aguardar container inicializar
log_info "Aguardando container inicializar..."
sleep 5

# Verificar status
log_info "Verificando status do container..."
if docker ps | grep -q app-app; then
    log_success "Container app-app está rodando!"
    docker ps | grep app-app
else
    log_error "Container app-app não está rodando!"
    log_info "Logs do container:"
    docker logs app-app
    exit 1
fi

# Verificar logs iniciais
log_info "Logs iniciais do container:"
docker logs --tail 10 app-app

# Testar conectividade
log_info "Testando conectividade..."
if curl -s -I https://mdinheiro.com.br | head -1 | grep -q "200\|301\|302"; then
    log_success "Aplicação está respondendo!"
else
    log_warning "Aplicação pode não estar respondendo ainda (normal nos primeiros segundos)"
fi

# Verificar containers ativos
log_info "Containers ativos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
log_success "RESOLUÇÃO CONCLUÍDA!"
echo "=================="
log_info "Próximos passos:"
echo "1. Aguarde 30-60 segundos para aplicação inicializar completamente"
echo "2. Teste no navegador: https://mdinheiro.com.br"
echo "3. Teste no iPhone Safari para verificar tela branca"
echo "4. Monitore logs: docker logs -f app-app"
echo ""
log_info "Para monitoramento contínuo:"
echo "watch 'docker ps | grep app'"
echo "docker logs -f app-app"