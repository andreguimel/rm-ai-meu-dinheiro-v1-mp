import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { ids, tipo } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("Lista de IDs é obrigatória");
    }

    if (!tipo || !["despesa", "receita", "divida"].includes(tipo)) {
      throw new Error('Tipo deve ser "despesa", "receita" ou "divida"');
    }

    console.log(`=== Deletando múltiplos registros ===`);
    console.log(`Tipo: ${tipo}`);
    console.log(`IDs: ${ids.join(", ")}`);

    let deletedCount = 0;
    const errors: string[] = [];

    // Para dívidas, deletar apenas da tabela dividas
    if (tipo === "divida") {
      try {
        const { data: deletedFromDividas, error: dividasError } = await supabaseClient
          .from("dividas")
          .delete()
          .in("id", ids)
          .select("id");

        if (dividasError) {
          console.error("Erro ao deletar da tabela dividas:", dividasError);
          errors.push(`Erro na tabela dividas: ${dividasError.message}`);
        } else {
          const dividasDeleted = deletedFromDividas?.length || 0;
          deletedCount += dividasDeleted;
          console.log(`Deletados ${dividasDeleted} registros da tabela dividas`);
        }
      } catch (error) {
        console.error("Erro ao deletar da tabela dividas:", error);
        errors.push(`Erro na tabela dividas: ${error.message}`);
      }
    } else {
      // Para despesas e receitas, deletar das tabelas principais e transacoes
      const tableName = tipo === "despesa" ? "despesas" : "receitas";

      try {
        const { data: deletedFromMain, error: mainError } = await supabaseClient
          .from(tableName)
          .delete()
          .in("id", ids)
          .select("id");

        if (mainError) {
          console.error(`Erro ao deletar da tabela ${tableName}:`, mainError);
          errors.push(`Erro na tabela ${tableName}: ${mainError.message}`);
        } else {
          const mainDeleted = deletedFromMain?.length || 0;
          deletedCount += mainDeleted;
          console.log(
            `Deletados ${mainDeleted} registros da tabela ${tableName}`
          );
        }
      } catch (error) {
        console.error(`Erro ao deletar da tabela ${tableName}:`, error);
        errors.push(`Erro na tabela ${tableName}: ${error.message}`);
      }

      // Deletar da tabela transacoes
      try {
        const { data: deletedFromTransacoes, error: transacoesError } =
          await supabaseClient
            .from("transacoes")
            .delete()
            .in("id", ids)
            .eq("tipo", tipo)
            .select("id");

        if (transacoesError) {
          console.error("Erro ao deletar da tabela transacoes:", transacoesError);
          errors.push(`Erro na tabela transacoes: ${transacoesError.message}`);
        } else {
          const transacoesDeleted = deletedFromTransacoes?.length || 0;
          deletedCount += transacoesDeleted;
          console.log(
            `Deletados ${transacoesDeleted} registros da tabela transacoes`
          );
        }
      } catch (error) {
        console.error("Erro ao deletar da tabela transacoes:", error);
        errors.push(`Erro na tabela transacoes: ${error.message}`);
      }
    }

    console.log(`Total deletado: ${deletedCount} registros`);

    if (errors.length > 0 && deletedCount === 0) {
      throw new Error(`Falha ao deletar registros: ${errors.join(", ")}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `${deletedCount} ${tipo === "divida" ? "dívida" : tipo}${
          deletedCount !== 1 ? (tipo === "divida" ? "s" : "s") : ""
        } deletada${deletedCount !== 1 ? "s" : ""} com sucesso`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
