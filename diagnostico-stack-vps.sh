#!/bin/bash

echo "=========================================="
echo "🔍 DIAGNÓSTICO COMPLETO DA STACK VPS"
echo "=========================================="
echo ""

# Informações do Sistema Operacional
echo "📋 SISTEMA OPERACIONAL:"
echo "----------------------------------------"
echo "Distribuição:"
cat /etc/os-release 2>/dev/null || echo "Arquivo /etc/os-release não encontrado"
echo ""
echo "Kernel:"
uname -a
echo ""
echo "Arquitetura:"
arch
echo ""

# Informações de Hardware
echo "💻 HARDWARE:"
echo "----------------------------------------"
echo "CPU:"
lscpu | grep "Model name" || echo "lscpu não disponível"
echo ""
echo "Memória:"
free -h
echo ""
echo "Disco:"
df -h
echo ""

# Serviços em execução
echo "🔧 SERVIÇOS EM EXECUÇÃO:"
echo "----------------------------------------"
echo "Serviços systemd ativos:"
systemctl list-units --type=service --state=active | head -20
echo ""

# Docker
echo "🐳 DOCKER:"
echo "----------------------------------------"
if command -v docker &> /dev/null; then
    echo "✅ Docker instalado"
    echo "Versão do Docker:"
    docker --version
    echo ""
    echo "Containers em execução:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "Imagens Docker:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    echo ""
    echo "Docker Compose:"
    if command -v docker-compose &> /dev/null; then
        echo "✅ Docker Compose instalado"
        docker-compose --version
    else
        echo "❌ Docker Compose não encontrado"
    fi
else
    echo "❌ Docker não instalado"
fi
echo ""

# Nginx
echo "🌐 NGINX:"
echo "----------------------------------------"
if command -v nginx &> /dev/null; then
    echo "✅ Nginx instalado"
    nginx -v
    echo ""
    echo "Status do Nginx:"
    systemctl status nginx --no-pager -l
    echo ""
    echo "Configurações ativas:"
    nginx -T 2>/dev/null | grep -E "server_name|listen|location|proxy_pass" | head -20
else
    echo "❌ Nginx não instalado"
fi
echo ""

# Node.js
echo "📦 NODE.JS:"
echo "----------------------------------------"
if command -v node &> /dev/null; then
    echo "✅ Node.js instalado"
    echo "Versão do Node.js:"
    node --version
    echo ""
    echo "Versão do NPM:"
    npm --version
    echo ""
    echo "Processos Node em execução:"
    ps aux | grep node | grep -v grep
else
    echo "❌ Node.js não instalado"
fi
echo ""

# PM2
echo "⚡ PM2:"
echo "----------------------------------------"
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 instalado"
    pm2 --version
    echo ""
    echo "Processos PM2:"
    pm2 list
else
    echo "❌ PM2 não instalado"
fi
echo ""

# Banco de Dados
echo "🗄️ BANCOS DE DADOS:"
echo "----------------------------------------"

# PostgreSQL
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL instalado"
    psql --version
    echo "Status do PostgreSQL:"
    systemctl status postgresql --no-pager -l 2>/dev/null || echo "Serviço não encontrado via systemctl"
else
    echo "❌ PostgreSQL não instalado localmente"
fi

# MySQL
if command -v mysql &> /dev/null; then
    echo "✅ MySQL instalado"
    mysql --version
else
    echo "❌ MySQL não instalado"
fi

# Redis
if command -v redis-cli &> /dev/null; then
    echo "✅ Redis instalado"
    redis-cli --version
    echo "Status do Redis:"
    systemctl status redis --no-pager -l 2>/dev/null || echo "Serviço não encontrado via systemctl"
else
    echo "❌ Redis não instalado"
fi
echo ""

# Portas em uso
echo "🔌 PORTAS EM USO:"
echo "----------------------------------------"
echo "Portas TCP abertas:"
netstat -tlnp 2>/dev/null | head -20 || ss -tlnp | head -20
echo ""

# Certificados SSL
echo "🔒 CERTIFICADOS SSL:"
echo "----------------------------------------"
if command -v certbot &> /dev/null; then
    echo "✅ Certbot instalado"
    certbot --version
    echo ""
    echo "Certificados ativos:"
    certbot certificates 2>/dev/null || echo "Erro ao listar certificados"
else
    echo "❌ Certbot não instalado"
fi
echo ""

# Firewall
echo "🛡️ FIREWALL:"
echo "----------------------------------------"
if command -v ufw &> /dev/null; then
    echo "✅ UFW instalado"
    ufw status
elif command -v iptables &> /dev/null; then
    echo "✅ iptables disponível"
    iptables -L | head -10
else
    echo "❌ Firewall não identificado"
fi
echo ""

# Logs recentes
echo "📝 LOGS RECENTES:"
echo "----------------------------------------"
echo "Últimas 10 linhas do syslog:"
tail -10 /var/log/syslog 2>/dev/null || echo "Syslog não acessível"
echo ""

# Variáveis de ambiente importantes
echo "🔧 VARIÁVEIS DE AMBIENTE:"
echo "----------------------------------------"
echo "PATH: $PATH"
echo "USER: $USER"
echo "HOME: $HOME"
echo ""

# Espaço em disco detalhado
echo "💾 ESPAÇO EM DISCO DETALHADO:"
echo "----------------------------------------"
du -sh /var/log /tmp /home 2>/dev/null || echo "Alguns diretórios não acessíveis"
echo ""

echo "=========================================="
echo "✅ DIAGNÓSTICO CONCLUÍDO"
echo "=========================================="