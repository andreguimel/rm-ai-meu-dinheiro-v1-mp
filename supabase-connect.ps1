# Script para conectar ao Supabase com senha
param(
    [string]$Password
)

if (-not $Password) {
    $Password = Read-Host "Digite a senha do banco de dados Supabase" -AsSecureString
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))
}

Write-Host "Conectando ao projeto Supabase..." -ForegroundColor Green

# Set password as environment variable temporarily
$env:PGPASSWORD = $Password

try {
    supabase link --project-ref ponxumxwjodpgwhepwxc
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Projeto vinculado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Falha na vinculação. Verifique a senha." -ForegroundColor Red
        Write-Host "Você pode resetar a senha em: https://supabase.com/dashboard/project/ponxumxwjodpgwhepwxc/settings/database" -ForegroundColor Yellow
    }
} finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
}

Write-Host ""
Write-Host "Comandos uteis apos a vinculacao:" -ForegroundColor Cyan
Write-Host "- supabase functions deploy" -ForegroundColor White
Write-Host "- supabase gen types typescript --remote > src/types/database.types.ts" -ForegroundColor White
Write-Host "- supabase db push" -ForegroundColor White
