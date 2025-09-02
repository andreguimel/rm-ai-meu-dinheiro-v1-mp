#!/bin/bash
# Script para configurar novo projeto Supabase

echo "=== Configuração do Supabase ==="
echo ""

# Solicitar informações do usuário
read -p "Digite o Project ID do seu novo Supabase (ex: xyz123abc): " PROJECT_ID
read -p "Digite a URL completa do projeto (ex: https://xyz123abc.supabase.co): " PROJECT_URL
echo "Digite a chave ANON/PUBLIC do seu projeto:"
read -s ANON_KEY

echo ""
echo "=== Atualizando configurações... ==="

# Atualizar .env
cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="$PROJECT_ID"
VITE_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY"
VITE_SUPABASE_URL="$PROJECT_URL"

# Allow trials in development (set to 'true' to enable trial access)
VITE_ALLOW_TRIALS="true"

# MercadoPago Configuration (Backend only - set in Supabase Edge Functions)
# MERCADOPAGO_ACCESS_TOKEN="your-mercadopago-access-token"
EOF

# Atualizar config.toml
sed -i "s/project_id = \".*\"/project_id = \"$PROJECT_ID\"/" supabase/config.toml

echo "✅ Configurações atualizadas!"
echo ""
echo "=== Próximos passos: ==="
echo "1. Execute as migrações: supabase db push"
echo "2. Configure as Edge Functions: supabase functions deploy"
echo "3. Configure as variáveis de ambiente no Supabase Dashboard"
echo "4. Reinicie o servidor de desenvolvimento: npm run dev"
echo ""
echo "=== Variáveis para configurar no Supabase Dashboard: ==="
echo "MERCADOPAGO_ACCESS_TOKEN=sua_chave_do_mercadopago"
echo "SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key"
