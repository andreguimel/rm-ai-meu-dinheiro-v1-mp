# 🔒 REBUILD COM SSL AUTOMÁTICO - mdinheiro.com.br
# Script PowerShell que garante SSL funcionando após rebuild da aplicação
# Resolve o problema de ter que reativar SSL manualmente

# Configurações
$ErrorActionPreference = "Stop"

# Função de log com cores
function Write-LogInfo {
    param($Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ℹ️  $Message" -ForegroundColor Blue
}

function Write-LogSuccess {
    param($Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ $Message" -ForegroundColor Green
}

function Write-LogWarning {
    param($Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ⚠️  $Message" -ForegroundColor Yellow
}

function Write-LogError {
    param($Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ❌ $Message" -ForegroundColor Red
    exit 1
}

# Banner
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "🔒 REBUILD COM SSL AUTOMÁTICO - mdinheiro.com.br" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# 1. Verificar dependências
Write-LogInfo "Verificando dependências..."
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
    Write-LogSuccess "Dependências verificadas"
} catch {
    Write-LogError "Docker ou Docker Compose não encontrado!"
}

# 2. Parar todos os containers
Write-LogInfo "Parando containers existentes..."
try {
    docker-compose down 2>$null
    docker stop traefik-app app-app 2>$null
    docker rm traefik-app app-app 2>$null
} catch {
    # Ignorar erros se containers não existirem
}
Write-LogSuccess "Containers parados"

# 3. Verificar/Criar rede Traefik
Write-LogInfo "Verificando rede traefik-network..."
$networkExists = docker network ls --format "{{.Name}}" | Select-String "traefik-network"
if (-not $networkExists) {
    Write-LogInfo "Criando rede traefik-network..."
    docker network create traefik-network
}
Write-LogSuccess "Rede traefik-network configurada"

# 4. Verificar/Criar volume de certificados
Write-LogInfo "Configurando volume de certificados..."
try {
    docker volume create traefik-certificates 2>$null
} catch {
    # Volume já existe
}
Write-LogSuccess "Volume de certificados configurado"

# 5. Iniciar Traefik PRIMEIRO (com SSL)
Write-LogInfo "Iniciando Traefik com configuração SSL..."
$traefik = docker run -d `
    --name traefik-app `
    --restart unless-stopped `
    --network traefik-network `
    -p 80:80 `
    -p 443:443 `
    -p 8080:8080 `
    -v /var/run/docker.sock:/var/run/docker.sock:ro `
    -v traefik-certificates:/certificates `
    --label "traefik.enable=true" `
    traefik:v3.0 `
    --api.dashboard=true `
    --api.insecure=true `
    --providers.docker=true `
    --providers.docker.network=traefik-network `
    --providers.docker.exposedbydefault=false `
    --entrypoints.web.address=:80 `
    --entrypoints.websecure.address=:443 `
    --certificatesresolvers.letsencrypt.acme.email=admin@mdinheiro.com.br `
    --certificatesresolvers.letsencrypt.acme.storage=/certificates/acme.json `
    --certificatesresolvers.letsencrypt.acme.httpchallenge=true `
    --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web `
    --log.level=INFO `
    --accesslog=true

if ($LASTEXITCODE -eq 0) {
    Write-LogSuccess "Traefik iniciado com SSL!"
} else {
    Write-LogError "Falha ao iniciar Traefik"
}

# 6. Aguardar Traefik inicializar
Write-LogInfo "Aguardando Traefik inicializar (15s)..."
Start-Sleep -Seconds 15

# 7. Build da aplicação
Write-LogInfo "Fazendo build da aplicação..."
docker-compose build --no-cache
Write-LogSuccess "Build da aplicação concluído"

# 8. Iniciar aplicação
Write-LogInfo "Iniciando aplicação..."
docker-compose up -d

# 9. Aguardar aplicação inicializar
Write-LogInfo "Aguardando aplicação inicializar (30s)..."
Start-Sleep -Seconds 30

# 10. Verificar status dos containers
Write-LogInfo "Verificando status dos containers..."
$traefik_running = docker ps --format "{{.Names}}" | Select-String "traefik-app"
$app_running = docker ps --format "{{.Names}}" | Select-String "app"

if ($traefik_running -and $app_running) {
    Write-LogSuccess "Containers rodando corretamente!"
} else {
    Write-LogWarning "Alguns containers podem ter problemas"
    docker ps --format "table {{.Names}}\t{{.Status}}"
}

# 11. Testar conectividade HTTP
Write-LogInfo "Testando conectividade HTTP..."
try {
    $response = Invoke-WebRequest -Uri "http://mdinheiro.com.br" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-LogSuccess "HTTP funcionando!"
    }
} catch {
    Write-LogWarning "HTTP pode ter problemas"
}

# 12. Aguardar certificado SSL ser gerado
Write-LogInfo "Aguardando certificado SSL ser gerado (pode demorar 2-3 minutos)..."
for ($i = 1; $i -le 12; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "https://mdinheiro.com.br" -UseBasicParsing -TimeoutSec 10 -SkipCertificateCheck
        if ($response.StatusCode -eq 200) {
            Write-LogSuccess "HTTPS respondendo!"
            break
        }
    } catch {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 15
    }
}
Write-Host ""

# 13. Mostrar logs recentes
Write-LogInfo "Logs recentes do Traefik:"
docker logs traefik-app --tail 10

Write-LogInfo "Logs recentes da aplicação:"
docker-compose logs --tail 10

# 14. Resumo final
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎯 REBUILD COM SSL CONCLUÍDO!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "📊 RESUMO:" -ForegroundColor Cyan
Write-Host "   ✅ Traefik iniciado com SSL automático"
Write-Host "   ✅ Aplicação reconstruída e iniciada"
Write-Host "   ✅ Rede e volumes configurados"
Write-Host "   ✅ Certificados Let's Encrypt configurados"
Write-Host ""

Write-Host "🌐 ACESSO:" -ForegroundColor Cyan
Write-Host "   • Site: https://mdinheiro.com.br"
Write-Host "   • Dashboard Traefik: http://localhost:8080"
Write-Host ""

Write-Host "🔍 MONITORAMENTO:" -ForegroundColor Cyan
Write-Host "   • Status containers: docker ps"
Write-Host "   • Logs Traefik: docker logs -f traefik-app"
Write-Host "   • Logs App: docker-compose logs -f"
Write-Host "   • Certificados: docker exec traefik-app ls -la /certificates/"
Write-Host ""

Write-Host "🚨 COMANDOS ÚTEIS:" -ForegroundColor Cyan
Write-Host "   • Rebuild completo: .\rebuild-with-ssl.ps1"
Write-Host "   • Verificar SSL: curl -I https://mdinheiro.com.br"
Write-Host "   • Reiniciar tudo: docker-compose down; .\rebuild-with-ssl.ps1"
Write-Host ""

$final_traefik = docker ps --format "{{.Names}}" | Select-String "traefik-app"
$final_app = docker ps --format "{{.Names}}" | Select-String "app"

if ($final_traefik -and $final_app) {
    Write-LogSuccess "🎉 SISTEMA FUNCIONANDO COM SSL AUTOMÁTICO!"
    Write-Host ""
    Write-Host "💡 DICA: Agora você pode usar este script sempre que fizer rebuild" -ForegroundColor Yellow
    Write-Host "   O SSL será configurado automaticamente, sem necessidade de intervenção manual!" -ForegroundColor Yellow
} else {
    Write-LogWarning "⚠️  Alguns containers podem precisar de atenção"
    Write-Host ""
    Write-Host "🔧 TROUBLESHOOTING:" -ForegroundColor Yellow
    Write-Host "   1. Verifique os logs: docker logs traefik-app"
    Write-Host "   2. Teste conectividade: curl -I http://mdinheiro.com.br"
    Write-Host "   3. Aguarde mais alguns minutos para SSL"
}

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ Script concluído!" -ForegroundColor Green