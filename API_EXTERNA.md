# API Externa para Integração com n8n/WhatsApp

Esta documentação explica como usar a Edge Function `external-transaction` para criar receitas e despesas via API externa, ideal para integração com n8n, webhooks do WhatsApp ou outras automações.

## Endpoint

```
POST https://seu-projeto-supabase.functions.supabase.co/external-transaction
```

## Autenticação

Inclua um dos seguintes headers:
- `Authorization: Bearer <jwt-token>` (usuário autenticado)
- `x-api-key: <sua-api-key>` (para integrações externas)

## Body da Requisição

```json
{
  "tipo": "receita", // ou "despesa"
  "descricao": "Venda de produto",
  "valor": 150.50,
  "data": "2025-08-29", // formato YYYY-MM-DD
  "categoria_nome": "Vendas", // opcional
  "shared_user_whatsapp": "+5511999999999", // opcional
  "account_owner_id": "uuid-da-conta-principal"
}
```

## Campos

### Obrigatórios
- `tipo`: "receita" ou "despesa"
- `descricao`: Descrição da transação
- `valor`: Valor numérico (pode ser string ou number)
- `data`: Data no formato YYYY-MM-DD
- `account_owner_id`: UUID da conta principal (dono da conta)

### Opcionais
- `categoria_nome`: Nome da categoria existente
- `shared_user_whatsapp`: WhatsApp do usuário compartilhado que criou a transação

## Comportamento

### Categoria
- Se `categoria_nome` for fornecida, a API busca uma categoria existente com esse nome
- Se não encontrar, o campo `categoria_id` fica null
- A categoria deve pertencer ao `account_owner_id` e ter o mesmo `tipo`

### Usuário Compartilhado
- Se `shared_user_whatsapp` for fornecido, a API busca um shared_user ativo com esse WhatsApp
- Se encontrar, preenche o campo `created_by_shared_user_id`
- Isso permite identificar qual usuário compartilhado criou a transação
- O shared_user deve pertencer ao `account_owner_id`

## Exemplo de Uso com n8n

### 1. Webhook do WhatsApp
```javascript
// No n8n, após receber mensagem do WhatsApp
const mensagem = $input.first().json.message;
const whatsapp = $input.first().json.from; // +5511999999999
const accountOwner = "uuid-da-conta-principal";

// Parse da mensagem: "receita venda produto 150.50"
const partes = mensagem.split(' ');
const tipo = partes[0]; // receita
const descricao = partes.slice(1, -1).join(' '); // venda produto
const valor = parseFloat(partes[partes.length - 1]); // 150.50

return {
  tipo,
  descricao,
  valor,
  data: new Date().toISOString().split('T')[0],
  shared_user_whatsapp: whatsapp,
  account_owner_id: accountOwner
};
```

### 2. Requisição HTTP no n8n
```json
{
  "method": "POST",
  "url": "https://seu-projeto.functions.supabase.co/external-transaction",
  "headers": {
    "Content-Type": "application/json",
    "x-api-key": "sua-api-key"
  },
  "body": "{{ $json }}"
}
```

## Respostas

### Sucesso (200)
```json
{
  "success": true,
  "data": {
    "id": "uuid-gerado",
    "user_id": "uuid-da-conta-principal",
    "created_by_shared_user_id": "uuid-do-shared-user",
    "descricao": "Venda de produto",
    "valor": 150.50,
    "data": "2025-08-29",
    "categoria_id": "uuid-da-categoria",
    "categorias": {
      "nome": "Vendas",
      "cor": "#4ade80",
      "icone": "DollarSign"
    },
    "created_at": "2025-08-29T10:30:00.000Z",
    "updated_at": "2025-08-29T10:30:00.000Z"
  },
  "message": "receita criada com sucesso"
}
```

### Erro de Validação (400)
```json
{
  "error": "Campos obrigatórios: tipo, descricao, valor, data, account_owner_id"
}
```

### Erro de Autenticação (401)
```json
{
  "error": "Authorization required"
}
```

### Erro Interno (500)
```json
{
  "error": "Erro interno do servidor",
  "details": "Detalhes do erro"
}
```

## Segurança

- A API valida se o shared_user pertence ao account_owner_id
- Todas as operações respeitam as políticas RLS do Supabase
- Use sempre HTTPS para as requisições
- Mantenha a API key segura

## Filtros e Visualização

Após a criação via API:
- O badge mostrará o nome do usuário compartilhado (se `created_by_shared_user_id` estiver preenchido)
- Os filtros por usuário funcionarão corretamente
- A transação aparecerá no dashboard com a identificação correta

## Exemplo Completo - WhatsApp Bot

```javascript
// Exemplo de integração completa no n8n
const webhook = $input.first().json;

// Mapear mensagem do WhatsApp
const mapping = {
  whatsapp: webhook.from,
  message: webhook.message,
  accountOwner: "f47ac10b-58cc-4372-a567-0e02b2c3d479" // seu UUID
};

// Parse comando: "+receita almoço 35.90" ou "+despesa combustível 120.00"
const regex = /^\+(receita|despesa)\s+(.+)\s+(\d+\.?\d*)$/;
const match = mapping.message.match(regex);

if (!match) {
  throw new Error("Formato inválido. Use: +receita descrição valor ou +despesa descrição valor");
}

const [, tipo, descricao, valor] = match;

return {
  tipo,
  descricao: descricao.trim(),
  valor: parseFloat(valor),
  data: new Date().toISOString().split('T')[0],
  shared_user_whatsapp: mapping.whatsapp,
  account_owner_id: mapping.accountOwner
};
```

Este exemplo permite que usuários enviem mensagens como:
- "+receita venda produto 150.50"
- "+despesa almoço 35.90"

E automaticamente cria as transações no sistema com a identificação correta do usuário.
