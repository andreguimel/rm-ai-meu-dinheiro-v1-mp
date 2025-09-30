#!/bin/bash

echo "🔍 DIAGNÓSTICO RÁPIDO DA STACK VPS"
echo "=================================="

# Sistema Operacional
echo "📋 OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2 2>/dev/null || uname -s)"

# Docker
if command -v docker &> /dev/null; then
    echo "🐳 Docker: ✅ $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
    echo "   Containers ativos: $(docker ps --format '{{.Names}}' | tr '\n' ', ' | sed 's/,$//')"
else
    echo "🐳 Docker: ❌"
fi

# Nginx
if command -v nginx &> /dev/null; then
    echo "🌐 Nginx: ✅ $(nginx -v 2>&1 | cut -d'/' -f2)"
    echo "   Status: $(systemctl is-active nginx 2>/dev/null || echo 'desconhecido')"
else
    echo "🌐 Nginx: ❌"
fi

# Node.js
if command -v node &> /dev/null; then
    echo "📦 Node.js: ✅ $(node --version)"
else
    echo "📦 Node.js: ❌"
fi

# PM2
if command -v pm2 &> /dev/null; then
    echo "⚡ PM2: ✅ $(pm2 --version)"
    echo "   Processos: $(pm2 jlist 2>/dev/null | jq -r '.[].name' 2>/dev/null | tr '\n' ', ' | sed 's/,$//' || echo 'erro ao listar')"
else
    echo "⚡ PM2: ❌"
fi

# PostgreSQL
if command -v psql &> /dev/null; then
    echo "🗄️ PostgreSQL: ✅ $(psql --version | cut -d' ' -f3)"
else
    echo "🗄️ PostgreSQL: ❌ (local)"
fi

# Portas principais
echo "🔌 Portas ativas:"
netstat -tlnp 2>/dev/null | grep -E ':80|:443|:3000|:5432|:6379' | awk '{print "   " $4}' || ss -tlnp | grep -E ':80|:443|:3000|:5432|:6379' | awk '{print "   " $4}'

# SSL
if command -v certbot &> /dev/null; then
    echo "🔒 SSL: ✅ Certbot instalado"
else
    echo "🔒 SSL: ❌ Certbot não encontrado"
fi

# Recursos
echo "💻 Recursos:"
echo "   RAM: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "   Disco: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " usado)"}')"

echo "=================================="