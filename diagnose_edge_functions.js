// Script para testar as Edge Functions e diagnosticar problemas
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ponxumxwjodpgwhepwxc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdgeFunctions() {
  try {
    console.log("🔍 Testando Edge Functions...");

    // Criar um usuário de teste ou usar existente
    const testUser = {
      email: "teste@exemplo.com",
      password: "123456789",
    };

    console.log("📝 Fazendo signup de usuário de teste...");

    // Tentar fazer signup (pode falhar se já existir)
    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      testUser
    );

    if (signupError && !signupError.message.includes("already")) {
      console.error("❌ Erro no signup:", signupError.message);
    } else {
      console.log("✅ Signup OK ou usuário já existe");
    }

    // Fazer login
    console.log("🔑 Fazendo login...");
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword(testUser);

    if (loginError) {
      console.error("❌ Erro no login:", loginError.message);
      return;
    }

    console.log("✅ Login realizado com sucesso!");
    console.log(
      "🔑 Token:",
      loginData.session.access_token.substring(0, 20) + "..."
    );

    // Testar Edge Function de checkout
    console.log("\n🛒 Testando create-mercadopago-subscription...");
    const { data: checkoutData, error: checkoutError } =
      await supabase.functions.invoke("create-mercadopago-subscription", {
        headers: {
          Authorization: `Bearer ${loginData.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: { planId: "monthly" },
      });

    if (checkoutError) {
      console.error("❌ Erro na Edge Function checkout:", checkoutError);
      console.error("Detalhes:", JSON.stringify(checkoutError, null, 2));
    } else {
      console.log("✅ Edge Function checkout OK!");
      console.log("Data:", JSON.stringify(checkoutData, null, 2));
    }

    // Testar Edge Function de verificação
    console.log("\n🔍 Testando check-mercadopago-subscription...");
    const { data: subscriptionData, error: subscriptionError } =
      await supabase.functions.invoke("check-mercadopago-subscription", {
        headers: {
          Authorization: `Bearer ${loginData.session.access_token}`,
        },
      });

    if (subscriptionError) {
      console.error("❌ Erro na Edge Function verificação:", subscriptionError);
    } else {
      console.log("✅ Edge Function verificação OK!");
      console.log("Data:", JSON.stringify(subscriptionData, null, 2));
    }

    // Logout
    await supabase.auth.signOut();
    console.log("\n✅ Teste concluído e logout realizado.");
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testEdgeFunctions();
