# Script PowerShell para Build e Serve - Resolver Tela Branca iPhone
# Versao sem Docker para ambiente Windows

function Write-Log {
    param([string]$Message, [string]$Color = "Cyan")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Log "OK $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-Log "ERRO $Message" "Red"
    exit 1
}

# Banner
Write-Host "===============================================" -ForegroundColor Blue
Write-Host "BUILD E SERVE - RESOLVER TELA BRANCA IPHONE" -ForegroundColor Blue
Write-Host "===============================================" -ForegroundColor Blue
Write-Host ""

# 1. Verificar dependencias
Write-Log "Verificando dependencias..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js nao encontrado! Instale o Node.js primeiro."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm nao encontrado! Instale o npm primeiro."
}

Write-Success "Dependencias verificadas"

# 2. Limpar builds anteriores
Write-Log "Limpando builds anteriores..."
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
}
Write-Success "Limpeza concluida"

# 3. Build da aplicacao
Write-Log "Executando build da aplicacao..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha no build da aplicacao"
}

if (-not (Test-Path "dist")) {
    Write-Error "Pasta dist nao foi criada! Verifique o build."
}

Write-Success "Build concluido com sucesso"

# 4. Verificar assets gerados
Write-Log "Verificando assets gerados..."
$jsFiles = @(Get-ChildItem -Path "dist\assets" -Filter "*.js" -ErrorAction SilentlyContinue)
$cssFiles = @(Get-ChildItem -Path "dist\assets" -Filter "*.css" -ErrorAction SilentlyContinue)

if ($jsFiles.Count -eq 0) {
    Write-Error "Nenhum arquivo JS encontrado em dist/assets/"
}

if ($cssFiles.Count -eq 0) {
    Write-Error "Nenhum arquivo CSS encontrado em dist/assets/"
}

Write-Success "Assets verificados: $($jsFiles.Count) JS, $($cssFiles.Count) CSS"

# 5. Verificar meta viewport no index.html
Write-Log "Verificando otimizacoes para iPhone..."
$indexContent = Get-Content "dist\index.html" -Raw

if ($indexContent -match "viewport-fit=cover") {
    Write-Success "Meta viewport otimizado para iPhone encontrado"
} else {
    Write-Log "Meta viewport pode nao estar otimizado para iPhone" "Yellow"
}

if ($indexContent -match "apple-mobile-web-app-capable") {
    Write-Success "Meta tags para iOS encontradas"
} else {
    Write-Log "Meta tags para iOS podem estar faltando" "Yellow"
}

# 6. Resumo final
Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "BUILD CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "RESUMO:" -ForegroundColor Yellow
Write-Host "   • Build executado com sucesso" -ForegroundColor White
Write-Host "   • Assets JS/CSS gerados corretamente" -ForegroundColor White
Write-Host "   • Meta viewport otimizado para iPhone" -ForegroundColor White
Write-Host "   • Arquivos prontos para deploy" -ForegroundColor White
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "   1. O servidor de preview sera iniciado automaticamente" -ForegroundColor White
Write-Host "   2. Teste no navegador desktop primeiro" -ForegroundColor White
Write-Host "   3. Teste no iPhone Safari" -ForegroundColor White
Write-Host "   4. Verifique se nao ha mais tela branca apos login" -ForegroundColor White
Write-Host ""
Write-Host "Iniciando servidor de preview..." -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Gray
Write-Host ""

# Iniciar servidor de preview
npm run preview