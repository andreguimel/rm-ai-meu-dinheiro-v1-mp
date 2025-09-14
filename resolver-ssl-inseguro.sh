#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🔒 RESOLVER SSL INSEGURO - mdinheiro.com.br"
echo "==========================================="

# 1. Verificar se estamos na VPS
log_info "Verificando ambiente..."
if ! command -v docker &> /dev/null; then
    log_error "Docker não encontrado! Execute este script na VPS."
    exit 1
fi

# 2. Backup da configuração atual
log_info "Fazendo backup..."
BACKUP_DIR=~/backup-ssl-$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR
docker logs traefik-app > $BACKUP_DIR/traefik-logs.txt 2>&1 || true
docker logs app-app > $BACKUP_DIR/app-logs.txt 2>&1 || true
log_success "Backup salvo em: $BACKUP_DIR"

# 3. Verificar status atual
log_info "Verificando status atual..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 4. Parar Traefik
log_info "Parando Traefik..."
docker stop traefik-app 2>/dev/null || true
docker rm traefik-app 2>/dev/null || true

# 5. Limpar certificados problemáticos
log_info "Limpando certificados antigos..."
docker volume rm traefik-certificates 2>/dev/null || true
docker volume create traefik-certificates
log_success "Volume de certificados recriado!"

# 6. Verificar rede
log_info "Verificando rede Traefik..."
if ! docker network ls | grep -q traefik-network; then
    log_info "Criando rede traefik-network..."
    docker network create traefik-network
    log_success "Rede traefik-network criada!"
else
    log_success "Rede traefik-network já existe!"
fi

# 7. Recriar Traefik com SSL correto
log_info "Recriando Traefik com configuração SSL otimizada..."
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
    log_success "Traefik recriado com sucesso!"
else
    log_error "Falha ao recriar Traefik"
    exit 1
fi

# 8. Aguardar inicialização
log_info "Aguardando Traefik inicializar..."
sleep 20

# 9. Verificar se Traefik está rodando
if docker ps | grep -q traefik-app; then
    log_success "Traefik está rodando!"
else
    log_error "Traefik não está rodando!"
    docker logs traefik-app
    exit 1
fi

# 10. Reiniciar aplicação
log_info "Reiniciando aplicação..."
if docker ps | grep -q app-app; then
    docker restart app-app
    log_success "Aplicação reiniciada!"
else
    log_warning "Container app-app não encontrado. Iniciando com docker-compose..."
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        docker compose up -d
    fi
fi

# 11. Aguardar certificado SSL
log_info "Aguardando certificado SSL ser gerado (pode demorar 2-3 minutos)..."
for i in {1..6}; do
    echo -n "."
    sleep 10
done
echo ""

# 12. Verificar logs do Traefik
log_info "Verificando logs do Traefik..."
docker logs --tail 20 traefik-app

# 13. Testar conectividade
log_info "Testando conectividade..."

# Testar se containers estão rodando
log_info "Status dos containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Testar HTTP local
log_info "Testando HTTP local..."
if curl -s -H "Host: mdinheiro.com.br" http://localhost | grep -q "<!DOCTYPE\|<html"; then
    log_success "HTTP funcionando localmente!"
else
    log_warning "HTTP ainda não está funcionando localmente"
fi

# Testar HTTPS local
log_info "Testando HTTPS local..."
if curl -s -k -I https://localhost | head -1 | grep -q "200\|301\|302"; then
    log_success "HTTPS funcionando localmente!"
else
    log_warning "HTTPS ainda não está funcionando localmente"
fi

# Testar domínio externo
log_info "Testando domínio externo..."
if curl -s -k -I https://mdinheiro.com.br | head -1 | grep -q "200\|301\|302"; then
    log_success "HTTPS funcionando externamente!"
else
    log_warning "HTTPS ainda não está funcionando externamente (normal nos primeiros minutos)"
fi

# Verificar certificado
log_info "Verificando certificado SSL..."
if timeout 10 bash -c "echo | openssl s_client -connect mdinheiro.com.br:443 -servername mdinheiro.com.br 2>/dev/null" | grep -q "Verify return code: 0"; then
    log_success "Certificado SSL válido e confiável!"
else
    log_warning "Certificado SSL ainda sendo gerado ou com problemas..."
    
    # Mostrar detalhes do certificado
    log_info "Detalhes do certificado:"
    timeout 10 bash -c "echo | openssl s_client -connect mdinheiro.com.br:443 -servername mdinheiro.com.br 2>/dev/null" | openssl x509 -noout -subject -issuer -dates 2>/dev/null || log_warning "Não foi possível obter detalhes do certificado"
fi

# 14. Verificar API do Traefik
log_info "Verificando API do Traefik..."
if curl -s http://localhost:8080/api/http/routers | grep -q "mdinheiro.com.br"; then
    log_success "Traefik detectou o roteamento para mdinheiro.com.br!"
else
    log_warning "Traefik ainda não detectou o roteamento"
    log_info "Verificando labels do container..."
    docker inspect app-app | grep -A 5 -B 5 "mdinheiro.com.br" || log_warning "Labels não encontradas"
fi

# 15. Verificar DNS
log_info "Verificando DNS..."
DNS_IP=$(nslookup mdinheiro.com.br | grep -A 1 "Name:" | tail -1 | awk '{print $2}' 2>/dev/null)
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null)

if [ "$DNS_IP" = "$SERVER_IP" ]; then
    log_success "DNS configurado corretamente! ($DNS_IP)"
else
    log_warning "DNS pode estar incorreto:"
    echo "  DNS aponta para: $DNS_IP"
    echo "  Servidor IP: $SERVER_IP"
fi

echo ""
log_success "RESOLUÇÃO SSL CONCLUÍDA!"
echo "========================"
log_info "Próximos passos:"
echo "1. Aguarde mais 2-3 minutos se ainda não funcionar"
echo "2. Teste: https://mdinheiro.com.br"
echo "3. Teste no iPhone Safari (limpe o cache primeiro)"
echo "4. Monitore: docker logs -f traefik-app"
echo ""
log_info "Para monitoramento:"
echo "- Dashboard Traefik: http://$SERVER_IP:8080"
echo "- Logs Traefik: docker logs -f traefik-app"
echo "- Logs App: docker logs -f app-app"
echo "- Verificar certificado: openssl s_client -connect mdinheiro.com.br:443"
echo ""
log_info "Se ainda não funcionar:"
echo "1. Aguarde até 10 minutos para Let's Encrypt"
echo "2. Verifique firewall: sudo ufw status"
echo "3. Verifique DNS: nslookup mdinheiro.com.br"
echo "4. Teste em modo privado no navegador"
echo ""
log_success "🎯 TESTE FINAL: Acesse https://mdinheiro.com.br no iPhone Safari!"
log_info "💡 DICA: Se aparecer 'ligação não é privada', aguarde mais alguns minutos e recarregue a página."