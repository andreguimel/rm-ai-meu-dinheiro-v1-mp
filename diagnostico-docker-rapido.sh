#!/bin/bash

echo "🐳 DIAGNÓSTICO RÁPIDO DOCKER"
echo "============================"

# Docker básico
echo "📋 Docker: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"

# Containers ativos
echo "📦 Containers ativos:"
docker ps --format "  • {{.Names}} ({{.Image}}) - {{.Status}}"

# Portas expostas
echo "🔌 Portas:"
docker ps --format "  • {{.Names}}: {{.Ports}}" | grep -v "^  • .*: $"

# Recursos
echo "📊 Recursos:"
docker stats --no-stream --format "  • {{.Container}}: CPU {{.CPUPerc}} | RAM {{.MemUsage}}"

# Volumes
echo "💾 Volumes:"
docker volume ls --format "  • {{.Name}}"

# Logs recentes (últimas 5 linhas de cada container)
echo "📝 Logs recentes:"
for container in $(docker ps --format "{{.Names}}"); do
    echo "  🔍 $container:"
    docker logs --tail 5 $container 2>/dev/null | sed 's/^/    /'
done

# Stack identificada
echo "🔍 Stack identificada:"
for container in $(docker ps --format "{{.Names}}"); do
    image=$(docker ps --filter "name=$container" --format "{{.Image}}")
    case $image in
        *node*|*nodejs*) echo "  • Node.js ($container)" ;;
        *nginx*) echo "  • Nginx ($container)" ;;
        *postgres*) echo "  • PostgreSQL ($container)" ;;
        *redis*) echo "  • Redis ($container)" ;;
        *mysql*) echo "  • MySQL ($container)" ;;
        *) echo "  • $(echo $image | cut -d':' -f1) ($container)" ;;
    esac
done

echo "============================"