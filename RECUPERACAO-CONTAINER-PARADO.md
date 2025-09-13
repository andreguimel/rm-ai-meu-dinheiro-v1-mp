# 🚨 RECUPERAÇÃO - CONTAINER APP-APP PARADO

## 📋 SITUAÇÃO ATUAL
- ✅ Container traefik-app: Rodando
- ❌ Container app-app: **NÃO ESTÁ RODANDO**
- 📍 Localização: `/root/app/`

## 🔍 DIAGNÓSTICO INICIAL

### 1. Verificar se o container existe (parado)
```bash
docker ps -a | grep app-app
```

### 2. Verificar imagens disponíveis
```bash
docker images | grep app-app
```

### 3. Verificar logs do último container (se existir)
```bash
docker logs app-app
```

## 🚀 SOLUÇÕES POR CENÁRIO

### CENÁRIO A: Container existe mas está parado
```bash
# Tentar iniciar o container existente
docker start app-app

# Verificar se subiu
docker ps | grep app-app

# Se não subir, verificar logs
docker logs app-app --tail 20
```

### CENÁRIO B: Container foi removido mas imagem existe
```bash
# Listar imagens
docker images | grep app-app

# Recriar container com a imagem existente
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app:latest
```

### CENÁRIO C: Nem container nem imagem existem
```bash
# Verificar se existe Dockerfile
ls -la /root/app/Dockerfile
ls -la /root/Dockerfile
find /root -name "Dockerfile" 2>/dev/null

# Se encontrar Dockerfile, fazer build
cd /caminho/onde/esta/o/Dockerfile
docker build -t app-app .

# Depois criar container (usar comando do CENÁRIO B)
```

## 🛠️ SOLUÇÃO COMPLETA PASSO A PASSO

### 1. Diagnóstico completo
```bash
echo "=== DIAGNÓSTICO COMPLETO ==="
echo "Containers:"
docker ps -a
echo ""
echo "Imagens:"
docker images
echo ""
echo "Redes:"
docker network ls
echo ""
echo "Arquivos Docker:"
find /root -name "Dockerfile" -o -name "docker-compose.yml" 2>/dev/null
```

### 2. Localizar e preparar ambiente
```bash
# Ir para diretório do projeto
cd /root/app

# Verificar estrutura
ls -la

# Verificar se tem package.json (projeto Node.js)
if [ -f "package.json" ]; then
    echo "✅ Projeto Node.js encontrado"
    cat package.json | grep '"name"'
else
    echo "❌ package.json não encontrado"
fi
```

### 3. Criar Dockerfile se não existir
```bash
# Se não existir Dockerfile, criar um
if [ ! -f "Dockerfile" ]; then
    cat > Dockerfile << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
    echo "✅ Dockerfile criado"
fi
```

### 4. Criar configuração nginx se não existir
```bash
# Criar nginx.conf se não existir
if [ ! -f "nginx.conf" ]; then
    cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
    echo "✅ nginx.conf criado"
fi
```

### 5. Build da aplicação
```bash
# Instalar dependências e fazer build
if [ -f "package.json" ]; then
    echo "📦 Instalando dependências..."
    npm install
    
    echo "🔨 Fazendo build..."
    npm run build
    
    echo "✅ Build concluído!"
fi
```

### 6. Build da imagem Docker
```bash
echo "🐳 Fazendo build da imagem Docker..."
docker build -t app-app .

if [ $? -eq 0 ]; then
    echo "✅ Imagem Docker criada com sucesso!"
else
    echo "❌ Falha no build da imagem Docker!"
    exit 1
fi
```

### 7. Criar e iniciar container
```bash
echo "🚀 Criando e iniciando container..."

# Remover container antigo se existir
docker rm -f app-app 2>/dev/null || true

# Criar novo container
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app:latest

if [ $? -eq 0 ]; then
    echo "✅ Container criado e iniciado com sucesso!"
else
    echo "❌ Falha ao criar/iniciar container!"
    exit 1
fi
```

### 8. Verificação final
```bash
echo "🔍 Verificação final..."

# Aguardar inicialização
sleep 10

# Verificar se container está rodando
if docker ps | grep -q "app-app.*Up"; then
    echo "✅ Container app-app está rodando!"
else
    echo "❌ Container app-app NÃO está rodando!"
    echo "Logs do container:"
    docker logs app-app --tail 20
    exit 1
fi

# Verificar logs
echo "📋 Últimos logs:"
docker logs app-app --tail 10

# Testar conectividade
echo "🧪 Testando conectividade..."
if curl -f -s -I http://localhost/ > /dev/null; then
    echo "✅ Teste interno - OK"
else
    echo "⚠️ Teste interno - FALHOU"
fi

if curl -f -s -I https://mdinheiro.com.br/ > /dev/null; then
    echo "✅ Teste externo - OK"
else
    echo "⚠️ Teste externo - FALHOU"
fi

echo "🎉 Recuperação concluída!"
echo "🌐 Acesse: https://mdinheiro.com.br"
```

## 📝 SCRIPT COMPLETO DE RECUPERAÇÃO

```bash
#!/bin/bash
# recovery-app-container.sh

set -e

echo "🚨 RECUPERAÇÃO DO CONTAINER APP-APP"
echo "===================================="

# Ir para diretório do projeto
cd /root/app

# Diagnóstico
echo "📋 Diagnóstico:"
docker ps -a | grep app-app || echo "Container app-app não encontrado"
docker images | grep app-app || echo "Imagem app-app não encontrada"

# Remover container antigo se existir
docker rm -f app-app 2>/dev/null || true

# Verificar se precisa fazer build
if ! docker images | grep -q "app-app"; then
    echo "🔨 Fazendo build da imagem..."
    
    # Criar Dockerfile se não existir
    if [ ! -f "Dockerfile" ]; then
        echo "📄 Criando Dockerfile..."
        # [Conteúdo do Dockerfile aqui]
    fi
    
    # Build
    docker build -t app-app .
fi

# Criar container
echo "🚀 Criando container..."
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app:latest

# Verificar
sleep 10
docker ps | grep app-app
echo "✅ Container recuperado!"
```

## 🆘 COMANDOS DE EMERGÊNCIA

### Se tudo falhar, usar imagem nginx simples:
```bash
# Criar container temporário com nginx
docker run -d --name app-app-temp \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  -v /root/app/dist:/usr/share/nginx/html:ro \
  nginx:alpine

# Depois renomear
docker stop app-app-temp
docker rename app-app-temp app-app
docker start app-app
```

---

**🎯 PRÓXIMOS PASSOS:**
1. Execute o diagnóstico completo
2. Siga o cenário apropriado
3. Teste a aplicação no iPhone
4. Verifique se assets estão carregando (não mais 404)

**📱 TESTE FINAL:** Acesse https://mdinheiro.com.br no iPhone - deve carregar sem tela branca!