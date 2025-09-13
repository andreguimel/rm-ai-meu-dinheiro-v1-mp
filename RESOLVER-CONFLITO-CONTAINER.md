# Resolver Conflito de Container Docker

## Problema
Erro: `Conflict. The container name "/app-app" is already in use`

## Diagnóstico Rápido
```bash
# Verificar containers existentes
docker ps -a | grep app-app

# Ver status do container conflitante
docker inspect app-app
```

## Soluções

### 1. Remover Container + Criar Rede (Recomendado)
```bash
# Parar o container se estiver rodando
docker stop app-app

# Remover o container
docker rm app-app

# Criar rede traefik-network se não existir
docker network create traefik-network 2>/dev/null || echo "Rede já existe"

# Verificar se rede foi criada
docker network ls | grep traefik

# Agora executar o novo container
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app:latest
```

### 2. Forçar Remoção (Se container travado)
```bash
# Forçar parada e remoção
docker rm -f app-app

# Executar novo container
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app:latest
```

### 3. Usar Nome Diferente (Alternativa)
```bash
# Usar nome único com timestamp
docker run -d --name app-app-$(date +%s) \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app:latest
```

## Script de Resolução Automática
```bash
#!/bin/bash
# resolver-conflito.sh

echo "🔍 Verificando containers existentes..."
docker ps -a | grep app-app

echo "🛑 Parando container existente..."
docker stop app-app 2>/dev/null || echo "Container já parado"

echo "🗑️ Removendo container existente..."
docker rm app-app 2>/dev/null || echo "Container já removido"

echo "🚀 Iniciando novo container..."
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app:latest

echo "✅ Verificando status..."
docker ps | grep app-app

echo "🌐 Testando endpoint..."
curl -I https://mdinheiro.com.br
```

## Verificação Pós-Resolução
```bash
# Verificar se container está rodando
docker ps | grep app-app

# Verificar logs
docker logs app-app

# Testar aplicação
curl -I https://mdinheiro.com.br

# Verificar no iPhone
# Abrir https://mdinheiro.com.br no Safari
```

## Comandos de Emergência
```bash
# Limpar todos os containers parados
docker container prune -f

# Reiniciar Docker (se necessário)
sudo systemctl restart docker

# Verificar rede Traefik
docker network ls | grep traefik

# Recriar rede se necessário
docker network create traefik-network
```

## Prevenção
- Sempre parar e remover containers antes de recriar
- Usar scripts automatizados para deploy
- Implementar health checks
- Monitorar status dos containers regularmente

## Próximos Passos
1. Resolver o conflito usando Solução 1
2. Verificar se aplicação está funcionando
3. Testar no iPhone para confirmar resolução da tela branca
4. Implementar monitoramento contínuo