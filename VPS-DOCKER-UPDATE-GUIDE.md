# 🐳 GUIA DE ATUALIZAÇÃO DOCKER NA VPS

## 📋 SITUAÇÃO ATUAL

- **Container app-app**: Rodando (healthy)
- **Container traefik-app**: Rodando (proxy reverso)
- **Problema**: Assets JS/CSS retornando 404 (tela branca no iPhone)

## 🚀 MÉTODO 1: ATUALIZAÇÃO RÁPIDA (RECOMENDADO)

### 1. Conectar na VPS e verificar estrutura

```bash
# Verificar containers rodando
docker ps -a

# Verificar imagens
docker images

# Localizar arquivos Docker
find /root -name "Dockerfile" -o -name "docker-compose.yml" 2>/dev/null
find /opt -name "Dockerfile" -o -name "docker-compose.yml" 2>/dev/null
find /var -name "Dockerfile" -o -name "docker-compose.yml" 2>/dev/null
```

### 2. Backup dos containers atuais

```bash
# Criar backup da imagem atual
docker commit app-app app-app:backup-$(date +%Y%m%d-%H%M%S)

# Verificar backup criado
docker images | grep backup
```

### 3. Atualizar código fonte

```bash
# Localizar diretório do projeto
docker exec app-app pwd
docker exec app-app ls -la

# Se o código está mapeado como volume
docker inspect app-app | grep -A 10 "Mounts"

# Atualizar via git (se mapeado)
cd /caminho/do/projeto
git pull origin main
npm run build
```

### 4. Rebuild do container

```bash
# Parar container atual
docker stop app-app

# Remover container (mantém imagem)
docker rm app-app

# Rebuild da imagem
docker build -t app-app .

# Ou se usar docker-compose
docker-compose up -d --build app
```

## 🔧 MÉTODO 2: ATUALIZAÇÃO COMPLETA

### 1. Script de atualização automática

```bash
#!/bin/bash
# update-vps-app.sh

set -e

echo "🚀 Iniciando atualização da aplicação..."

# Backup
echo "📦 Criando backup..."
BACKUP_TAG="app-app:backup-$(date +%Y%m%d-%H%M%S)"
docker commit app-app $BACKUP_TAG
echo "✅ Backup criado: $BACKUP_TAG"

# Parar containers
echo "⏹️ Parando containers..."
docker stop app-app

# Atualizar código (se necessário)
if [ -d "/opt/app" ]; then
    echo "📥 Atualizando código..."
    cd /opt/app
    git pull origin main
    npm run build
fi

# Rebuild
echo "🔨 Fazendo rebuild..."
docker rm app-app
docker build -t app-app .

# Iniciar novamente
echo "▶️ Iniciando containers..."
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  app-app

# Verificar saúde
echo "🏥 Verificando saúde dos containers..."
sleep 10
docker ps
docker logs app-app --tail 20

# Testar endpoints
echo "🧪 Testando endpoints..."
curl -I http://localhost/
curl -I https://mdinheiro.com.br/

echo "✅ Atualização concluída!"
```

## 📁 DOCKERFILE OTIMIZADO (se precisar criar)

```dockerfile
# Dockerfile
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
```

## 🌐 CONFIGURAÇÃO NGINX PARA SPA

```nginx
# nginx.conf
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
```

## 🔍 DIAGNÓSTICO E TROUBLESHOOTING

### Verificar logs

```bash
# Logs do container
docker logs app-app -f

# Logs do Traefik
docker logs traefik-app -f

# Verificar rede
docker network ls
docker network inspect traefik-network
```

### Testar assets

```bash
# Entrar no container
docker exec -it app-app sh

# Verificar arquivos
ls -la /usr/share/nginx/html/
ls -la /usr/share/nginx/html/assets/

# Testar nginx config
nginx -t
```

### Verificar conectividade

```bash
# Teste interno
curl -I http://app-app/

# Teste externo
curl -I https://mdinheiro.com.br/
curl -I https://mdinheiro.com.br/assets/
```

## 📱 OTIMIZAÇÕES ESPECÍFICAS PARA IPHONE

### Meta tags no index.html

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

### Service Worker para cache

```javascript
// sw.js
self.addEventListener("fetch", (event) => {
  if (
    event.request.destination === "script" ||
    event.request.destination === "style"
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Containers rodando sem erros
- [ ] Assets JS/CSS carregando (status 200)
- [ ] HTTPS funcionando
- [ ] Teste no iPhone/Safari
- [ ] Logs sem erros críticos
- [ ] Performance adequada
- [ ] Backup criado antes da atualização

## 🆘 ROLLBACK DE EMERGÊNCIA

```bash
# Parar container atual
docker stop app-app
docker rm app-app

# Restaurar backup
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  app-app:backup-YYYYMMDD-HHMMSS
```

---

**💡 DICA**: Execute sempre o backup antes de qualquer atualização e teste em ambiente de desenvolvimento primeiro!
