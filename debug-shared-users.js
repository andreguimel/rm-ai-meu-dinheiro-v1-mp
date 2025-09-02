import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ponxumxwjodpgwhepwxc.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugSharedUsers() {
  try {
    console.log("=== DEBUG SHARED USERS ===");

    // Buscar todos os shared users
    const { data: sharedUsers, error } = await supabase
      .from("shared_users")
      .select("*")
      .limit(10);

    if (error) {
      console.error("Erro ao buscar shared users:", error);
      return;
    }

    console.log(
      `Total de shared users encontrados: ${sharedUsers?.length || 0}`
    );

    if (sharedUsers && sharedUsers.length > 0) {
      console.log("\n=== SHARED USERS ===");
      sharedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Nome: ${user.nome || user.name || "N/A"}`);
        console.log(`   Apelido: ${user.apelido || "N/A"}`);
        console.log(`   Owner User ID: ${user.owner_user_id}`);
        console.log(`   Active: ${user.active}`);
        console.log(`   Created at: ${user.created_at}`);
        console.log("   ---");
      });

      console.log("\n=== ESTRUTURA DA TABELA (primeiro registro) ===");
      console.log("Campos disponíveis:", Object.keys(sharedUsers[0]));
    }

    // Verificar se há registros com created_by_shared_user_id
    const { data: receitasComSharedUser, error: receitasError } = await supabase
      .from("receitas")
      .select("id, descricao, valor, created_by_shared_user_id")
      .not("created_by_shared_user_id", "is", null)
      .limit(5);

    if (
      !receitasError &&
      receitasComSharedUser &&
      receitasComSharedUser.length > 0
    ) {
      console.log("\n=== RECEITAS COM SHARED USER ===");
      receitasComSharedUser.forEach((receita, index) => {
        console.log(`${index + 1}. ${receita.descricao} - R$ ${receita.valor}`);
        console.log(
          `   Created by shared user ID: ${receita.created_by_shared_user_id}`
        );
      });
    } else {
      console.log("\n=== NENHUMA RECEITA COM SHARED USER ENCONTRADA ===");
    }

    // Verificar despesas também
    const { data: despesasComSharedUser, error: despesasError } = await supabase
      .from("despesas")
      .select("id, descricao, valor, created_by_shared_user_id")
      .not("created_by_shared_user_id", "is", null)
      .limit(5);

    if (
      !despesasError &&
      despesasComSharedUser &&
      despesasComSharedUser.length > 0
    ) {
      console.log("\n=== DESPESAS COM SHARED USER ===");
      despesasComSharedUser.forEach((despesa, index) => {
        console.log(`${index + 1}. ${despesa.descricao} - R$ ${despesa.valor}`);
        console.log(
          `   Created by shared user ID: ${despesa.created_by_shared_user_id}`
        );
      });
    } else {
      console.log("\n=== NENHUMA DESPESA COM SHARED USER ENCONTRADA ===");
    }
  } catch (error) {
    console.error("Erro geral:", error);
  }
}

debugSharedUsers();
