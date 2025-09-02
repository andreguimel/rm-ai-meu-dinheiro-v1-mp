// Teste Edge Function com API key correta
const testData = {
  tipo: "despesa",
  descricao: "Teste Edge Function com user válido - R$ 135",
  valor: 135,
  data: "2024-09-01",
  categoria_nome: "Alimentação",
  shared_user_name: "André",
  account_owner_id: "3e8c5b20-abf7-4bfc-a1a1-c63b7f8c8f54", // Usando um ID diferente que pode ser válido
};

console.log("Testando Edge Function com API key:", testData);

fetch(
  "https://ponxumxwjodpgwhepwxc.supabase.co/functions/v1/external-transaction",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "rm-ai-meu-dinheiro-api-key-2024",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE",
    },
    body: JSON.stringify(testData),
  }
)
  .then((response) => {
    console.log("Status:", response.status);
    return response.json();
  })
  .then((data) => {
    console.log("Resposta da Edge Function:", data);
  })
  .catch((error) => {
    console.error("Erro:", error);
  });
