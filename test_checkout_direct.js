// Script para testar diretamente a criação de checkout
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ponxumxwjodpgwhepwxc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCheckout() {
  try {
    console.log("🛒 Testando criação de checkout...");

    // Fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "andreguimel@icloud.com",
      password: "123456789",
    });

    if (error) {
      console.error("❌ Erro no login:", error.message);
      return;
    }

    console.log("✅ Login realizado com sucesso!");

    // Testar função de checkout
    console.log("🚀 Chamando create-mercadopago-subscription...");

    const { data: checkoutData, error: checkoutError } =
      await supabase.functions.invoke("create-mercadopago-subscription", {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: { planId: "monthly" },
      });

    console.log("\n📊 Resultado do checkout:");
    console.log("Data:", JSON.stringify(checkoutData, null, 2));

    if (checkoutError) {
      console.log("❌ Error:", checkoutError);
    }

    // Fazer logout
    await supabase.auth.signOut();
    console.log("\n✅ Teste concluído.");
  } catch (error) {
    console.error("❌ Erro no teste:", error.message);
  }
}

testCheckout();
