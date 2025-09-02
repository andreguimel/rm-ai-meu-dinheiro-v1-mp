// Teste para verificar despesas existentes e pegar user_id válido
console.log("Buscando despesas existentes...");

fetch(
  "https://ponxumxwjodpgwhepwxc.supabase.co/rest/v1/despesas?select=*&limit=5",
  {
    method: "GET",
    headers: {
      apikey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE",
    },
  }
)
  .then((response) => response.json())
  .then((data) => {
    console.log("Despesas encontradas:", data);
    if (data.length > 0) {
      console.log("User ID válido:", data[0].user_id);
    }
  })
  .catch((error) => {
    console.error("Erro:", error);
  });
