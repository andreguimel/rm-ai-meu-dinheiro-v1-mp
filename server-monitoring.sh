#!/bin/bash

# Script de Monitoramento do Servidor
# Para diagnosticar problemas de performance e conectividade

echo "=== MONITORAMENTO DO SERVIDOR MDINHEIRO ==="
echo "Data: $(date)"
echo ""

# Verificar status dos containers
echo "1. STATUS DOS CONTAINERS:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Verificar logs do nginx
echo "2. LOGS RECENTES DO NGINX (últimas 20 linhas):"
docker exec meu-dinheiro-app tail -20 /var/log/nginx/error.log 2>/dev/null || echo "Logs de erro não encontrados"
echo ""

# Verificar logs de acesso
echo "3. LOGS DE ACESSO (últimas 10 linhas):"
docker exec meu-dinheiro-app tail -10 /var/log/nginx/access.log 2>/dev/null || echo "Logs de acesso não encontrados"
echo ""

# Verificar arquivos estáticos
echo "4. VERIFICAÇÃO DE ARQUIVOS ESTÁTICOS:"
docker exec meu-dinheiro-app ls -la /usr/share/nginx/html/assets/ 2>/dev/null || echo "Pasta assets não encontrada"
echo ""

# Testar conectividade interna
echo "5. TESTE DE CONECTIVIDADE INTERNA:"
docker exec meu-dinheiro-app curl -s -o /dev/null -w "Status: %{http_code}, Tempo: %{time_total}s\n" http://localhost/ || echo "Falha no teste interno"
echo ""

# Verificar configuração do nginx
echo "6. CONFIGURAÇÃO ATIVA DO NGINX:"
docker exec meu-dinheiro-app nginx -t 2>&1 || echo "Erro na configuração do nginx"
echo ""

# Verificar uso de recursos
echo "7. USO DE RECURSOS:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""

# Verificar conectividade externa
echo "8. TESTE DE CONECTIVIDADE EXTERNA:"
curl -s -o /dev/null -w "HTTPS Status: %{http_code}, Tempo: %{time_total}s\n" https://mdinheiro.com.br/ || echo "Falha no teste externo HTTPS"
curl -s -o /dev/null -w "HTTP Status: %{http_code}, Tempo: %{time_total}s\n" http://mdinheiro.com.br/ || echo "Falha no teste externo HTTP"
echo ""

# Verificar certificado SSL
echo "9. CERTIFICADO SSL:"
echo | openssl s_client -servername mdinheiro.com.br -connect mdinheiro.com.br:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "Erro ao verificar certificado"
echo ""

# Verificar DNS
echo "10. RESOLUÇÃO DNS:"
nslookup mdinheiro.com.br || echo "Erro na resolução DNS"
echo ""

echo "=== FIM DO MONITORAMENTO ==="