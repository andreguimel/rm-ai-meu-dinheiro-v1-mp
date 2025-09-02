// Teste para a Edge Function external-transaction
const testData = {
  tipo: "despesa",
  descricao: "Teste Edge Function R$ 135",
  valor: 135,
  data: "2024-09-01",
  categoria_nome: "Alimentação",
  shared_user_name: "André",
  account_owner_id: "2aeaae18-8c12-4b01-aa5c-3ff4f426b638",
};

console.log("Testando Edge Function com dados:", testData);

fetch(
  "https://ponxumxwjodpgwhepwxc.supabase.co/functions/v1/external-transaction",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "rm-ai-meu-dinheiro-api-key-2024",
    },
    body: JSON.stringify(testData),
  }
)
  .then((response) => response.json())
  .then((data) => {
    console.log("Resposta da Edge Function:", data);
  })
  .catch((error) => {
    console.error("Erro:", error);
  });
