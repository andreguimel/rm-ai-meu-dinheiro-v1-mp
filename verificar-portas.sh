#!/bin/bash
# verificar-portas.sh
# Script para verificar portas 80, 443 e 8080 usando métodos alternativos

echo "🔍 VERIFICANDO PORTAS 80, 443 e 8080"
echo "===================================="

# Função para log colorido
log_info() { echo -e "\033[34mℹ️  $1\033[0m"; }
log_success() { echo -e "\033[32m✅ $1\033[0m"; }
log_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
log_error() { echo -e "\033[31m❌ $1\033[0m"; }

# Verificar qual comando está disponível
if command -v netstat &> /dev/null; then
    log_success "netstat disponível"
    echo "Portas em uso (netstat):"
    netstat -tlnp | grep -E ":(80|443|8080)\s" || echo "Nenhuma porta encontrada"
elif command -v ss &> /dev/null; then
    log_info "Usando ss (substituto do netstat)"
    echo "Portas em uso (ss):"
    ss -tlnp | grep -E ":(80|443|8080)\s" || echo "Nenhuma porta encontrada"
else
    log_warning "netstat e ss não disponíveis"
    log_info "Instalando net-tools..."
    apt update && apt install -y net-tools
    if command -v netstat &> /dev/null; then
        log_success "net-tools instalado com sucesso"
        echo "Portas em uso (netstat):"
        netstat -tlnp | grep -E ":(80|443|8080)\s" || echo "Nenhuma porta encontrada"
    else
        log_error "Falha ao instalar net-tools"
    fi
fi

echo ""

# Verificar com lsof se disponível
if command -v lsof &> /dev/null; then
    log_info "Verificando com lsof:"
    echo "Porta 80:"
    lsof -i :80 2>/dev/null || echo "Porta 80 livre"
    echo "Porta 443:"
    lsof -i :443 2>/dev/null || echo "Porta 443 livre"
    echo "Porta 8080:"
    lsof -i :8080 2>/dev/null || echo "Porta 8080 livre"
else
    log_warning "lsof não disponível, instalando..."
    apt install -y lsof
    if command -v lsof &> /dev/null; then
        log_success "lsof instalado"
        echo "Porta 80:"
        lsof -i :80 2>/dev/null || echo "Porta 80 livre"
        echo "Porta 443:"
        lsof -i :443 2>/dev/null || echo "Porta 443 livre"
        echo "Porta 8080:"
        lsof -i :8080 2>/dev/null || echo "Porta 8080 livre"
    fi
fi

echo ""

# Verificar containers Docker
if command -v docker &> /dev/null; then
    log_info "Containers Docker usando as portas:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -1
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(80|443|8080)" || echo "Nenhum container usando as portas"
    
    echo ""
    log_info "Todos os containers (incluindo parados):"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -1
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(traefik|app-app)" || echo "Nenhum container traefik ou app-app encontrado"
else
    log_warning "Docker não disponível"
fi

echo ""

# Verificar usando /proc/net/tcp (método direto)
log_info "Verificando /proc/net/tcp (método direto):"
echo "Conexões TCP ativas nas portas 80, 443, 8080:"
# 80 = 0x50, 443 = 0x1BB, 8080 = 0x1F90
if cat /proc/net/tcp | grep -E ":(0050|01BB|1F90)" > /dev/null; then
    log_warning "Portas encontradas em /proc/net/tcp:"
    cat /proc/net/tcp | grep -E ":(0050|01BB|1F90)"
else
    log_success "Nenhuma conexão ativa encontrada em /proc/net/tcp"
fi

echo ""

# Resumo e recomendações
log_info "RESUMO E RECOMENDAÇÕES:"
echo "========================"

# Verificar se há conflitos
conflicts=false

if command -v netstat &> /dev/null; then
    if netstat -tlnp | grep -E ":(80|443|8080)\s" | grep -v docker > /dev/null; then
        conflicts=true
    fi
elif command -v ss &> /dev/null; then
    if ss -tlnp | grep -E ":(80|443|8080)\s" | grep -v docker > /dev/null; then
        conflicts=true
    fi
fi

if [ "$conflicts" = true ]; then
    log_error "CONFLITOS DETECTADOS!"
    echo "Ações recomendadas:"
    echo "1. Parar containers conflitantes: docker stop traefik-app app-app"
    echo "2. Matar processos: sudo fuser -k 80/tcp 443/tcp 8080/tcp"
    echo "3. Verificar novamente: ./verificar-portas.sh"
    echo "4. Executar resolução: ./resolver-traefik-critico.sh"
else
    log_success "PORTAS LIVRES!"
    echo "Próximos passos:"
    echo "1. Executar: ./resolver-traefik-critico.sh"
    echo "2. Monitorar: docker logs -f traefik-app"
    echo "3. Testar: curl -I https://mdinheiro.com.br"
fi

echo ""
log_info "Comandos úteis:"
echo "- Verificar novamente: ./verificar-portas.sh"
echo "- Resolver Traefik: ./resolver-traefik-critico.sh"
echo "- Logs Traefik: docker logs -f traefik-app"
echo "- Logs App: docker logs -f app-app"
echo "- Status containers: docker ps"
echo "- Dashboard Traefik: http://localhost:8080"

echo ""
log_success "Verificação concluída!"