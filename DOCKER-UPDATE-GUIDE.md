# 🐳 Guia de Atualização - Docker

## 📋 Situação: Aplicação Rodando no Docker

Se sua aplicação está rodando dentro de um container Docker na VPS, siga este guia para atualizar e corrigir o problema da tela branca.

---

## 🔍 1. IDENTIFICAR O SETUP ATUAL

### Verificar se está usando Docker:
```bash
# Verificar containers rodando
docker ps

# Verificar imagens
docker images

# Verificar docker-compose (se aplicável)
docker-compose ps
```

### Localizar arquivos de configuração:
```bash
# Procurar por Dockerfile
find . -name "Dockerfile" -o -name "docker-compose.yml" -o -name "docker-compose.yaml"
```

---

## 🛠️ 2. MÉTODOS DE ATUALIZAÇÃO

### Método A: Rebuild Completo (Recomendado)

```bash
# 1. Parar containers
docker-compose down
# ou
docker stop <container_name>

# 2. Fazer pull das mudanças do Git
git pull origin main

# 3. Rebuild da imagem (força rebuild sem cache)
docker-compose build --no-cache
# ou
docker build --no-cache -t meu-dinheiro .

# 4. Subir novamente
docker-compose up -d
# ou
docker run -d -p 3000:3000 --name meu-dinheiro meu-dinheiro
```

### Método B: Atualização Rápida (se Dockerfile usa multi-stage)

```bash
# 1. Entrar no container
docker exec -it <container_name> /bin/bash
# ou
docker exec -it <container_name> /bin/sh

# 2. Dentro do container, fazer build
npm run build

# 3. Sair do container
exit

# 4. Reiniciar container
docker restart <container_name>
```

### Método C: Volume Mount (se código está montado como volume)

```bash
# Se o código está montado como volume, apenas:
# 1. Fazer pull das mudanças
git pull origin main

# 2. Entrar no container e fazer build
docker exec -it <container_name> npm run build

# 3. Reiniciar container
docker restart <container_name>
```

---

## 📁 3. DOCKERFILE OTIMIZADO PARA VITE

Se precisar criar/atualizar o Dockerfile:

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production=false

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copiar build para nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração nginx customizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Comando para iniciar
CMD ["nginx", "-g", "daemon off;"]
```

### Configuração Nginx para SPA:

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Servir arquivos estáticos com cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA routing - todas as rotas vão para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

---

## 🐙 4. DOCKER-COMPOSE COMPLETO

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
      - VITE_APP_URL=https://mdinheiro.com.br
      - PORT=3000
    volumes:
      # Se quiser montar certificados SSL
      - ./ssl:/etc/ssl/certs
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

## 🚀 5. SCRIPT DE DEPLOY AUTOMATIZADO

```bash
#!/bin/bash
# deploy-docker.sh

set -e  # Parar em caso de erro

echo "🐳 Iniciando deploy Docker..."

# 1. Fazer backup do container atual
echo "📦 Fazendo backup..."
docker tag meu-dinheiro:latest meu-dinheiro:backup-$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# 2. Parar containers
echo "⏹️ Parando containers..."
docker-compose down

# 3. Fazer pull das mudanças
echo "📥 Atualizando código..."
git pull origin main

# 4. Rebuild da imagem
echo "🔨 Fazendo rebuild..."
docker-compose build --no-cache

# 5. Verificar se build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build bem-sucedido!"
else
    echo "❌ Erro no build!"
    exit 1
fi

# 6. Subir containers
echo "🚀 Subindo containers..."
docker-compose up -d

# 7. Verificar se containers estão rodando
sleep 5
if docker-compose ps | grep -q "Up"; then
    echo "✅ Deploy concluído com sucesso!"
    echo "🌐 Aplicação disponível em: https://mdinheiro.com.br"
else
    echo "❌ Erro: Containers não estão rodando!"
    echo "📋 Status dos containers:"
    docker-compose ps
    exit 1
fi

# 8. Mostrar logs recentes
echo "📋 Logs recentes:"
docker-compose logs --tail=20
```

---

## 🔧 6. COMANDOS DE DIAGNÓSTICO

### Verificar se aplicação buildou corretamente:
```bash
# Entrar no container
docker exec -it <container_name> /bin/sh

# Verificar se dist existe
ls -la /usr/share/nginx/html/

# Verificar se assets existem
ls -la /usr/share/nginx/html/assets/

# Testar nginx config
nginx -t
```

### Verificar logs:
```bash
# Logs do container
docker logs <container_name>

# Logs em tempo real
docker logs -f <container_name>

# Logs do docker-compose
docker-compose logs -f
```

### Testar conectividade:
```bash
# Testar dentro do container
docker exec -it <container_name> curl -I http://localhost/

# Testar assets
docker exec -it <container_name> curl -I http://localhost/assets/
```

---

## ⚡ 7. SOLUÇÃO RÁPIDA PARA TELA BRANCA

Se você tem pressa e quer uma solução rápida:

```bash
# Comando único para rebuild e deploy
docker-compose down && \
git pull origin main && \
docker-compose build --no-cache && \
docker-compose up -d && \
echo "✅ Deploy concluído! Teste: https://mdinheiro.com.br"
```

---

## 🆘 8. TROUBLESHOOTING

### Problema: Assets ainda retornam 404
```bash
# Verificar se build gerou os assets
docker exec -it <container_name> find /usr/share/nginx/html -name "*.js" -o -name "*.css"

# Se não encontrar, o problema é no build
docker exec -it <container_name> npm run build
```

### Problema: Container não inicia
```bash
# Verificar logs de erro
docker logs <container_name>

# Verificar se portas estão ocupadas
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

### Problema: Nginx não serve arquivos
```bash
# Testar config do nginx
docker exec -it <container_name> nginx -t

# Recarregar nginx
docker exec -it <container_name> nginx -s reload
```

---

## 📋 CHECKLIST FINAL

- [ ] Container parado com `docker-compose down`
- [ ] Código atualizado com `git pull`
- [ ] Rebuild feito com `--no-cache`
- [ ] Container iniciado com `docker-compose up -d`
- [ ] Assets existem em `/usr/share/nginx/html/assets/`
- [ ] Nginx config está correto
- [ ] Teste: `curl -I https://mdinheiro.com.br/assets/` retorna 200
- [ ] Aplicação carrega sem tela branca no iPhone

**🎯 Resultado esperado:** mdinheiro.com.br carrega corretamente em todos os dispositivos.