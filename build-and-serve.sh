#!/bin/bash

# Script de Build e Deploy para VPS Linux
# Versão adaptada do build-and-serve.ps1 para ambiente Linux

set -e  # Parar execução em caso de erro

echo "==========================================="
echo "    SCRIPT DE BUILD E DEPLOY - LINUX"
echo "==========================================="
echo ""

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Etapa 1: Verificação de dependências
echo "[1/8] Verificando dependências..."
if ! command_exists node; then
    echo "ERRO: Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

if ! command_exists npm; then
    echo "ERRO: npm não encontrado. Instale o npm primeiro."
    exit 1
fi

echo "✓ Node.js: $(node --version)"
echo "✓ npm: $(npm --version)"
echo ""

# Etapa 2: Limpeza de builds anteriores
echo "[2/8] Limpando builds anteriores..."
if [ -d "dist" ]; then
    rm -rf dist
    echo "✓ Pasta dist removida"
fi
echo ""

# Etapa 3: Instalação de dependências
echo "[3/8] Instalando dependências..."
npm install
echo "✓ Dependências instaladas"
echo ""

# Etapa 4: Build da aplicação
echo "[4/8] Iniciando build da aplicação..."
npm run build
echo "✓ Build concluído com sucesso"
echo ""

# Etapa 5: Verificação de assets
echo "[5/8] Verificando assets gerados..."
if [ ! -d "dist" ]; then
    echo "ERRO: Pasta dist não foi criada"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "ERRO: index.html não encontrado na pasta dist"
    exit 1
fi

echo "✓ Assets verificados com sucesso"
echo ""

# Etapa 6: Verificação de meta viewport para iPhone
echo "[6/8] Verificando meta viewport para iPhone..."
if grep -q 'viewport.*width=device-width' dist/index.html; then
    echo "✓ Meta viewport encontrada"
else
    echo "⚠ Meta viewport não encontrada - pode causar problemas no iPhone"
fi
echo ""

# Etapa 7: Parar containers existentes (se Docker estiver disponível)
echo "[7/8] Verificando containers Docker..."
if command_exists docker; then
    if docker ps -q --filter "name=rm-ai-meu-dinheiro" | grep -q .; then
        echo "Parando containers existentes..."
        docker-compose down
        echo "✓ Containers parados"
    else
        echo "✓ Nenhum container em execução"
    fi
else
    echo "⚠ Docker não encontrado - pulando verificação de containers"
fi
echo ""

# Etapa 8: Iniciar servidor de preview
echo "[8/8] Iniciando servidor de preview..."
echo "Servidor será iniciado em: http://localhost:4173/"
echo ""
echo "==========================================="
echo "           BUILD CONCLUÍDO!"
echo "==========================================="
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Acesse: http://localhost:4173/"
echo "2. Teste no iPhone Safari"
echo "3. Verifique se a tela branca foi resolvida"
echo ""
echo "Para deploy com Docker:"
echo "1. Execute: chmod +x build-and-deploy.sh"
echo "2. Execute: ./build-and-deploy.sh"
echo ""
echo "Iniciando servidor de preview..."

# Iniciar servidor de preview
npx vite preview --host 0.0.0.0 --port 4173