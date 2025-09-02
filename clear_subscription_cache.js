// Script para limpar cache e testar nova lógica de assinatura
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ponxumxwjodpgwhepwxc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserSubscription() {
  try {
    console.log("🔍 Testando nova lógica de assinatura...");

    // Fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "andreguimel@icloud.com", // Substitua pelo email do usuário
      password: "123456789", // Substitua pela senha
    });

    if (error) {
      console.error("❌ Erro no login:", error.message);
      return;
    }

    console.log("✅ Login realizado com sucesso!");
    console.log(
      "🔑 Token:",
      data.session.access_token.substring(0, 20) + "..."
    );

    // Chamar a Edge Function para verificar assinatura
    const { data: subscriptionData, error: subscriptionError } =
      await supabase.functions.invoke("check-mercadopago-subscription", {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });

    console.log("\n📊 Resultado da verificação:");
    console.log("Data:", JSON.stringify(subscriptionData, null, 2));

    if (subscriptionError) {
      console.log("Error:", subscriptionError);
    }

    // Fazer logout
    await supabase.auth.signOut();
    console.log("\n✅ Teste concluído e logout realizado.");
  } catch (error) {
    console.error("❌ Erro no teste:", error.message);
  }
}

testUserSubscription();
