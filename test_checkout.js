// Script para testar a função de checkout do Mercado Pago
// Execute este script no console do navegador após fazer login

async function testCheckout() {
  console.log("🧪 Testando função de checkout...");

  try {
    // Importar Supabase client
    const { createClient } = window.supabase || {};

    if (!createClient) {
      console.error("❌ Supabase não está disponível no window");
      return;
    }

    const supabase = createClient(
      "YOUR_SUPABASE_URL", // Substitua pela URL real
      "YOUR_SUPABASE_ANON_KEY" // Substitua pela chave real
    );

    // Verificar se o usuário está logado
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("❌ Usuário não está logado");
      return;
    }

    console.log("✅ Usuário logado:", session.user.email);

    // Testar chamada para a Edge Function
    console.log("🔄 Chamando create-mercadopago-subscription...");

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

    console.log("📊 Resposta da função:", { data, error });

    if (error) {
      console.error("❌ Erro na função:", error);
      return;
    }

    if (data?.url) {
      console.log("✅ URL de checkout gerada:", data.url);
      console.log("🌐 Abrindo checkout...");

      // Tentar abrir o checkout
      const newWindow = window.open(data.url, "_blank", "noopener,noreferrer");

      if (!newWindow) {
        console.error("❌ Popup bloqueado pelo navegador");
      } else {
        console.log("✅ Checkout aberto com sucesso!");
      }
    } else {
      console.error("❌ URL de checkout não retornada:", data);
    }
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

// Executar o teste
testCheckout();
