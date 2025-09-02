// Script para testar a Edge Function diretamente
// Cole este código no console do navegador na página do app

async function testSubscriptionFunction() {
  console.log("🧪 TESTANDO EDGE FUNCTION DIRETAMENTE");

  try {
    // Obter token de autenticação
    const {
      data: { session },
    } = await window.supabase.auth.getSession();
    if (!session) {
      console.error("❌ Usuário não logado");
      return;
    }

    console.log(
      "✅ Token obtido:",
      session.access_token.substring(0, 20) + "..."
    );

    // Fazer chamada direta para a função
    const response = await fetch(
      "https://ponxumxwjodpgwhepwxc.supabase.co/functions/v1/check-mercadopago-subscription",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        body: JSON.stringify({ timestamp: Date.now() }),
      }
    );

    console.log("📡 Response Status:", response.status);
    console.log(
      "📡 Response Headers:",
      Object.fromEntries(response.headers.entries())
    );

    const data = await response.json();
    console.log("📡 Response Data:", JSON.stringify(data, null, 2));

    // Análise dos dados
    console.log("\n🔍 ANÁLISE:");
    console.log("subscribed:", data.subscribed);
    console.log("subscription_tier:", data.subscription_tier);
    console.log("trial_end:", data.trial_end);
    console.log("status:", data.status);

    if (data.subscribed === true) {
      console.log("🚨 PROBLEMA: Edge Function retorna subscribed=true");
      if (data.subscription_tier === "Trial") {
        console.log("🚨 PROBLEMA: Ainda está criando Trial");
      }
    } else {
      console.log("✅ OK: Edge Function retorna subscribed=false");
    }
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

// Executar teste
testSubscriptionFunction();
