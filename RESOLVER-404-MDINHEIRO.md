# Resolver Erro 404 - mdinheiro.com.br

## Problema Atual

```
HTTP/2 404
content-type: text/plain; charset=utf-8
x-content-type-options: nosniff
content-length: 19
date: Sat, 13 Sep 2025 00:13:49 GMT
```

## Diagnóstico Completo

### 1. Verificar Status dos Containers

```bash
# Verificar se containers estão rodando
docker ps

# Verificar especificamente app-app e traefik
docker ps | grep -E "(app-app|traefik)"

# Ver todos os containers (incluindo parados)
docker ps -a | grep -E "(app-app|traefik)"
```

### 2. Verificar Logs dos Containers

```bash
# Logs do container da aplicação
docker logs app-app --tail 50

# Logs do Traefik
docker logs traefik-app --tail 50

# Logs em tempo real
docker logs -f app-app
```

### 3. Verificar Configuração de Rede

```bash
# Verificar redes
docker network ls

# Inspecionar rede traefik-network
docker network inspect traefik-network

# Verificar se containers estão na mesma rede
docker inspect app-app | grep -A 10 "Networks"
docker inspect traefik-app | grep -A 10 "Networks"
```

### 4. Verificar Labels do Traefik

```bash
# Inspecionar labels do container app-app
docker inspect app-app | grep -A 20 "Labels"

# Verificar se Traefik está detectando o serviço
curl http://localhost:8080/api/http/services
```

## Soluções por Cenário

### Cenário 1: Container app-app não está rodando

```bash
# Verificar se container existe
docker ps -a | grep app-app

# Se parado, iniciar
docker start app-app

# Se não existe, recriar
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app:latest
```

### Cenário 2: Traefik não está rodando

```bash
# Verificar Traefik
docker ps | grep traefik

# Se não estiver rodando, iniciar
docker run -d --name traefik-app \
  --network traefik-network \
  -p 80:80 -p 443:443 -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  traefik:latest \
  --api.insecure=true \
  --providers.docker=true \
  --providers.docker.exposedbydefault=false \
  --entrypoints.web.address=:80 \
  --entrypoints.websecure.address=:443 \
  --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web \
  --certificatesresolvers.letsencrypt.acme.email=admin@mdinheiro.com.br \
  --certificatesresolvers.letsencrypt.acme.storage=/acme.json
```

### Cenário 3: Problema de Roteamento

```bash
# Verificar se Traefik está detectando o serviço
curl -s http://localhost:8080/api/http/routers | jq .

# Verificar serviços
curl -s http://localhost:8080/api/http/services | jq .

# Testar roteamento direto
curl -H "Host: mdinheiro.com.br" http://localhost
```

### Cenário 4: Aplicação não responde na porta 80

```bash
# Verificar se aplicação está rodando internamente
docker exec app-app curl -I http://localhost:80

# Verificar processos dentro do container
docker exec app-app ps aux

# Verificar portas abertas
docker exec app-app netstat -tlnp
```

## Script de Resolução Automática

```bash
#!/bin/bash
# resolver-404.sh

set -e

echo "🔧 RESOLVENDO ERRO 404 - mdinheiro.com.br"
echo "========================================"

# Função para log colorido
log_info() { echo -e "\033[34mℹ️  $1\033[0m"; }
log_success() { echo -e "\033[32m✅ $1\033[0m"; }
log_warning() { echo -e "\033[33m⚠️  $1\033[0m"; }
log_error() { echo -e "\033[31m❌ $1\033[0m"; }

# 1. Verificar containers
log_info "Verificando status dos containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. Verificar se app-app está rodando
if ! docker ps | grep -q app-app; then
    log_warning "Container app-app não está rodando!"

    # Tentar iniciar se existe
    if docker ps -a | grep -q app-app; then
        log_info "Tentando iniciar container app-app..."
        docker start app-app
    else
        log_error "Container app-app não existe! Recriando..."

        # Criar rede se não existir
        docker network create traefik-network 2>/dev/null || true

        # Recriar container
        docker run -d --name app-app \
          --network traefik-network \
          --label "traefik.enable=true" \
          --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
          --label "traefik.http.routers.app.tls=true" \
          --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
          --label "traefik.http.services.app.loadbalancer.server.port=80" \
          app-app:latest
    fi
else
    log_success "Container app-app está rodando"
fi

# 3. Verificar se Traefik está rodando
if ! docker ps | grep -q traefik; then
    log_warning "Traefik não está rodando!"

    # Criar rede se não existir
    docker network create traefik-network 2>/dev/null || true

    # Iniciar Traefik
    docker run -d --name traefik-app \
      --network traefik-network \
      -p 80:80 -p 443:443 -p 8080:8080 \
      -v /var/run/docker.sock:/var/run/docker.sock \
      traefik:latest \
      --api.insecure=true \
      --providers.docker=true \
      --providers.docker.exposedbydefault=false \
      --entrypoints.web.address=:80 \
      --entrypoints.websecure.address=:443 \
      --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web \
      --certificatesresolvers.letsencrypt.acme.email=admin@mdinheiro.com.br \
      --certificatesresolvers.letsencrypt.acme.storage=/acme.json
else
    log_success "Traefik está rodando"
fi

# 4. Aguardar inicialização
log_info "Aguardando containers inicializarem..."
sleep 10

# 5. Verificar logs
log_info "Verificando logs do app-app..."
docker logs --tail 10 app-app

log_info "Verificando logs do Traefik..."
docker logs --tail 10 traefik-app

# 6. Testar conectividade
log_info "Testando conectividade..."

# Testar roteamento local
if curl -s -H "Host: mdinheiro.com.br" http://localhost | grep -q "<!DOCTYPE\|<html"; then
    log_success "Roteamento local funcionando!"
else
    log_warning "Problema no roteamento local"
fi

# Testar HTTPS
if curl -s -I https://mdinheiro.com.br | head -1 | grep -q "200"; then
    log_success "HTTPS funcionando!"
else
    log_warning "Problema no HTTPS - pode ser normal nos primeiros minutos"
fi

# 7. Verificar API do Traefik
log_info "Verificando API do Traefik..."
if curl -s http://localhost:8080/api/http/routers | grep -q "mdinheiro.com.br"; then
    log_success "Traefik detectou o roteamento para mdinheiro.com.br"
else
    log_error "Traefik não detectou o roteamento!"
    log_info "Verificando labels do container..."
    docker inspect app-app | grep -A 10 "Labels"
fi

# 8. Status final
log_info "Status final dos containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Networks}}"

echo ""
log_success "DIAGNÓSTICO CONCLUÍDO!"
echo "====================="
log_info "Próximos passos:"
echo "1. Aguarde 2-3 minutos para certificados SSL"
echo "2. Teste: curl -I https://mdinheiro.com.br"
echo "3. Acesse: https://mdinheiro.com.br no navegador"
echo "4. Teste no iPhone Safari"
echo "5. Monitore: docker logs -f app-app"
echo ""
log_info "Para debug avançado:"
echo "- API Traefik: http://localhost:8080"
echo "- Logs: docker logs -f traefik-app"
echo "- Rede: docker network inspect traefik-network"
```

## Comandos de Verificação Rápida

```bash
# Status geral
docker ps | grep -E "(app-app|traefik)"

# Teste rápido
curl -H "Host: mdinheiro.com.br" http://localhost

# Verificar API Traefik
curl -s http://localhost:8080/api/http/routers | grep mdinheiro

# Logs em tempo real
docker logs -f app-app
```

## Verificação Pós-Resolução

```bash
# 1. Verificar resposta HTTP
curl -I https://mdinheiro.com.br

# 2. Verificar conteúdo
curl -s https://mdinheiro.com.br | head -20

# 3. Testar no iPhone
# Abrir Safari -> https://mdinheiro.com.br

# 4. Monitorar logs
docker logs -f app-app
```

## Próximos Passos

1. Executar script de resolução: `chmod +x resolver-404.sh && ./resolver-404.sh`
2. Aguardar 2-3 minutos para estabilização
3. Testar aplicação no navegador
4. Verificar resolução da tela branca no iPhone
5. Implementar monitoramento contínuo
