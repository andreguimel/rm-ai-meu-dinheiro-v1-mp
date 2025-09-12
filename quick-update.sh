#!/bin/bash

# Script de atualização rápida (sem parar nginx)
# Uso: ./quick-update.sh

set -e

echo "⚡ Atualização rápida da aplicação..."

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Verificar diretório
if [ ! -f "package.json" ]; then
    echo "❌ Execute no diretório da aplicação"
    exit 1
fi

# Atualizar código
log_info "Atualizando código..."
git pull origin main

# Verificar se houve mudanças no package.json
if git diff HEAD~1 HEAD --name-only | grep -q "package.json\|package-lock.json"; then
    log_info "Dependências alteradas, instalando..."
    npm ci --production
else
    log_info "Sem mudanças nas dependências"
fi

# Build
log_info "Fazendo build..."
npm run build

# Atualizar arquivos (sem parar nginx)
log_info "Atualizando arquivos..."
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html

# Reload nginx (sem parar)
sudo nginx -s reload

log_success "✅ Atualização rápida concluída!"
echo "🌐 Site: http://mdinheiro.com.br"