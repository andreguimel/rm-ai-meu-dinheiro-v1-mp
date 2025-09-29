# Script de Deploy para VPS - Correções iPhone
# Este script faz o deploy da versão otimizada com correções para tela branca no iPhone

param(
    [string]$VpsHost = "vmi2736280.contaboserver.net",
    [string]$VpsUser = "root",
    [string]$AppPath = "/root/app"
)

Write-Host "Iniciando deploy das correções para iPhone..." -ForegroundColor Green

# Verificar se o build existe
if (!(Test-Path "dist")) {
    Write-Host "Pasta 'dist' não encontrada. Execute 'npm run build' primeiro." -ForegroundColor Red
    exit 1
}

# Criar arquivo tar.gz com os arquivos de build
Write-Host "Compactando arquivos de build..." -ForegroundColor Yellow
tar -czf "dist-optimized.tar.gz" -C dist .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao compactar arquivos." -ForegroundColor Red
    exit 1
}

# Fazer upload do arquivo para VPS
Write-Host "Fazendo upload para VPS..." -ForegroundColor Yellow
scp "dist-optimized.tar.gz" "${VpsUser}@${VpsHost}:${AppPath}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no upload. Verifique a conexão SSH." -ForegroundColor Red
    exit 1
}

# Executar comandos na VPS para fazer deploy
Write-Host "Executando deploy na VPS..." -ForegroundColor Yellow
$deployCommands = @"
cd $AppPath
echo 'Parando containers...'
docker-compose down
echo 'Fazendo backup da versao atual...'
if [ -d "dist" ]; then
    mv dist dist-backup-`$(date +%Y%m%d-%H%M%S)
fi
echo 'Extraindo nova versao...'
mkdir -p dist
tar -xzf dist-optimized.tar.gz -C dist/
echo 'Reconstruindo imagem Docker...'
docker-compose build --no-cache app
echo 'Iniciando containers...'
docker-compose up -d
echo 'Limpando arquivos temporarios...'
rm -f dist-optimized.tar.gz
echo 'Deploy concluido!'
echo 'Status dos containers:'
docker-compose ps
"@

ssh "${VpsUser}@${VpsHost}" $deployCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "Acesse: https://mdinheiro.com.br/dashboard" -ForegroundColor Cyan
    Write-Host "Teste no iPhone para verificar se a tela branca foi corrigida." -ForegroundColor Yellow
} else {
    Write-Host "Erro durante o deploy." -ForegroundColor Red
    exit 1
}

# Limpar arquivo local
Remove-Item "dist-optimized.tar.gz" -ErrorAction SilentlyContinue

Write-Host "Processo finalizado!" -ForegroundColor Green