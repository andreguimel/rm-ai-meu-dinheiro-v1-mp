# 🔧 Resolver Conflito de Containers Docker

## 🚨 Problema Identificado

```
Error response from daemon: Conflict. The container name "/traefik-app" is already in use by container "6a8e6553d44228181c0270967bc339fc137b6793b9617089e4f3348e10dc3159". You have to remove (or rename) that container to be able to reuse that name.
```

## 🎯 Causa Raiz

- Container `traefik-app` já existe e está em conflito
- Containers órfãos não foram removidos adequadamente
- Possível problema com volumes e redes Docker

## 🛠️ Solução Rápida (Comando Único)

```bash
# Conectar na VPS
ssh root@SEU_IP_VPS

# Executar comando único para resolver
docker stop traefik-app app-app; docker rm traefik-app app-app; docker-compose down --remove-orphans; docker-compose up -d --force-recreate
```

## 📋 Solução Completa (Script Automatizado)

### 1. Conectar na VPS
```bash
ssh root@SEU_IP_VPS
cd /root/app
```

### 2. Baixar e executar o script
```bash
# Fazer download do script
wget -O resolver-conflito-containers.sh https://raw.githubusercontent.com/SEU_REPO/resolver-conflito-containers.sh

# Dar permissão de execução
chmod +x resolver-conflito-containers.sh

# Executar o script
./resolver-conflito-containers.sh
```

### 3. Ou executar manualmente:

```bash
# Parar containers
docker stop traefik-app app-app

# Remover containers conflitantes
docker rm traefik-app app-app

# Limpar recursos órfãos
docker container prune -f
docker volume prune -f
docker network prune -f

# Verificar/criar rede
docker network create traefik-network 2>/dev/null || true

# Remover certificados antigos (forçar renovação)
docker volume rm traefik_letsencrypt 2>/dev/null || true

# Recriar containers
docker-compose down --remove-orphans
docker-compose up -d --force-recreate
```

## 🔍 Verificação e Monitoramento

### 1. Verificar status dos containers
```bash
docker ps
```

### 2. Monitorar logs do Traefik
```bash
docker logs traefik-app -f
```

### 3. Verificar certificados SSL
```bash
# Verificar se o arquivo de certificados existe
docker exec traefik-app ls -la /letsencrypt/acme.json

# Verificar conteúdo dos certificados
docker exec traefik-app cat /letsencrypt/acme.json | jq '.letsencrypt.Certificates[] | .domain'
```

### 4. Testar conectividade
```bash
# Teste HTTP
curl -I http://mdinheiro.com.br

# Teste HTTPS
curl -I https://mdinheiro.com.br

# Teste detalhado SSL
openssl s_client -connect mdinheiro.com.br:443 -servername mdinheiro.com.br
```

## ⏱️ Tempo de Resolução

- **Execução do script**: 2-3 minutos
- **Geração de certificados SSL**: 2-5 minutos adicionais
- **Total**: 5-8 minutos

## ✅ Resultado Esperado

Após a execução:

1. ✅ Containers `traefik-app` e `app-app` funcionando
2. ✅ Certificados SSL gerados automaticamente
3. ✅ Site acessível via HTTPS sem erro de "ligação não privada"
4. ✅ Redirecionamento HTTP → HTTPS funcionando

## 🧪 Teste no iPhone

1. Abrir Safari no iPhone
2. Acessar: `https://mdinheiro.com.br`
3. **Resultado esperado**: Site carrega sem aviso de segurança
4. **Se ainda houver erro**: Aguardar mais 2-3 minutos para propagação DNS

## 🚨 Troubleshooting

### Se o erro persistir:

```bash
# Verificar logs detalhados
docker logs traefik-app --tail 50

# Verificar configuração do docker-compose
cat docker-compose.yml | grep -A 10 -B 5 "mdinheiro.com.br"

# Reiniciar apenas o Traefik
docker restart traefik-app

# Verificar portas
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

### Logs importantes para monitorar:

```bash
# Sucesso na geração de certificados
docker logs traefik-app | grep "certificate obtained"

# Erros de SSL
docker logs traefik-app | grep -i "error\|failed\|ssl"
```

## 📞 Suporte

Se o problema persistir após seguir todos os passos:

1. Copiar logs completos: `docker logs traefik-app > traefik-logs.txt`
2. Verificar configuração DNS do domínio
3. Confirmar que as portas 80 e 443 estão abertas no firewall

---

**Nota**: Este script resolve conflitos de containers e força a renovação de certificados SSL, garantindo que o site funcione corretamente com HTTPS.