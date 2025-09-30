# 🔍 Como Diagnosticar a Stack da VPS

Este guia fornece métodos para identificar completamente a stack tecnológica da sua VPS, incluindo aplicações rodando em Docker.

## 🚀 Métodos Rápidos

### 1. Para Aplicações em Docker (Recomendado se usar Docker)

```bash
# Diagnóstico completo Docker
scp diagnostico-stack-docker.sh usuario@ip-da-vps:/tmp/
ssh usuario@ip-da-vps
chmod +x /tmp/diagnostico-stack-docker.sh
/tmp/diagnostico-stack-docker.sh

# Diagnóstico rápido Docker
scp diagnostico-docker-rapido.sh usuario@ip-da-vps:/tmp/
ssh usuario@ip-da-vps
chmod +x /tmp/diagnostico-docker-rapido.sh
/tmp/diagnostico-docker-rapido.sh
```

### 2. Script Automatizado Geral

```bash
# Fazer upload do script para a VPS
scp diagnostico-stack-vps.sh usuario@ip-da-vps:/tmp/

# Conectar na VPS e executar
ssh usuario@ip-da-vps
chmod +x /tmp/diagnostico-stack-vps.sh
/tmp/diagnostico-stack-vps.sh
```

### 3. Script Simplificado

```bash
# Para diagnóstico rápido
scp diagnostico-stack-vps-simples.sh usuario@ip-da-vps:/tmp/
ssh usuario@ip-da-vps
chmod +x /tmp/diagnostico-stack-vps-simples.sh
/tmp/diagnostico-stack-vps-simples.sh
```

## 🔧 Comandos Manuais

### Sistema Operacional
```bash
# Distribuição Linux
cat /etc/os-release
lsb_release -a

# Kernel e arquitetura
uname -a
arch
```

### Docker
```bash
# Verificar se Docker está instalado
docker --version
docker-compose --version

# Containers em execução
docker ps

# Imagens disponíveis
docker images

# Docker Compose services
docker-compose ps
```

### Servidor Web
```bash
# Nginx
nginx -v
systemctl status nginx
nginx -T  # Mostra configuração completa

# Apache (se aplicável)
apache2 -v
systemctl status apache2
```

### Node.js e Gerenciadores de Processo
```bash
# Node.js
node --version
npm --version

# PM2
pm2 --version
pm2 list
pm2 show all

# Forever (alternativa ao PM2)
forever list
```

### Banco de Dados
```bash
# PostgreSQL
psql --version
systemctl status postgresql

# MySQL
mysql --version
systemctl status mysql

# Redis
redis-cli --version
systemctl status redis
```

### Portas e Serviços
```bash
# Portas em uso
netstat -tlnp
ss -tlnp

# Serviços ativos
systemctl list-units --type=service --state=active
```

### SSL/TLS
```bash
# Certbot (Let's Encrypt)
certbot --version
certbot certificates

# Verificar certificado de um domínio
openssl s_client -connect seudominio.com:443 -servername seudominio.com
```

## 📊 Análise de Recursos

### Memória e CPU
```bash
# Uso de memória
free -h
cat /proc/meminfo

# Informações da CPU
lscpu
cat /proc/cpuinfo

# Processos que mais consomem recursos
top
htop
```

### Armazenamento
```bash
# Espaço em disco
df -h
du -sh /var/log /tmp /home

# Inodes
df -i
```

### Rede
```bash
# Interfaces de rede
ip addr show
ifconfig

# Conectividade
ping google.com
curl -I http://localhost
```

## 🐳 Diagnóstico Específico do Docker

### Comandos Essenciais Docker
```bash
# Verificar se Docker está rodando
docker --version
docker info

# Listar containers ativos
docker ps

# Listar todos os containers (incluindo parados)
docker ps -a

# Verificar imagens
docker images

# Verificar volumes
docker volume ls

# Verificar redes
docker network ls
```

### Analisar Containers Específicos
```bash
# Logs de um container
docker logs nome-do-container
docker logs -f nome-do-container  # Em tempo real

# Entrar em um container
docker exec -it nome-do-container /bin/bash
docker exec -it nome-do-container /bin/sh

# Verificar processos dentro do container
docker exec nome-do-container ps aux

# Verificar recursos do container
docker stats nome-do-container

# Inspecionar configuração do container
docker inspect nome-do-container
```

### Docker Compose
```bash
# Se usar docker-compose
docker-compose ps
docker-compose logs
docker-compose config

# Versão mais nova (Docker Compose como plugin)
docker compose ps
docker compose logs
docker compose config
```

### Verificar Stack Docker Compose
```bash
# No diretório do projeto
docker-compose config
docker-compose ps
docker-compose logs

# Verificar recursos dos containers
docker stats
```

### Logs dos Containers
```bash
# Logs de um container específico
docker logs nome-do-container

# Logs em tempo real
docker logs -f nome-do-container

# Últimas 100 linhas
docker logs --tail 100 nome-do-container
```

## 🔍 Identificação de Tecnologias Web

### Headers HTTP
```bash
# Verificar headers do servidor
curl -I http://seudominio.com
curl -I https://seudominio.com

# Verificar com mais detalhes
curl -v http://seudominio.com
```

### Análise de Processos
```bash
# Processos relacionados ao Node.js
ps aux | grep node

# Processos do Nginx
ps aux | grep nginx

# Todos os processos de serviços web
ps aux | grep -E "(nginx|apache|node|pm2)"
```

## 📝 Logs Importantes

### Localizações Comuns de Logs
```bash
# Logs do sistema
tail -f /var/log/syslog
tail -f /var/log/messages

# Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs do Docker
journalctl -u docker.service -f

# Logs de aplicações Node.js (PM2)
pm2 logs
```

## 🛠️ Ferramentas Úteis

### Instalação de Ferramentas de Diagnóstico
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install htop iotop nethogs ncdu

# CentOS/RHEL
sudo yum install htop iotop nethogs ncdu
```

### Monitoramento em Tempo Real
```bash
# Uso de CPU e memória
htop

# Uso de rede por processo
nethogs

# Uso de disco por processo
iotop

# Análise de espaço em disco
ncdu /
```

## 🔐 Verificações de Segurança

### Firewall
```bash
# UFW (Ubuntu)
sudo ufw status

# iptables
sudo iptables -L

# firewalld (CentOS)
sudo firewall-cmd --list-all
```

### Usuários e Permissões
```bash
# Usuários logados
who
w

# Últimos logins
last

# Verificar sudo
sudo -l
```

## 📋 Checklist de Diagnóstico

- [ ] Sistema operacional identificado
- [ ] Versão do kernel verificada
- [ ] Docker instalado e funcionando
- [ ] Containers em execução listados
- [ ] Servidor web (Nginx/Apache) identificado
- [ ] Node.js e versão verificados
- [ ] Gerenciador de processos (PM2) verificado
- [ ] Banco de dados identificado
- [ ] Portas abertas mapeadas
- [ ] SSL/TLS configurado
- [ ] Logs acessíveis
- [ ] Recursos (CPU/RAM/Disco) verificados
- [ ] Firewall configurado

## 🚨 Troubleshooting

### Problemas Comuns

1. **Permissões negadas**: Use `sudo` quando necessário
2. **Comando não encontrado**: Instale as ferramentas necessárias
3. **Serviço não responde**: Verifique se está rodando com `systemctl status`
4. **Porta não acessível**: Verifique firewall e binding do serviço

### Comandos de Emergência
```bash
# Reiniciar serviços
sudo systemctl restart nginx
sudo systemctl restart docker

# Verificar espaço em disco crítico
df -h | grep -E "(9[0-9]%|100%)"

# Processos que mais consomem memória
ps aux --sort=-%mem | head -10
```

---

**💡 Dica**: Execute o script `diagnostico-stack-vps.sh` primeiro para ter uma visão geral completa, depois use comandos específicos para investigar pontos de interesse.