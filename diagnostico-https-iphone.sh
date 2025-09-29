#!/bin/bash

# Script de Diagnóstico HTTPS vs HTTP - Problemas iPhone
# Foca especificamente na diferença entre ambiente local (HTTP) e produção (HTTPS)

echo "🔍 DIAGNÓSTICO HTTPS vs HTTP - IPHONE - $(date)"
echo "=================================================="

# Função para separar seções
print_section() {
    echo ""
    echo "📋 $1"
    echo "----------------------------------------"
}

# 1. Verificar diferenças de protocolo
print_section "DIFERENÇAS DE PROTOCOLO - HTTP vs HTTPS"
echo "Local (funciona): http://192.168.0.5:8080"
echo "VPS (tela branca): https://mdinheiro.com.br/dashboard"
echo ""
echo "Testando conectividade básica..."
curl -s -o /dev/null -w "HTTP Status: %{http_code} | Tempo: %{time_total}s\n" "https://mdinheiro.com.br/"
curl -s -o /dev/null -w "HTTP Status: %{http_code} | Tempo: %{time_total}s\n" "https://mdinheiro.com.br/dashboard"

# 2. Verificar Mixed Content (HTTP em HTTPS)
print_section "VERIFICAÇÃO DE MIXED CONTENT"
echo "Procurando por recursos HTTP em página HTTPS..."
page_content=$(curl -s "https://mdinheiro.com.br/")
echo "Verificando se há links HTTP na página HTTPS:"
echo "$page_content" | grep -o 'http://[^"]*' | head -10 || echo "✅ Nenhum link HTTP encontrado"

# 3. Verificar Service Worker em HTTPS
print_section "SERVICE WORKER EM HTTPS"
echo "Testando se Service Worker está acessível..."
sw_response=$(curl -s -o /dev/null -w "%{http_code}" "https://mdinheiro.com.br/sw.js")
if [ "$sw_response" = "200" ]; then
    echo "✅ Service Worker acessível (Código: $sw_response)"
else
    echo "❌ Problema com Service Worker (Código: $sw_response)"
fi

# 4. Verificar Manifest.json
print_section "PWA MANIFEST EM HTTPS"
echo "Testando manifest.json..."
manifest_response=$(curl -s -o /dev/null -w "%{http_code}" "https://mdinheiro.com.br/manifest.json")
if [ "$manifest_response" = "200" ]; then
    echo "✅ Manifest.json acessível (Código: $manifest_response)"
    # Verificar conteúdo do manifest
    curl -s "https://mdinheiro.com.br/manifest.json" | jq . 2>/dev/null || echo "Manifest válido mas não é JSON válido"
else
    echo "❌ Problema com manifest.json (Código: $manifest_response)"
fi

# 5. Verificar Headers de Segurança HTTPS
print_section "HEADERS DE SEGURANÇA HTTPS"
echo "Verificando headers específicos para HTTPS..."
curl -I "https://mdinheiro.com.br/" 2>/dev/null | grep -E "(Strict-Transport-Security|Content-Security-Policy|X-Frame-Options|X-Content-Type-Options)"

# 6. Verificar CSP (Content Security Policy)
print_section "CONTENT SECURITY POLICY"
echo "Verificando se CSP está bloqueando recursos..."
csp_header=$(curl -s -I "https://mdinheiro.com.br/" | grep -i "content-security-policy")
if [ -n "$csp_header" ]; then
    echo "CSP encontrado:"
    echo "$csp_header"
    echo ""
    echo "Verificando se permite 'unsafe-inline' e 'unsafe-eval':"
    echo "$csp_header" | grep -o "'unsafe-[^']*'" || echo "❌ Pode estar bloqueando JavaScript inline"
else
    echo "❌ Nenhum CSP encontrado"
fi

# 7. Verificar WebSocket em HTTPS (WSS)
print_section "WEBSOCKET EM HTTPS (WSS)"
echo "Verificando se WebSocket funciona em HTTPS..."
# Simular teste de WebSocket
echo "Em HTTPS, WebSocket deve usar WSS (WebSocket Secure)"
echo "Local HTTP: ws://192.168.0.5:8080 (funciona)"
echo "VPS HTTPS: wss://mdinheiro.com.br (pode falhar no iPhone)"

# 8. Verificar Assets JavaScript específicos
print_section "ASSETS JAVASCRIPT EM HTTPS"
echo "Testando carregamento de assets JS principais..."

# Testar main.tsx (arquivo principal)
main_js=$(curl -s "https://mdinheiro.com.br/" | grep -o '/src/main\.tsx' | head -1)
if [ -n "$main_js" ]; then
    echo "Testando: https://mdinheiro.com.br$main_js"
    js_response=$(curl -s -o /dev/null -w "%{http_code}" "https://mdinheiro.com.br$main_js")
    echo "Status main.tsx: $js_response"
else
    echo "❌ main.tsx não encontrado na página"
fi

# 9. Verificar problemas específicos do iPhone Safari
print_section "PROBLEMAS ESPECÍFICOS IPHONE SAFARI"
echo "Verificando configurações específicas para iPhone..."

# Verificar meta tags para iPhone
page_html=$(curl -s "https://mdinheiro.com.br/")
echo "Meta tags para iPhone encontradas:"
echo "$page_html" | grep -o '<meta[^>]*apple[^>]*>' || echo "❌ Nenhuma meta tag Apple encontrada"
echo "$page_html" | grep -o '<meta[^>]*viewport[^>]*>' || echo "❌ Meta viewport não encontrada"

# 10. Verificar Cache e Headers de Cache
print_section "CACHE E HEADERS DE CACHE"
echo "Verificando headers de cache que podem causar problemas no iPhone..."
cache_headers=$(curl -s -I "https://mdinheiro.com.br/" | grep -E "(Cache-Control|Pragma|Expires|ETag)")
if [ -n "$cache_headers" ]; then
    echo "Headers de cache encontrados:"
    echo "$cache_headers"
else
    echo "❌ Nenhum header de cache encontrado"
fi

# 11. Verificar CORS para assets
print_section "CORS PARA ASSETS"
echo "Verificando CORS que pode afetar carregamento no iPhone..."
cors_test=$(curl -H "Origin: https://mdinheiro.com.br" -I "https://mdinheiro.com.br/manifest.json" 2>/dev/null | grep -i "access-control")
if [ -n "$cors_test" ]; then
    echo "Headers CORS encontrados:"
    echo "$cors_test"
else
    echo "⚠️ Nenhum header CORS encontrado (pode ser normal)"
fi

# 12. Verificar SSL/TLS específico
print_section "VERIFICAÇÃO SSL/TLS DETALHADA"
echo "Verificando detalhes do certificado SSL..."
ssl_info=$(echo | openssl s_client -connect mdinheiro.com.br:443 -servername mdinheiro.com.br 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null)
if [ -n "$ssl_info" ]; then
    echo "Informações do certificado:"
    echo "$ssl_info"
else
    echo "❌ Não foi possível obter informações do certificado"
fi

# 13. Testar diferentes User-Agents (simular iPhone)
print_section "TESTE COM USER-AGENT IPHONE"
echo "Testando com User-Agent do iPhone Safari..."
iphone_ua="Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1"
iphone_response=$(curl -s -o /dev/null -w "%{http_code}" -H "User-Agent: $iphone_ua" "https://mdinheiro.com.br/dashboard")
echo "Resposta com User-Agent iPhone: $iphone_response"

# 14. Verificar logs do container para erros HTTPS
print_section "LOGS DO CONTAINER - ERROS HTTPS"
echo "Verificando logs recentes para erros relacionados a HTTPS..."
sudo docker logs app-app --tail 50 | grep -i -E "(https|ssl|tls|mixed|content|security|csp)" || echo "Nenhum erro HTTPS encontrado nos logs"

# 15. Verificar configuração do Nginx para HTTPS
print_section "CONFIGURAÇÃO NGINX PARA HTTPS"
echo "Verificando configuração do Nginx no container..."
sudo docker exec app-app cat /etc/nginx/conf.d/default.conf | grep -A 10 -B 5 -E "(ssl|https|security|header)" || echo "Configuração padrão do Nginx"

# 16. Resumo e Diagnóstico
print_section "RESUMO DO DIAGNÓSTICO"
echo "🔍 Análise Comparativa:"
echo "Local HTTP (funciona): http://192.168.0.5:8080"
echo "VPS HTTPS (tela branca): https://mdinheiro.com.br/dashboard"
echo ""

# Testar conectividade final
final_test=$(curl -s -o /dev/null -w "%{http_code}" "https://mdinheiro.com.br/dashboard")
if [ "$final_test" = "200" ]; then
    echo "✅ Site responde corretamente (HTTP $final_test)"
    echo "🔍 Problema pode ser:"
    echo "   1. JavaScript não executando em HTTPS"
    echo "   2. Service Worker causando problemas"
    echo "   3. CSP bloqueando recursos"
    echo "   4. WebSocket falhando (WSS vs WS)"
    echo "   5. Cache agressivo do Safari no iPhone"
else
    echo "❌ Site não responde corretamente (HTTP $final_test)"
fi

echo ""
echo "🚨 POSSÍVEIS CAUSAS DA TELA BRANCA NO IPHONE:"
echo "1. Mixed Content: Recursos HTTP em página HTTPS"
echo "2. CSP muito restritivo bloqueando JavaScript"
echo "3. Service Worker não funcionando em HTTPS"
echo "4. WebSocket tentando usar WS em vez de WSS"
echo "5. Cache do Safari iPhone com versão antiga"
echo "6. JavaScript com erros específicos em HTTPS"
echo ""

echo "🔧 PRÓXIMOS PASSOS RECOMENDADOS:"
echo "1. Verificar console do navegador no iPhone (Safari Web Inspector)"
echo "2. Testar em modo privado no iPhone Safari"
echo "3. Limpar cache do Safari no iPhone"
echo "4. Verificar se todos os recursos usam HTTPS"
echo "5. Ajustar CSP se necessário"
echo "6. Verificar configuração do Service Worker"
echo ""

echo "📝 Diagnóstico concluído em: $(date)"
echo "=================================================="