# Resolver Erro: Network traefik-network not found

## Problema

Erro: `failed to set up container networking: network traefik-network not found`

## Causa

A rede Docker `traefik-network` não existe no sistema.

## Solução Rápida

```bash
# 1. Criar a rede traefik-network
docker network create traefik-network

# 2. Verificar se foi criada
docker network ls | grep traefik

# 3. Executar o container
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app:latest
```

## Solução Completa (Recomendada)

```bash
#!/bin/bash
# Script completo de resolução

echo "🔧 Resolvendo problema de rede Docker..."

# Parar e remover container existente
echo "🛑 Parando container existente..."
docker stop app-app 2>/dev/null || echo "Container não estava rodando"
docker rm app-app 2>/dev/null || echo "Container não existia"

# Verificar redes existentes
echo "🔍 Verificando redes existentes..."
docker network ls

# Criar rede traefik-network
echo "🌐 Criando rede traefik-network..."
if docker network create traefik-network 2>/dev/null; then
    echo "✅ Rede traefik-network criada com sucesso"
else
    echo "⚠️ Rede traefik-network já existe"
fi

# Verificar se Traefik está rodando
echo "🔍 Verificando container Traefik..."
if docker ps | grep -q traefik; then
    echo "✅ Traefik está rodando"
else
    echo "⚠️ Traefik não está rodando - pode ser necessário iniciá-lo"
    echo "Para iniciar Traefik:"
    echo "docker run -d --name traefik-app --network traefik-network -p 80:80 -p 443:443 traefik:latest"
fi

# Criar container da aplicação
echo "🚀 Criando container da aplicação..."
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app:latest

if [ $? -eq 0 ]; then
    echo "✅ Container app-app criado com sucesso!"
else
    echo "❌ Erro ao criar container app-app"
    exit 1
fi

# Verificar status
echo "📊 Status dos containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Networks}}"

echo "🌐 Testando conectividade..."
sleep 5
curl -I https://mdinheiro.com.br || echo "Aplicação ainda inicializando..."

echo "✅ Resolução concluída!"
```

## Comandos de Diagnóstico

```bash
# Verificar todas as redes
docker network ls

# Inspecionar rede traefik-network
docker network inspect traefik-network

# Ver containers conectados à rede
docker network inspect traefik-network | grep -A 10 "Containers"

# Verificar se Traefik está na rede
docker ps --filter "network=traefik-network"
```

## Cenários Comuns

### 1. Rede não existe

```bash
docker network create traefik-network
```

### 2. Rede existe mas Traefik não está rodando

```bash
# Verificar se Traefik existe
docker ps -a | grep traefik

# Iniciar Traefik se parado
docker start traefik-app

# Ou criar novo Traefik
docker run -d --name traefik-app \
  --network traefik-network \
  -p 80:80 -p 443:443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  traefik:latest --api.insecure=true --providers.docker
```

### 3. Conflito de redes

```bash
# Remover rede problemática
docker network rm traefik-network

# Recriar rede
docker network create traefik-network

# Reconectar containers
docker network connect traefik-network traefik-app
docker network connect traefik-network app-app
```

## Configuração Completa do Traefik

```bash
# docker-compose.yml para Traefik
version: '3.7'
services:
  traefik:
    image: traefik:latest
    container_name: traefik-app
    command:
      - --api.insecure=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.email=seu-email@exemplo.com
      - --certificatesresolvers.letsencrypt.acme.storage=/acme.json
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./acme.json:/acme.json
    networks:
      - traefik-network

networks:
  traefik-network:
    external: true
```

## Verificação Final

```bash
# Verificar tudo funcionando
docker ps
docker network ls
curl -I https://mdinheiro.com.br

# Logs para debug
docker logs traefik-app
docker logs app-app
```

## Próximos Passos

1. Executar solução completa
2. Verificar se Traefik está configurado corretamente
3. Testar aplicação no navegador
4. Testar no iPhone para verificar tela branca
5. Configurar monitoramento contínuo
