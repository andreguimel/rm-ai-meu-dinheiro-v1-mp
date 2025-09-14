#!/bin/bash

# Script para resolver conflito de containers Docker
# Problema: Container traefik-app já está em uso

echo "🔧 Resolvendo conflito de containers Docker..."

# 1. Parar todos os containers relacionados
echo "📦 Parando containers..."
docker stop traefik-app app-app 2>/dev/null || true

# 2. Remover containers conflitantes
echo "🗑️ Removendo containers conflitantes..."
docker rm traefik-app app-app 2>/dev/null || true

# 3. Limpar containers órfãos
echo "🧹 Limpando containers órfãos..."
docker container prune -f

# 4. Limpar volumes órfãos
echo "💾 Limpando volumes órfãos..."
docker volume prune -f

# 5. Limpar redes órfãos
echo "🌐 Limpando redes órfãs..."
docker network prune -f

# 6. Verificar se a rede traefik-network existe
echo "🔍 Verificando rede traefik-network..."
if ! docker network ls | grep -q "traefik-network"; then
    echo "➕ Criando rede traefik-network..."
    docker network create traefik-network
else
    echo "✅ Rede traefik-network já existe"
fi

# 7. Remover certificados antigos (forçar renovação)
echo "🔐 Limpando certificados antigos..."
docker volume rm traefik_letsencrypt 2>/dev/null || true

# 8. Recriar containers
echo "🚀 Recriando containers..."
docker-compose down --remove-orphans
docker-compose up -d --force-recreate

# 9. Aguardar inicialização
echo "⏳ Aguardando inicialização dos containers..."
sleep 30

# 10. Verificar status dos containers
echo "📊 Status dos containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 11. Verificar logs do Traefik
echo "\n📋 Logs do Traefik (últimas 20 linhas):"
docker logs traefik-app --tail 20

# 12. Testar conectividade
echo "\n🌐 Testando conectividade..."
echo "HTTP: $(curl -s -o /dev/null -w "%{http_code}" http://mdinheiro.com.br || echo 'FALHOU')"
echo "HTTPS: $(curl -s -o /dev/null -w "%{http_code}" https://mdinheiro.com.br || echo 'FALHOU')"

echo "\n✅ Script concluído!"
echo "\n📝 Próximos passos:"
echo "1. Aguarde 2-3 minutos para os certificados SSL serem gerados"
echo "2. Teste no navegador: https://mdinheiro.com.br"
echo "3. Se ainda houver erro SSL, execute: docker logs traefik-app"
echo "4. Para monitorar certificados: docker exec traefik-app ls -la /letsencrypt/acme.json"