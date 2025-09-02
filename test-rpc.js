// Teste para RPC create_external_transaction
const testData = {
  p_tipo: "despesa",
  p_descricao: "Teste RPC R$ 135",
  p_valor: 135,
  p_data: "2024-09-01",
  p_categoria_nome: "Alimentação",
  p_shared_user_name: "André",
  p_account_owner_id: "2aeaae18-8c12-4b01-aa5c-3ff4f426b638",
};

console.log("Testando RPC com dados:", testData);

fetch(
  "https://ponxumxwjodpgwhepwxc.supabase.co/rest/v1/rpc/create_external_transaction",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnhVbXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ4NjA1NzcsImV4cCI6MjA0MDQzNjU3N30.HrQY4gj21b1s0cXcJ-HKGDQe_-_DwsOXNHGw_35k3xA",
    },
    body: JSON.stringify(testData),
  }
)
  .then((response) => response.json())
  .then((data) => {
    console.log("Resposta do RPC:", data);
  })
  .catch((error) => {
    console.error("Erro:", error);
  });
