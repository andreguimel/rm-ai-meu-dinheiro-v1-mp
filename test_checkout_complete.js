// Teste completo do checkout - execute no console após fazer login
async function testCheckoutComplete() {
  console.log("🛒 Testando checkout completo...");

  try {
    // Verificar se o usuário está logado
    const { supabase } = window;
    if (!supabase) {
      console.error("❌ Supabase não está disponível no window");
      return;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ Erro ao obter sessão:", sessionError);
      return;
    }

    if (!session) {
      console.error("❌ Usuário não está logado");
      return;
    }

    console.log("✅ Usuário logado:", session.user.email);
    console.log("🔑 Token válido:", !!session.access_token);

    // Testar a função create-mercadopago-subscription
    console.log("🚀 Chamando create-mercadopago-subscription...");

    const { data, error } = await supabase.functions.invoke(
      "create-mercadopago-subscription",
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: { planId: "monthly" },
      }
    );

    console.log("📊 Resposta completa:", { data, error });

    if (error) {
      console.error("❌ Erro na função:", error);
      console.error("❌ Detalhes do erro:", JSON.stringify(error, null, 2));
      return;
    }

    if (!data) {
      console.error("❌ Dados vazios retornados");
      return;
    }

    console.log("✅ Dados recebidos:", data);

    if (data.url) {
      console.log("✅ URL de checkout encontrada:", data.url);
      console.log("🌐 Tentando abrir checkout...");

      // Tentar abrir o checkout
      const newWindow = window.open(data.url, "_blank", "noopener,noreferrer");

      if (!newWindow) {
        console.error("❌ Popup bloqueado pelo navegador");
        console.log("💡 Permita popups para este site");
      } else {
        console.log("✅ Checkout aberto com sucesso!");
      }
    } else {
      console.error("❌ URL de checkout não encontrada nos dados:", data);
    }
  } catch (error) {
    console.error("❌ Erro geral no teste:", error);
    console.error("❌ Stack trace:", error.stack);
  }
}

// Função para testar apenas se a função existe (mais rápido)
async function quickTest() {
  console.log("⚡ Teste rápido...");

  try {
    const response = await fetch(
      "https://ponxumxwjodpgwhepwxc.supabase.co/functions/v1/create-mercadopago-subscription",
      {
        method: "OPTIONS",
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📊 Status:", response.status);
    console.log("📊 OK:", response.ok);

    if (response.status === 200) {
      console.log("✅ Função está disponível!");
    } else {
      console.log("❌ Função não disponível ou erro:", response.status);
    }
  } catch (error) {
    console.error("❌ Erro no teste rápido:", error);
  }
}

console.log("🎯 Execute: testCheckoutComplete() - para teste completo");
console.log("🎯 Execute: quickTest() - para teste rápido");

// Executar teste rápido automaticamente
quickTest();
