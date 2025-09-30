#!/bin/bash

echo "=========================================="
echo "🐳 DIAGNÓSTICO STACK DOCKER VPS"
echo "=========================================="
echo ""

# Informações básicas do sistema host
echo "🖥️ SISTEMA HOST:"
echo "----------------------------------------"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2 2>/dev/null || uname -s)"
echo "Kernel: $(uname -r)"
echo "Arquitetura: $(arch)"
echo ""

# Docker Engine
echo "🐳 DOCKER ENGINE:"
echo "----------------------------------------"
if command -v docker &> /dev/null; then
    echo "✅ Docker instalado"
    docker --version
    echo ""
    echo "Docker Info:"
    docker info | grep -E "Server Version|Storage Driver|Logging Driver|Cgroup Driver|Docker Root Dir"
    echo ""
else
    echo "❌ Docker não instalado"
    exit 1
fi

# Docker Compose
echo "🔧 DOCKER COMPOSE:"
echo "----------------------------------------"
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose instalado"
    docker-compose --version
elif docker compose version &> /dev/null; then
    echo "✅ Docker Compose (plugin) instalado"
    docker compose version
else
    echo "❌ Docker Compose não encontrado"
fi
echo ""

# Containers em execução
echo "📦 CONTAINERS EM EXECUÇÃO:"
echo "----------------------------------------"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Todos os containers (incluindo parados)
echo "📋 TODOS OS CONTAINERS:"
echo "----------------------------------------"
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.CreatedAt}}"
echo ""

# Imagens Docker
echo "🖼️ IMAGENS DOCKER:"
echo "----------------------------------------"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""

# Volumes Docker
echo "💾 VOLUMES DOCKER:"
echo "----------------------------------------"
docker volume ls
echo ""
echo "Detalhes dos volumes:"
for volume in $(docker volume ls -q); do
    echo "📁 Volume: $volume"
    docker volume inspect $volume | grep -E "Mountpoint|Driver"
    echo ""
done

# Networks Docker
echo "🌐 REDES DOCKER:"
echo "----------------------------------------"
docker network ls
echo ""

# Verificar se existe docker-compose.yml
echo "📄 ARQUIVOS DE CONFIGURAÇÃO:"
echo "----------------------------------------"
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml encontrado"
    echo "Serviços definidos:"
    docker-compose config --services 2>/dev/null || docker compose config --services 2>/dev/null
    echo ""
    echo "Configuração dos serviços:"
    docker-compose config 2>/dev/null || docker compose config 2>/dev/null | head -50
elif [ -f "docker-compose.yaml" ]; then
    echo "✅ docker-compose.yaml encontrado"
    echo "Serviços definidos:"
    docker-compose config --services 2>/dev/null || docker compose config --services 2>/dev/null
else
    echo "❌ Arquivo docker-compose.yml não encontrado no diretório atual"
fi
echo ""

# Dockerfile
if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile encontrado"
    echo "Primeiras linhas do Dockerfile:"
    head -20 Dockerfile
else
    echo "❌ Dockerfile não encontrado no diretório atual"
fi
echo ""

# Logs dos containers principais
echo "📝 LOGS DOS CONTAINERS (últimas 20 linhas):"
echo "----------------------------------------"
for container in $(docker ps --format "{{.Names}}"); do
    echo "🔍 Logs do container: $container"
    docker logs --tail 20 $container 2>/dev/null || echo "Erro ao acessar logs"
    echo "---"
done
echo ""

# Recursos utilizados pelos containers
echo "📊 RECURSOS DOS CONTAINERS:"
echo "----------------------------------------"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
echo ""

# Portas expostas
echo "🔌 PORTAS EXPOSTAS:"
echo "----------------------------------------"
echo "Mapeamento de portas dos containers:"
docker ps --format "table {{.Names}}\t{{.Ports}}"
echo ""

# Verificar conectividade entre containers
echo "🔗 CONECTIVIDADE:"
echo "----------------------------------------"
echo "Redes dos containers:"
for container in $(docker ps --format "{{.Names}}"); do
    echo "Container: $container"
    docker inspect $container | grep -A 10 '"Networks"' | head -15
    echo "---"
done
echo ""

# Variáveis de ambiente dos containers
echo "🔧 VARIÁVEIS DE AMBIENTE (principais):"
echo "----------------------------------------"
for container in $(docker ps --format "{{.Names}}"); do
    echo "Container: $container"
    docker exec $container env 2>/dev/null | grep -E "(NODE_ENV|PORT|DATABASE|SUPABASE|API)" | head -10 || echo "Não foi possível acessar variáveis"
    echo "---"
done
echo ""

# Verificar saúde dos containers
echo "🏥 SAÚDE DOS CONTAINERS:"
echo "----------------------------------------"
for container in $(docker ps --format "{{.Names}}"); do
    echo "Container: $container"
    health=$(docker inspect $container | grep '"Health"' -A 20 | grep '"Status"' | cut -d'"' -f4 2>/dev/null)
    if [ ! -z "$health" ]; then
        echo "Status de saúde: $health"
    else
        echo "Health check não configurado"
    fi
    echo "---"
done
echo ""

# Espaço em disco usado pelo Docker
echo "💽 USO DE DISCO DOCKER:"
echo "----------------------------------------"
docker system df
echo ""

# Processos dentro dos containers
echo "⚙️ PROCESSOS NOS CONTAINERS:"
echo "----------------------------------------"
for container in $(docker ps --format "{{.Names}}"); do
    echo "Processos no container: $container"
    docker exec $container ps aux 2>/dev/null | head -10 || echo "Não foi possível listar processos"
    echo "---"
done
echo ""

# Verificar se há proxy reverso
echo "🔄 PROXY REVERSO:"
echo "----------------------------------------"
nginx_container=$(docker ps --format "{{.Names}}" | grep -i nginx | head -1)
traefik_container=$(docker ps --format "{{.Names}}" | grep -i traefik | head -1)

if [ ! -z "$nginx_container" ]; then
    echo "✅ Container Nginx encontrado: $nginx_container"
    docker exec $nginx_container nginx -v 2>/dev/null || echo "Erro ao verificar versão"
elif [ ! -z "$traefik_container" ]; then
    echo "✅ Container Traefik encontrado: $traefik_container"
    docker exec $traefik_container traefik version 2>/dev/null || echo "Erro ao verificar versão"
else
    echo "❌ Proxy reverso não identificado nos containers"
fi
echo ""

# Resumo da stack identificada
echo "📋 RESUMO DA STACK IDENTIFICADA:"
echo "----------------------------------------"
echo "🐳 Containers ativos: $(docker ps --format "{{.Names}}" | wc -l)"
echo "🖼️ Imagens: $(docker images -q | wc -l)"
echo "💾 Volumes: $(docker volume ls -q | wc -l)"
echo "🌐 Redes: $(docker network ls -q | wc -l)"
echo ""

# Tecnologias identificadas nos containers
echo "🔍 TECNOLOGIAS IDENTIFICADAS:"
echo "----------------------------------------"
for container in $(docker ps --format "{{.Names}}"); do
    image=$(docker ps --filter "name=$container" --format "{{.Image}}")
    echo "Container: $container (Imagem: $image)"
    
    # Tentar identificar a tecnologia pela imagem
    case $image in
        *node*|*nodejs*)
            echo "  📦 Node.js detectado"
            docker exec $container node --version 2>/dev/null || echo "  Versão não disponível"
            ;;
        *nginx*)
            echo "  🌐 Nginx detectado"
            docker exec $container nginx -v 2>/dev/null || echo "  Versão não disponível"
            ;;
        *postgres*)
            echo "  🗄️ PostgreSQL detectado"
            docker exec $container psql --version 2>/dev/null || echo "  Versão não disponível"
            ;;
        *redis*)
            echo "  🔴 Redis detectado"
            docker exec $container redis-server --version 2>/dev/null || echo "  Versão não disponível"
            ;;
        *mysql*)
            echo "  🐬 MySQL detectado"
            docker exec $container mysql --version 2>/dev/null || echo "  Versão não disponível"
            ;;
        *)
            echo "  🔍 Tecnologia: $(echo $image | cut -d':' -f1)"
            ;;
    esac
    echo ""
done

echo "=========================================="
echo "✅ DIAGNÓSTICO DOCKER CONCLUÍDO"
echo "=========================================="