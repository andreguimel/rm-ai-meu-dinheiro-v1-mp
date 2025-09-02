// Teste simples para verificar se as Edge Functions estão funcionando
// Execute este script no console do navegador após fazer login

async function testEdgeFunctions() {
  console.log("🧪 Testando Edge Functions...");

  const supabaseUrl = "https://ponxumxwjodpgwhepwxc.supabase.co";
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE";

  // Teste direto com fetch para verificar se a função existe
  try {
    console.log("🔍 Testando se create-mercadopago-subscription existe...");

    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-mercadopago-subscription`,
      {
        method: "OPTIONS", // OPTIONS para testar se a função existe
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📊 Status da resposta:", response.status);
    console.log("📊 Headers da resposta:", [...response.headers.entries()]);

    if (response.status === 200) {
      console.log("✅ Função create-mercadopago-subscription está disponível!");
    } else if (response.status === 404) {
      console.error(
        "❌ Função create-mercadopago-subscription NÃO ENCONTRADA!"
      );
      console.log("💡 A função precisa ser implantada no Supabase");
    } else {
      console.log("⚠️ Status inesperado:", response.status);
    }
  } catch (error) {
    console.error("❌ Erro ao testar função:", error);
  }

  // Teste similar para check-mercadopago-subscription
  try {
    console.log("🔍 Testando se check-mercadopago-subscription existe...");

    const response = await fetch(
      `${supabaseUrl}/functions/v1/check-mercadopago-subscription`,
      {
        method: "OPTIONS",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📊 Status da resposta check:", response.status);

    if (response.status === 200) {
      console.log("✅ Função check-mercadopago-subscription está disponível!");
    } else if (response.status === 404) {
      console.error("❌ Função check-mercadopago-subscription NÃO ENCONTRADA!");
    }
  } catch (error) {
    console.error("❌ Erro ao testar função check:", error);
  }
}

// Executar teste
testEdgeFunctions();
