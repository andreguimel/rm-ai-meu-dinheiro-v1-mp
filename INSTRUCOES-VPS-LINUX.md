# Instruções para VPS Linux

## Problema Identificado
Você está tentando executar um script PowerShell (`build-and-serve.ps1`) em um ambiente Linux, mas o PowerShell não está disponível no seu VPS.

## Solução
Criei um script bash equivalente (`build-and-serve.sh`) que funciona no ambiente Linux.

## Como usar no VPS Linux

### 1. Fazer upload dos arquivos para o VPS
Transfira os seguintes arquivos para o seu VPS:
- `build-and-serve.sh`
- `Dockerfile`
- `docker-compose.yml`
- `nginx.conf`
- Todo o código fonte da aplicação

### 2. Dar permissão de execução ao script
```bash
chmod +x build-and-serve.sh
```

### 3. Executar o script
```bash
./build-and-serve.sh
```

## O que o script faz

1. **Verifica dependências** (Node.js, npm)
2. **Limpa builds anteriores** (remove pasta dist)
3. **Instala dependências** (npm install)
4. **Faz o build** (npm run build)
5. **Verifica assets gerados**
6. **Verifica meta viewport** para iPhone
7. **Para containers Docker** existentes (se disponível)
8. **Inicia servidor de preview** na porta 4173

## Para deploy com Docker

Se você quiser usar Docker (recomendado para produção):

```bash
# Dar permissão ao script de deploy
chmod +x build-and-deploy.sh

# Executar deploy completo
./build-and-deploy.sh
```

## Verificar se funcionou

1. Acesse: `http://SEU_IP_VPS:4173/`
2. Teste no iPhone Safari
3. Verifique se a tela branca foi resolvida

## Comandos úteis para debug

```bash
# Verificar se o servidor está rodando
ps aux | grep vite

# Verificar portas abertas
netstat -tlnp | grep 4173

# Ver logs do Docker (se usando)
docker-compose logs -f

# Parar servidor de preview
pkill -f "vite preview"
```

## Notas importantes

- O script bash (`build-and-serve.sh`) é equivalente ao PowerShell (`build-and-serve.ps1`)
- Use `./build-and-serve.sh` para desenvolvimento/teste
- Use `./build-and-deploy.sh` para deploy com Docker em produção
- Certifique-se de que as portas 4173 e 80 estão abertas no firewall do VPS