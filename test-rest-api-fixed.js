// Teste direto na REST API do Supabase com token atualizado
const testData = {
  user_id: "2aeaae18-8c12-4b01-aa5c-3ff4f426b638",
  descricao: "Teste REST API R$ 135 - Atualizado",
  valor: 135,
  data: "2024-09-01",
  created_by_shared_user_id: "3bd8b47e-6338-40dd-9724-3d6c381c714f", // ID do André como shared user
};

console.log("Testando REST API direta com token atualizado:", testData);

fetch("https://ponxumxwjodpgwhepwxc.supabase.co/rest/v1/despesas", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE",
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE",
  },
  body: JSON.stringify(testData),
})
  .then((response) => {
    console.log("Status:", response.status);
    return response.json();
  })
  .then((data) => {
    console.log("Resposta da REST API:", data);
  })
  .catch((error) => {
    console.error("Erro:", error);
  });
