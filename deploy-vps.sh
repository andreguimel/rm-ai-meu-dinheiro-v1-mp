#!/bin/bash

# Script de Deploy para VPS
# Este script configura e executa a aplicação em uma VPS

echo "🚀 Iniciando deploy para VPS..."

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$VITE_APP_URL" ]; then
    echo "⚠️  AVISO: VITE_APP_URL não configurada. Usando '*' para CORS."
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

# Configurar porta padrão se não especificada
export PORT=${PORT:-3000}

echo "✅ Deploy concluído!"
echo "🌐 Aplicação rodará na porta: $PORT"
echo "🔗 URL configurada para CORS: ${VITE_APP_URL:-'*'}"

# Instruções para execução
echo ""
echo "📋 Para executar a aplicação:"
echo "   npm run preview  # Para servir o build"
echo "   ou"
echo "   npm run dev      # Para desenvolvimento"
echo ""
echo "🔧 Configurações importantes para VPS:"
echo "   1. Certifique-se que a porta $PORT está aberta no firewall"
echo "   2. Configure um proxy reverso (nginx/apache) se necessário"
echo "   3. Defina VITE_APP_URL no .env para o domínio correto"
echo "   4. Para HTTPS, configure SSL no proxy reverso"