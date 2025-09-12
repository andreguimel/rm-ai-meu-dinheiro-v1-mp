#!/bin/bash

# Script de atualização para aplicação React
# Uso: ./update-deploy.sh

set -e

echo "🚀 Iniciando atualização da aplicação..."

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

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    log_error "package.json não encontrado. Execute este script no diretório da aplicação."
    exit 1
fi

# Backup do .env se existir
if [ -f ".env" ]; then
    log_info "Fazendo backup do arquivo .env..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Parar serviços se estiverem rodando
log_info "Parando serviços..."
sudo systemctl stop nginx || log_warning "Nginx não estava rodando"
sudo pkill -f "node" || log_warning "Nenhum processo Node.js encontrado"
sudo pkill -f "npm" || log_warning "Nenhum processo npm encontrado"

# Atualizar código do repositório
log_info "Atualizando código do repositório..."
git fetch origin
git reset --hard origin/main
git pull origin main

# Instalar/atualizar dependências
log_info "Instalando/atualizando dependências..."
npm ci --production

# Build da aplicação
log_info "Fazendo build da aplicação..."
npm run build

# Verificar se o build foi criado
if [ ! -d "dist" ]; then
    log_error "Build falhou - diretório 'dist' não encontrado"
    exit 1
fi

# Backup do diretório atual do nginx
log_info "Fazendo backup do diretório atual..."
sudo mkdir -p /var/backups/nginx
sudo cp -r /var/www/html /var/backups/nginx/html.backup.$(date +%Y%m%d_%H%M%S) || log_warning "Backup falhou"

# Copiar arquivos para o nginx
log_info "Copiando arquivos para o servidor web..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Reiniciar nginx
log_info "Reiniciando nginx..."
sudo systemctl start nginx
sudo systemctl reload nginx

# Verificar status do nginx
if sudo systemctl is-active --quiet nginx; then
    log_success "Nginx está rodando corretamente"
else
    log_error "Nginx falhou ao iniciar"
    sudo systemctl status nginx
    exit 1
fi

# Limpar cache se necessário
log_info "Limpando cache..."
npm cache clean --force || log_warning "Limpeza de cache falhou"

# Verificar se o site está respondendo
log_info "Verificando se o site está respondendo..."
sleep 5
if curl -f -s http://localhost > /dev/null; then
    log_success "Site está respondendo corretamente"
else
    log_warning "Site pode não estar respondendo corretamente"
fi

log_success "✅ Atualização concluída com sucesso!"
log_info "Acesse: http://$(curl -s ifconfig.me) ou http://mdinheiro.com.br"

echo ""
echo "📋 Resumo da atualização:"
echo "   - Código atualizado do repositório"
echo "   - Dependências atualizadas"
echo "   - Build realizado"
echo "   - Arquivos copiados para /var/www/html"
echo "   - Nginx reiniciado"
echo ""
echo "🔍 Para verificar logs:"
echo "   - Nginx: sudo tail -f /var/log/nginx/error.log"
echo "   - Sistema: sudo journalctl -f"