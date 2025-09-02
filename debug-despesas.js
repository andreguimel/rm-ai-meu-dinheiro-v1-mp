import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ponxumxwjodpgwhepwxc.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQ0OTQ5NCwiZXhwIjoyMDQ3MDI1NDk0fQ.VUFJfJ4K2ghtZYQrJJN1i6mKJNjwdKzVW0EZlc6QX8s";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDespesas() {
  try {
    console.log("=== DEBUG DESPESAS NO BANCO ===");

    // Buscar todas as despesas
    const { data: despesas, error: despesasError } = await supabase
      .from("despesas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (despesasError) {
      console.error("Erro ao buscar despesas:", despesasError);
      return;
    }

    console.log(`\nTotal de despesas encontradas: ${despesas?.length || 0}`);

    if (despesas && despesas.length > 0) {
      console.log("\n=== ÚLTIMAS 20 DESPESAS ===");
      despesas.forEach((despesa, index) => {
        console.log(`${index + 1}. ID: ${despesa.id}`);
        console.log(`   Descrição: ${despesa.descricao}`);
        console.log(`   Valor: R$ ${despesa.valor}`);
        console.log(`   User ID: ${despesa.user_id}`);
        console.log(
          `   Created by shared user: ${
            despesa.created_by_shared_user_id || "N/A"
          }`
        );
        console.log(`   Data: ${despesa.data}`);
        console.log(`   Created at: ${despesa.created_at}`);
        console.log("   ---");
      });
    }

    // Buscar despesas via WhatsApp especificamente
    const { data: whatsappDespesas, error: whatsappError } = await supabase
      .from("despesas")
      .select("*")
      .ilike("descricao", "%whatsapp%")
      .order("created_at", { ascending: false });

    if (whatsappError) {
      console.error("Erro ao buscar despesas via WhatsApp:", whatsappError);
    } else {
      console.log(`\n=== DESPESAS VIA WHATSAPP ===`);
      console.log(`Total: ${whatsappDespesas?.length || 0}`);

      if (whatsappDespesas && whatsappDespesas.length > 0) {
        whatsappDespesas.forEach((despesa, index) => {
          console.log(`${index + 1}. ID: ${despesa.id}`);
          console.log(`   Descrição: ${despesa.descricao}`);
          console.log(`   Valor: R$ ${despesa.valor}`);
          console.log(`   User ID: ${despesa.user_id}`);
          console.log(`   Data: ${despesa.data}`);
          console.log("   ---");
        });
      }
    }

    // Verificar quantos user_ids diferentes existem
    const { data: userIds, error: userIdsError } = await supabase
      .from("despesas")
      .select("user_id")
      .neq("user_id", null);

    if (!userIdsError && userIds) {
      const uniqueUserIds = [...new Set(userIds.map((d) => d.user_id))];
      console.log(`\n=== USER IDS ÚNICOS ===`);
      console.log(`Total de user_ids diferentes: ${uniqueUserIds.length}`);
      uniqueUserIds.forEach((userId, index) => {
        console.log(`${index + 1}. ${userId}`);
      });
    }
  } catch (error) {
    console.error("Erro geral:", error);
  }
}

debugDespesas();
