#!/bin/bash

# Script de Diagnóstico de JavaScript na VPS
# Verifica problemas relacionados ao carregamento e execução de JS

echo "🔍 DIAGNÓSTICO DE JAVASCRIPT NA VPS - $(date)"
echo "=================================================="

# Função para separar seções
print_section() {
    echo ""
    echo "📋 $1"
    echo "----------------------------------------"
}

# 1. Verificar logs do Traefik para erros de JS/Assets
print_section "LOGS DO TRAEFIK - ERROS DE JAVASCRIPT/ASSETS"
echo "Verificando erros relacionados a JavaScript nos últimos logs do Traefik..."
sudo docker logs traefik-app --tail 50 | grep -i -E "(\.js|javascript|asset|404|500|error)" || echo "Nenhum erro de JS encontrado nos logs do Traefik"

# 2. Verificar logs detalhados do app para problemas de JS
print_section "LOGS DETALHADOS DO APP - PROBLEMAS DE JS"
echo "Analisando logs do container da aplicação para erros de JavaScript..."
sudo docker logs app-app --tail 100 | grep -i -E "(\.js|javascript|error|404|500|failed)" || echo "Nenhum erro de JS encontrado nos logs do app"

# 3. Testar carregamento de arquivos JavaScript específicos
print_section "TESTE DE CARREGAMENTO DE ARQUIVOS JS"
echo "Testando acesso aos principais arquivos JavaScript..."

# Testar arquivos JS comuns
JS_FILES=(
    "/assets/index.js"
    "/assets/main.js" 
    "/assets/app.js"
    "/src/main.tsx"
    "/manifest.json"
)

for js_file in "${JS_FILES[@]}"; do
    echo "Testando: https://mdinheiro.com.br$js_file"
    response=$(curl -s -o /dev/null -w "%{http_code}" "https://mdinheiro.com.br$js_file" 2>/dev/null)
    if [ "$response" = "200" ]; then
        echo "✅ $js_file - OK ($response)"
    else
        echo "❌ $js_file - ERRO ($response)"
    fi
done

# 4. Verificar estrutura de arquivos no container
print_section "ESTRUTURA DE ARQUIVOS NO CONTAINER"
echo "Verificando se os arquivos JS estão presentes no container..."
sudo docker exec app-app find /usr/share/nginx/html -name "*.js" -type f | head -20

# 5. Verificar configuração do Nginx para JS
print_section "CONFIGURAÇÃO DO NGINX PARA ARQUIVOS JS"
echo "Verificando configuração do Nginx para servir arquivos JavaScript..."
sudo docker exec app-app cat /etc/nginx/conf.d/default.conf | grep -A 5 -B 5 -i -E "(\.js|javascript|mime|gzip)"

# 6. Testar carregamento da página principal e verificar JS
print_section "TESTE DE CARREGAMENTO DA PÁGINA PRINCIPAL"
echo "Verificando se a página principal carrega corretamente..."
curl -s "https://mdinheiro.com.br/" | grep -o '<script[^>]*>' | head -10

# 7. Verificar headers de resposta para arquivos JS
print_section "HEADERS DE RESPOSTA PARA ARQUIVOS JS"
echo "Verificando headers HTTP para arquivos JavaScript..."
curl -I "https://mdinheiro.com.br/manifest.json" 2>/dev/null | head -10

# 8. Verificar se há problemas de CORS
print_section "VERIFICAÇÃO DE CORS"
echo "Testando headers CORS para assets..."
curl -H "Origin: https://mdinheiro.com.br" -I "https://mdinheiro.com.br/manifest.json" 2>/dev/null | grep -i cors

# 9. Verificar espaço em disco no container
print_section "ESPAÇO EM DISCO NO CONTAINER"
echo "Verificando espaço disponível no container..."
sudo docker exec app-app df -h

# 10. Verificar processos do Nginx
print_section "PROCESSOS DO NGINX"
echo "Verificando se o Nginx está rodando corretamente..."
sudo docker exec app-app ps aux | grep nginx

# 11. Testar conectividade interna
print_section "CONECTIVIDADE INTERNA"
echo "Testando conectividade interna entre containers..."
sudo docker exec traefik-app wget -q --spider http://app-app/ && echo "✅ Conectividade interna OK" || echo "❌ Problema de conectividade interna"

# 12. Verificar logs de erro do Nginx
print_section "LOGS DE ERRO DO NGINX"
echo "Verificando logs de erro do Nginx..."
sudo docker exec app-app cat /var/log/nginx/error.log 2>/dev/null | tail -20 || echo "Nenhum log de erro encontrado"

# 13. Testar diferentes User-Agents
print_section "TESTE COM DIFERENTES USER-AGENTS"
echo "Testando com User-Agent de diferentes navegadores..."

# Desktop
echo "Desktop Chrome:"
curl -s -o /dev/null -w "%{http_code}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "https://mdinheiro.com.br/"

# Mobile
echo "Mobile Safari:"
curl -s -o /dev/null -w "%{http_code}" -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15" "https://mdinheiro.com.br/"

# 14. Verificar Content-Type dos arquivos JS
print_section "CONTENT-TYPE DOS ARQUIVOS JS"
echo "Verificando Content-Type correto para arquivos JavaScript..."
curl -s -I "https://mdinheiro.com.br/manifest.json" | grep -i content-type

# 15. Resumo final
print_section "RESUMO DO DIAGNÓSTICO"
echo "✅ Containers Status:"
sudo docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(app-app|traefik-app)"

echo ""
echo "🌐 Teste de Acessibilidade:"
response_code=$(curl -s -o /dev/null -w "%{http_code}" "https://mdinheiro.com.br/")
if [ "$response_code" = "200" ]; then
    echo "✅ Site acessível via HTTPS (Código: $response_code)"
else
    echo "❌ Problema de acesso ao site (Código: $response_code)"
fi

echo ""
echo "📊 Teste de Assets Principais:"
manifest_code=$(curl -s -o /dev/null -w "%{http_code}" "https://mdinheiro.com.br/manifest.json")
if [ "$manifest_code" = "200" ]; then
    echo "✅ Manifest.json carregando corretamente"
else
    echo "❌ Problema com manifest.json (Código: $manifest_code)"
fi

echo ""
echo "🔧 Próximos Passos Recomendados:"
echo "1. Se houver erros 404 em JS: Verificar build da aplicação"
echo "2. Se houver erros de CORS: Ajustar configuração do Nginx"
echo "3. Se houver problemas de cache: Limpar cache do navegador"
echo "4. Se houver erros 500: Verificar logs detalhados do Nginx"

echo ""
echo "📝 Diagnóstico concluído em: $(date)"
echo "=================================================="