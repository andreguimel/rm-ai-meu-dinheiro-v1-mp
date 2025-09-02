@echo off
echo ==========================================
echo        SUPABASE CONNECTION HELPER
echo ==========================================
echo.
echo 1. Vá para: https://supabase.com/dashboard/project/ponxumxwjodpgwhepwxc/settings/database
echo 2. Resetar a senha do banco se necessário
echo 3. Digite a senha quando solicitado
echo.
set /p db_password="Digite a senha do banco: "

echo.
echo Conectando ao Supabase...
set PGPASSWORD=%db_password%
supabase link --project-ref ponxumxwjodpgwhepwxc

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Conectado com sucesso!
    echo.
    echo Comandos úteis:
    echo - supabase functions deploy
    echo - supabase gen types typescript --remote ^> src/types/database.types.ts
    echo - supabase db push
) else (
    echo.
    echo ❌ Falha na conexão. Verifique a senha.
    echo Resetar senha: https://supabase.com/dashboard/project/ponxumxwjodpgwhepwxc/settings/database
)

set PGPASSWORD=
pause
