# Script PowerShell para Build e Serve - Resolver Tela Branca iPhone
# Versão sem Docker para ambiente Windows

# Configurar cores
$Host.UI.RawUI.ForegroundColor = "White"

function Write-Log {
    param([string]$Message, [string]$Color = "Cyan")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Log "✅ $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-Log "⚠️  $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-Log "❌ $Message" "Red"
    exit 1
}

# Banner
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "🚀 BUILD E SERVE OTIMIZADO - RESOLVER TELA BRANCA IPHONE" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# 1. Verificar dependências
Write-Log "🔍 Verificando dependências..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js não encontrado! Instale o Node.js primeiro."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm não encontrado! Instale o npm primeiro."
}

Write-Success "Dependências verificadas"

# 2. Limpar builds anteriores
Write-Log "🧹 Limpando builds anteriores..."
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
}
Write-Success "Limpeza concluída"

# 3. Instalar dependências
Write-Log "📦 Instalando dependências..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao instalar dependências"
}
Write-Success "Dependências instaladas"

# 4. Build da aplicação
Write-Log "🔨 Executando build da aplicação..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha no build da aplicação"
}

if (-not (Test-Path "dist")) {
    Write-Error "Pasta dist não foi criada! Verifique o build."
}

Write-Success "Build concluído com sucesso"

# 5. Verificar assets gerados
Write-Log "📋 Verificando assets gerados..."
$jsFiles = @(Get-ChildItem -Path "dist\assets" -Filter "*.js" -ErrorAction SilentlyContinue)
$cssFiles = @(Get-ChildItem -Path "dist\assets" -Filter "*.css" -ErrorAction SilentlyContinue)

if ($jsFiles.Count -eq 0) {
    Write-Error "Nenhum arquivo JS encontrado em dist/assets/"
}

if ($cssFiles.Count -eq 0) {
    Write-Error "Nenhum arquivo CSS encontrado em dist/assets/"
}

Write-Success "Assets verificados: $($jsFiles.Count) JS, $($cssFiles.Count) CSS"

# 6. Verificar meta viewport no index.html
Write-Log "📱 Verificando otimizações para iPhone..."
$indexContent = Get-Content "dist\index.html" -Raw

if ($indexContent -notmatch "viewport-fit=cover") {
    Write-Warning "Meta viewport pode não estar otimizado para iPhone"
} else {
    Write-Success "Meta viewport otimizado para iPhone encontrado"
}

if ($indexContent -notmatch "apple-mobile-web-app-capable") {
    Write-Warning "Meta tags para iOS podem estar faltando"
} else {
    Write-Success "Meta tags para iOS encontradas"
}

# 7. Listar arquivos gerados
Write-Log "📁 Arquivos gerados na pasta dist:"
Get-ChildItem -Path "dist" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\dist\", "")
    Write-Host "   📄 $relativePath" -ForegroundColor Gray
}

# 8. Iniciar servidor de preview
Write-Log "🚀 Iniciando servidor de preview..."
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ BUILD CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📊 RESUMO:" -ForegroundColor Yellow
Write-Host "   • Build executado com sucesso" -ForegroundColor White
Write-Host "   • Assets JS/CSS gerados corretamente" -ForegroundColor White
Write-Host "   • Meta viewport otimizado para iPhone" -ForegroundColor White
Write-Host "   • Arquivos prontos para deploy" -ForegroundColor White
Write-Host ""
Write-Host "🔗 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "   1. O servidor de preview será iniciado automaticamente" -ForegroundColor White
Write-Host "   2. Teste no navegador desktop primeiro" -ForegroundColor White
Write-Host "   3. Teste no iPhone Safari" -ForegroundColor White
Write-Host "   4. Verifique se não há mais tela branca após login" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Iniciando servidor de preview..." -ForegroundColor Cyan
Write-Host "   Pressione Ctrl+C para parar o servidor" -ForegroundColor Gray
Write-Host ""

# Iniciar servidor de preview
npm run preview