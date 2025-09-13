#!/bin/bash
# resolver-traefik-critico.sh
# Script para resolver erros críticos do Traefik

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

# 5. Criar rede
log_info "Criando rede traefik-network..."
if docker network create traefik-network 2>/dev/null; then
    log_success "Rede traefik-network criada"
else
    log_warning "Rede traefik-network já existe"
fi

# 6. Preparar diretório para certificados
log_info "Preparando certificados..."
sudo mkdir -p /opt/traefik
sudo touch /opt/traefik/acme.json
sudo chmod 600 /opt/traefik/acme.json
sudo chown root:root /opt/traefik/acme.json
log_success "Certificados preparados"

# 7. Verificar Docker socket
log_info "Verificando Docker socket..."
if [ -S /var/run/docker.sock ]; then
    log_success "Docker socket disponível"
    ls -la /var/run/docker.sock
else
    log_error "Docker socket não encontrado!"
    exit 1
fi

# 8. Recriar Traefik
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

# 9. Aguardar Traefik inicializar
log_info "Aguardando Traefik inicializar..."
sleep 10

# 10. Verificar logs do Traefik
log_info "Verificando logs do Traefik..."
docker logs --tail 20 traefik-app

# 11. Recriar container da aplicação
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

# 12. Aguardar aplicação inicializar
log_info "Aguardando aplicação inicializar..."
sleep 15

# 13. Verificar status final
log_info "Status final dos containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 14. Testar conectividade
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

echo ""
log_info "🎯 COMANDOS RÁPIDOS PARA TESTAR:"
echo "curl -I https://mdinheiro.com.br"
echo "curl -H 'Host: mdinheiro.com.br' http://localhost"
echo "docker logs traefik-app --tail 10"
echo "docker logs app-app --tail 10"