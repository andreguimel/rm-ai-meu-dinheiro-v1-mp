// Teste da Edge Function com shared user
const testData = {
  tipo: "receita",
  descricao: "Teste receita shared user",
  valor: 99.99,
  data: "2025-09-01",
  categoria_nome: "Alimentação",
  shared_user_name: "Nome do Usuário Compartilhado", // Substitua pelo nome real do usuário compartilhado
  account_owner_id: "39dccc29-1396-4899-a24a-c4b485c7659e", // Substitua pelo ID da conta principal
};

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
    console.log("=== RESULTADO DO TESTE ===");
    console.log("Success:", data.success);
    console.log("Data:", data.data);
    console.log("Message:", data.message);
    if (data.error) {
      console.log("Error:", data.error);
      console.log("Details:", data.details);
    }
  })
  .catch((error) => {
    console.error("Erro na requisição:", error);
  });
