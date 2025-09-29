#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
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

echo "🔒 VERIFICAÇÃO COMPLETA DE SSL - mdinheiro.com.br"
echo "=================================================="
echo ""

# 1. Verificar se o domínio resolve
log_info "1. Verificando resolução DNS..."
nslookup mdinheiro.com.br
echo ""

# 2. Verificar conectividade HTTPS
log_info "2. Testando conectividade HTTPS..."
curl -I https://mdinheiro.com.br --connect-timeout 10 --max-time 30
echo ""

# 3. Verificar certificado SSL detalhado
log_info "3. Verificando certificado SSL..."
echo | openssl s_client -servername mdinheiro.com.br -connect mdinheiro.com.br:443 2>/dev/null | openssl x509 -noout -text | grep -E "(Subject:|Issuer:|Not Before:|Not After:|DNS:)"
echo ""

# 4. Verificar validade do certificado
log_info "4. Verificando validade do certificado..."
echo | openssl s_client -servername mdinheiro.com.br -connect mdinheiro.com.br:443 2>/dev/null | openssl x509 -noout -dates
echo ""

# 5. Verificar chain de certificados
log_info "5. Verificando chain de certificados..."
echo | openssl s_client -servername mdinheiro.com.br -connect mdinheiro.com.br:443 -showcerts 2>/dev/null | grep -c "BEGIN CERTIFICATE"
echo ""

# 6. Verificar status dos containers Docker
log_info "6. Verificando containers Docker..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(traefik|app)"
echo ""

# 7. Verificar logs do Traefik
log_info "7. Verificando logs do Traefik (últimas 10 linhas)..."
docker logs traefik-app --tail 10
echo ""

# 8. Verificar certificados no volume do Traefik
log_info "8. Verificando certificados no volume Traefik..."
docker exec traefik-app ls -la /certificates/ 2>/dev/null || log_warning "Não foi possível acessar diretório de certificados"
echo ""

# 9. Verificar configuração do Traefik
log_info "9. Verificando configuração do Traefik..."
docker exec traefik-app cat /etc/traefik/traefik.yml 2>/dev/null || log_warning "Arquivo de configuração não encontrado"
echo ""

# 10. Teste de redirecionamento HTTP -> HTTPS
log_info "10. Testando redirecionamento HTTP -> HTTPS..."
curl -I http://mdinheiro.com.br --connect-timeout 10 --max-time 30
echo ""

# 11. Verificar portas abertas
log_info "11. Verificando portas abertas..."
netstat -tlnp | grep -E ":80|:443|:8080"
echo ""

# 12. Teste SSL Labs (simulado)
log_info "12. Verificando força do SSL..."
echo | openssl s_client -servername mdinheiro.com.br -connect mdinheiro.com.br:443 2>/dev/null | openssl x509 -noout -text | grep -E "(Signature Algorithm|Public Key Algorithm)"
echo ""

# 13. Verificar se há erros recentes nos logs
log_info "13. Verificando erros recentes nos logs do Traefik..."
docker logs traefik-app --since 1h 2>/dev/null | grep -i error || log_success "Nenhum erro encontrado na última hora"
echo ""

# 14. Teste de conectividade interna
log_info "14. Testando conectividade interna..."
docker exec traefik-app wget -qO- http://app-app:80 --timeout=5 | head -1 || log_warning "Falha na conectividade interna"
echo ""

# 15. Verificar dashboard do Traefik
log_info "15. Verificando dashboard do Traefik..."
curl -s http://localhost:8080/api/rawdata | jq '.http.services' 2>/dev/null || log_warning "Dashboard não acessível ou jq não instalado"
echo ""

# Resumo final
echo "🎯 RESUMO DA VERIFICAÇÃO SSL"
echo "============================"

# Teste final de conectividade
if curl -s https://mdinheiro.com.br --connect-timeout 5 --max-time 10 > /dev/null; then
    log_success "✅ Site acessível via HTTPS"
else
    log_error "❌ Site não acessível via HTTPS"
fi

# Verificar se certificado é válido
if echo | openssl s_client -servername mdinheiro.com.br -connect mdinheiro.com.br:443 2>/dev/null | openssl x509 -noout -checkend 86400 > /dev/null; then
    log_success "✅ Certificado SSL válido"
else
    log_error "❌ Certificado SSL inválido ou expirando em 24h"
fi

# Verificar containers
if docker ps | grep -q "traefik-app.*Up" && docker ps | grep -q "app-app.*Up"; then
    log_success "✅ Containers rodando corretamente"
else
    log_error "❌ Problemas com containers"
fi

echo ""
log_info "💡 Para monitoramento contínuo:"
echo "   - Logs Traefik: docker logs -f traefik-app"
echo "   - Dashboard: http://$(curl -s ifconfig.me 2>/dev/null || echo 'SEU-IP'):8080"
echo "   - Teste SSL: curl -I https://mdinheiro.com.br"
echo ""
log_info "🔧 Se houver problemas, execute:"
echo "   - ./resolver-ssl-inseguro.sh"
echo "   - ./resolver-traefik-critico.sh"