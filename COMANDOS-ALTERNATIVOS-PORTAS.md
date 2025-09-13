# Comandos Alternativos para Verificar Portas

## Problema: netstat não encontrado
```
Command 'netstat' not found, but can be installed with:
apt install net-tools
```

## Soluções Rápidas

### 1. Instalar net-tools (Recomendado)
```bash
# Atualizar repositórios e instalar
apt update && apt install -y net-tools

# Verificar portas após instalação
netstat -tlnp | grep -E ":(80|443|8080)\s"
```

### 2. Usar comando 'ss' (Alternativa moderna)
```bash
# ss é o substituto moderno do netstat
# Verificar portas TCP em listening
ss -tlnp | grep -E ":(80|443|8080)\s"

# Verificar todas as conexões
ss -tuln | grep -E ":(80|443|8080)\s"

# Mostrar processos usando as portas
ss -tlnp | grep -E ":(80|443|8080)"
```

### 3. Usar comando 'lsof'
```bash
# Verificar processos usando portas específicas
lsof -i :80
lsof -i :443
lsof -i :8080

# Verificar múltiplas portas de uma vez
lsof -i :80 -i :443 -i :8080

# Mostrar apenas processos TCP
lsof -iTCP:80 -sTCP:LISTEN
lsof -iTCP:443 -sTCP:LISTEN
lsof -iTCP:8080 -sTCP:LISTEN
```

### 4. Usar /proc/net/tcp (Método direto)
```bash
# Verificar conexões TCP ativas
cat /proc/net/tcp | grep -E ":(0050|01BB|1F90)" # 80, 443, 8080 em hex

# Converter portas para hexadecimal:
# 80 = 0x50 = 0050
# 443 = 0x1BB = 01BB  
# 8080 = 0x1F90 = 1F90
```

### 5. Verificar com Docker
```bash
# Verificar containers usando as portas
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "(80|443|8080)"

# Verificar todos os containers (incluindo parados)
docker ps -a --format "table {{.Names}}\t{{.Ports}}" | grep -E "(80|443|8080)"
```

## Script de Verificação Completa
```bash
#!/bin/bash
# verificar-portas.sh

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
    log_warning "lsof não disponível"
fi

echo ""

# Verificar containers Docker
if command -v docker &> /dev/null; then
    log_info "Containers Docker usando as portas:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(80|443|8080)" || echo "Nenhum container usando as portas"
else
    log_warning "Docker não disponível"
fi

echo ""
log_info "Verificação concluída!"
```

## Comandos para Liberar Portas

### Matar processos por porta
```bash
# Usando fuser (mais seguro)
sudo fuser -k 80/tcp
sudo fuser -k 443/tcp
sudo fuser -k 8080/tcp

# Usando kill com lsof
sudo kill -9 $(lsof -t -i:80)
sudo kill -9 $(lsof -t -i:443)
sudo kill -9 $(lsof -t -i:8080)

# Parar containers Docker específicos
docker stop $(docker ps -q --filter "publish=80")
docker stop $(docker ps -q --filter "publish=443")
docker stop $(docker ps -q --filter "publish=8080")
```

## Instalação de Ferramentas

### Ubuntu/Debian
```bash
# net-tools (netstat)
apt update && apt install -y net-tools

# lsof
apt install -y lsof

# ss já vem instalado por padrão no systemd
```

### CentOS/RHEL
```bash
# net-tools
yum install -y net-tools

# lsof
yum install -y lsof
```

## Uso no Contexto do Traefik

### Verificação antes de iniciar Traefik
```bash
# 1. Verificar se portas estão livres
ss -tlnp | grep -E ":(80|443|8080)\s" && echo "⚠️ Portas em uso!" || echo "✅ Portas livres"

# 2. Parar containers conflitantes
docker stop traefik-app app-app 2>/dev/null || true

# 3. Verificar novamente
ss -tlnp | grep -E ":(80|443|8080)\s" && echo "⚠️ Ainda há conflitos" || echo "✅ Pronto para iniciar"

# 4. Iniciar Traefik
docker run -d --name traefik-app -p 80:80 -p 443:443 -p 8080:8080 ...
```

### Diagnóstico pós-inicialização
```bash
# Verificar se Traefik está usando as portas
ss -tlnp | grep -E ":(80|443|8080)\s"

# Verificar logs do Traefik
docker logs traefik-app --tail 20

# Testar conectividade
curl -I http://localhost:80
curl -I http://localhost:8080
```

## Próximos Passos
1. Escolher um dos métodos acima para verificar portas
2. Executar `chmod +x verificar-portas.sh && ./verificar-portas.sh`
3. Liberar portas se necessário
4. Executar o script principal: `./resolver-traefik-critico.sh`
5. Monitorar logs: `docker logs -f traefik-app`