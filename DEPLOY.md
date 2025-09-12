# 🚀 Scripts de Deploy - Meu Dinheiro

Este documento explica como usar os scripts de deploy para atualizar a aplicação na VPS sem reinstalar toda a infraestrutura.

## 📋 Scripts Disponíveis

### 1. `update-deploy.sh` - Atualização Completa
**Uso recomendado:** Atualizações importantes, mudanças na infraestrutura

```bash
# Dar permissão de execução
chmod +x update-deploy.sh

# Executar
./update-deploy.sh
```

**O que faz:**
- ✅ Para o nginx temporariamente
- ✅ Faz backup do .env e arquivos atuais
- ✅ Atualiza código do repositório
- ✅ Reinstala dependências
- ✅ Faz build da aplicação
- ✅ Copia arquivos para /var/www/html
- ✅ Reinicia nginx
- ✅ Verifica se tudo está funcionando

### 2. `quick-update.sh` - Atualização Rápida
**Uso recomendado:** Pequenas correções, atualizações de conteúdo

```bash
# Dar permissão de execução
chmod +x quick-update.sh

# Executar
./quick-update.sh
```

**O que faz:**
- ⚡ Não para o nginx (zero downtime)
- ✅ Atualiza código do repositório
- ✅ Instala dependências apenas se necessário
- ✅ Faz build da aplicação
- ✅ Atualiza arquivos
- ✅ Recarrega nginx

## 🔄 Fluxo de Trabalho Recomendado

### Para Desenvolvimento Local → Produção

1. **Faça suas alterações localmente**
2. **Commit e push para o repositório**
   ```bash
   git add .
   git commit -m "Sua mensagem de commit"
   git push origin main
   ```

3. **Na VPS, execute o script apropriado:**
   ```bash
   # Para atualizações pequenas/rápidas
   ./quick-update.sh
   
   # Para atualizações importantes
   ./update-deploy.sh
   ```

## 🛠️ Comandos Úteis na VPS

### Verificar Status
```bash
# Status do nginx
sudo systemctl status nginx

# Logs do nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Verificar se o site está respondendo
curl -I http://localhost
```

### Troubleshooting
```bash
# Se o nginx não iniciar
sudo nginx -t  # Testar configuração
sudo systemctl restart nginx

# Se houver problemas de permissão
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Verificar espaço em disco
df -h

# Limpar builds antigos
npm cache clean --force
rm -rf node_modules dist
npm install
npm run build
```

## 🔐 Configuração Inicial (Uma vez só)

### 1. Clonar o repositório na VPS
```bash
cd /home/ubuntu  # ou seu diretório preferido
git clone https://github.com/andreguimel/rm-ai-meu-dinheiro-v1-mp.git
cd rm-ai-meu-dinheiro-v1-mp
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
nano .env  # Editar com suas configurações
```

### 3. Dar permissões aos scripts
```bash
chmod +x update-deploy.sh
chmod +x quick-update.sh
```

## 📊 Comparação dos Scripts

| Característica | update-deploy.sh | quick-update.sh |
|----------------|------------------|------------------|
| **Downtime** | ~30-60 segundos | Zero |
| **Backup** | Sim | Não |
| **Dependências** | Sempre reinstala | Só se necessário |
| **Verificações** | Completas | Básicas |
| **Uso** | Atualizações importantes | Correções rápidas |

## 🚨 Dicas Importantes

1. **Sempre teste localmente** antes de fazer deploy
2. **Use `quick-update.sh`** para a maioria das atualizações
3. **Use `update-deploy.sh`** quando:
   - Adicionar novas dependências
   - Mudar configurações do servidor
   - Após longos períodos sem atualização
4. **Monitore os logs** após cada deploy
5. **Mantenha backups** dos arquivos importantes

## 🆘 Em Caso de Problemas

### Site fora do ar?
```bash
# Verificar nginx
sudo systemctl status nginx
sudo systemctl restart nginx

# Restaurar backup (se disponível)
sudo cp -r /var/backups/nginx/html.backup.YYYYMMDD_HHMMSS/* /var/www/html/
```

### Build falhou?
```bash
# Limpar e tentar novamente
rm -rf node_modules dist
npm install
npm run build
```

### Erro de permissões?
```bash
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

---

**💡 Lembre-se:** Estes scripts substituem a necessidade de reinstalar toda a infraestrutura. Use-os para manter sua aplicação sempre atualizada de forma eficiente!