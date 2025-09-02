# Script PowerShell para configurar novo projeto Supabase

Write-Host "=== Configuração do Supabase ===" -ForegroundColor Green
Write-Host ""

# Solicitar informações do usuário
$PROJECT_ID = Read-Host "Digite o Project ID do seu novo Supabase (ex: xyz123abc)"
$PROJECT_URL = Read-Host "Digite a URL completa do projeto (ex: https://xyz123abc.supabase.co)"
$ANON_KEY = Read-Host "Digite a chave ANON/PUBLIC do seu projeto" -AsSecureString
$ANON_KEY_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ANON_KEY))

Write-Host ""
Write-Host "=== Atualizando configurações... ===" -ForegroundColor Yellow

# Atualizar .env
$envContent = @"
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="$PROJECT_ID"
VITE_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY_PLAIN"
VITE_SUPABASE_URL="$PROJECT_URL"

# Allow trials in development (set to 'true' to enable trial access)
VITE_ALLOW_TRIALS="true"

# MercadoPago Configuration (Backend only - set in Supabase Edge Functions)
# MERCADOPAGO_ACCESS_TOKEN="your-mercadopago-access-token"
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

# Atualizar config.toml
$configPath = "supabase\config.toml"
if (Test-Path $configPath) {
    $config = Get-Content $configPath
    $config = $config -replace 'project_id = ".*"', "project_id = `"$PROJECT_ID`""
    $config | Out-File -FilePath $configPath -Encoding UTF8
}

Write-Host "✅ Configurações atualizadas!" -ForegroundColor Green
Write-Host ""
Write-Host "=== Próximos passos: ===" -ForegroundColor Cyan
Write-Host "1. Execute as migrações: supabase db push"
Write-Host "2. Configure as Edge Functions: supabase functions deploy"
Write-Host "3. Configure as variáveis de ambiente no Supabase Dashboard"
Write-Host "4. Reinicie o servidor de desenvolvimento: npm run dev"
Write-Host ""
Write-Host "=== Variáveis para configurar no Supabase Dashboard: ===" -ForegroundColor Cyan
Write-Host "MERCADOPAGO_ACCESS_TOKEN=sua_chave_do_mercadopago"
Write-Host "SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key"
