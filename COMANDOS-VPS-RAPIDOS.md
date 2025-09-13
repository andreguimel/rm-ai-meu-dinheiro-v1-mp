# 🚀 COMANDOS RÁPIDOS PARA VPS

## 📋 VERIFICAÇÃO INICIAL

```bash
# Verificar containers rodando
docker ps -a

# Verificar imagens disponíveis
docker images

# Verificar uso de recursos
docker stats --no-stream

# Verificar logs em tempo real
docker logs app-app -f
docker logs traefik-app -f
```

## 🔧 ATUALIZAÇÃO RÁPIDA (MÉTODO SIMPLES)

### 1. Backup e parada

```bash
# Criar backup
docker commit app-app app-app:backup-$(date +%Y%m%d-%H%M%S)

# Parar container
docker stop app-app
docker rm app-app
```

### 2. Rebuild e restart

```bash
# Localizar Dockerfile (testar cada caminho)
ls -la /root/Dockerfile
ls -la /opt/app/Dockerfile
ls -la /var/www/app/Dockerfile

# Fazer build (ajustar caminho conforme encontrado)
cd /root  # ou /opt/app ou onde estiver o Dockerfile
docker build -t app-app .

# Iniciar container
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app
```

### 3. Verificação

```bash
# Verificar se subiu
docker ps

# Testar conectividade
curl -I https://mdinheiro.com.br/
curl -I https://mdinheiro.com.br/assets/

# Verificar logs
docker logs app-app --tail 20
```

## 🛠️ ATUALIZAÇÃO COM CÓDIGO FONTE

### Se o código está mapeado como volume:

```bash
# Encontrar diretório do projeto
docker exec app-app pwd
docker inspect app-app | grep -A 10 "Mounts"

# Atualizar código
cd /caminho/do/projeto  # ajustar conforme encontrado
git pull origin main
npm install
npm run build

# Reiniciar container
docker restart app-app
```

### Se o código está dentro da imagem:

```bash
# Precisa rebuild completo (usar método simples acima)
```

## 🚨 SCRIPT AUTOMATIZADO

### Fazer download e executar:

```bash
# Fazer download do script (se estiver no repositório)
wget https://raw.githubusercontent.com/seu-usuario/seu-repo/main/update-vps-docker.sh
# ou
curl -O https://raw.githubusercontent.com/seu-usuario/seu-repo/main/update-vps-docker.sh

# Dar permissão de execução
chmod +x update-vps-docker.sh

# Executar
./update-vps-docker.sh
```

### Ou copiar e colar o script:

```bash
# Criar arquivo
nano update-vps-docker.sh

# Colar o conteúdo do script
# Salvar (Ctrl+X, Y, Enter)

# Dar permissão e executar
chmod +x update-vps-docker.sh
./update-vps-docker.sh
```

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### Assets 404 (tela branca):

```bash
# Verificar se assets existem no container
docker exec app-app ls -la /usr/share/nginx/html/
docker exec app-app ls -la /usr/share/nginx/html/assets/

# Verificar configuração nginx
docker exec app-app cat /etc/nginx/conf.d/default.conf
docker exec app-app nginx -t

# Testar assets específicos
curl -I https://mdinheiro.com.br/assets/index-[hash].js
curl -I https://mdinheiro.com.br/assets/index-[hash].css
```

### Problemas de rede:

```bash
# Verificar redes Docker
docker network ls
docker network inspect traefik-network

# Verificar conectividade entre containers
docker exec traefik-app ping app-app
docker exec app-app ping traefik-app
```

### Problemas de certificado:

```bash
# Verificar certificados Traefik
docker exec traefik-app ls -la /data/acme.json

# Forçar renovação (se necessário)
docker restart traefik-app
```

## 🔄 ROLLBACK DE EMERGÊNCIA

```bash
# Listar backups disponíveis
docker images | grep backup

# Parar container atual
docker stop app-app
docker rm app-app

# Restaurar backup (substituir YYYYMMDD-HHMMSS pela data do backup)
docker run -d --name app-app \
  --network traefik-network \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.app.rule=Host(\`mdinheiro.com.br\`)" \
  --label "traefik.http.routers.app.tls=true" \
  --label "traefik.http.routers.app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.app.loadbalancer.server.port=80" \
  app-app:backup-YYYYMMDD-HHMMSS

# Verificar
docker ps
curl -I https://mdinheiro.com.br/
```

## 🧹 LIMPEZA E MANUTENÇÃO

```bash
# Remover imagens não utilizadas
docker image prune -f

# Remover containers parados
docker container prune -f

# Remover volumes não utilizados
docker volume prune -f

# Verificar espaço em disco
df -h
docker system df

# Limpeza completa (CUIDADO!)
docker system prune -a -f
```

## 📱 TESTE ESPECÍFICO PARA IPHONE

```bash
# Verificar se meta tags estão presentes
curl -s https://mdinheiro.com.br/ | grep -i viewport
curl -s https://mdinheiro.com.br/ | grep -i apple-mobile

# Verificar se assets estão com cache correto
curl -I https://mdinheiro.com.br/assets/index-*.js | grep -i cache
curl -I https://mdinheiro.com.br/assets/index-*.css | grep -i cache

# Testar compressão gzip
curl -H "Accept-Encoding: gzip" -I https://mdinheiro.com.br/
```

## 📊 MONITORAMENTO

```bash
# Verificar recursos em tempo real
docker stats

# Verificar logs com timestamp
docker logs app-app -t --tail 50

# Verificar saúde do container
docker inspect app-app | grep -A 5 "Health"

# Verificar uptime
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}"
```

---

## 🎯 RESUMO PARA CORREÇÃO DA TELA BRANCA:

1. **Backup**: `docker commit app-app app-app:backup-$(date +%Y%m%d-%H%M%S)`
2. **Parar**: `docker stop app-app && docker rm app-app`
3. **Build**: `docker build -t app-app .` (no diretório do Dockerfile)
4. **Iniciar**: Usar comando completo com labels do Traefik
5. **Testar**: `curl -I https://mdinheiro.com.br/assets/`
6. **Verificar**: Assets devem retornar 200, não 404

**🚨 IMPORTANTE**: Sempre criar backup antes de qualquer alteração!
