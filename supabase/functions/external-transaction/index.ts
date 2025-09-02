import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase com service role para bypassar RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificação de API key OU authorization header
    const apiKey = req.headers.get("x-api-key");
    const authHeader = req.headers.get("Authorization");

    if (!apiKey && !authHeader) {
      return new Response(
        JSON.stringify({
          error: "API key ou Authorization header obrigatório",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Se usar API key, verificar se é válida
    if (apiKey && apiKey !== "rm-ai-meu-dinheiro-api-key-2024") {
      return new Response(JSON.stringify({ error: "API key inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("=== FUNÇÃO CHAMADA ===");
    console.log(
      "Headers recebidos:",
      Object.fromEntries(req.headers.entries())
    );

    // Get request body
    const body = await req.json();

    // DEBUG: Log para ver o que está chegando
    console.log("=== DEBUG EDGE FUNCTION ===");
    console.log("Body recebido completo:", JSON.stringify(body, null, 2));
    console.log(
      "Headers completos:",
      Object.fromEntries(req.headers.entries())
    );
    console.log("Campo descricao especificamente:", body.descricao);
    console.log("Tipo da descricao:", typeof body.descricao);
    console.log("========================");

    const {
      tipo, // 'receita' ou 'despesa'
      descricao,
      valor,
      data,
      categoria_nome,
      shared_user_name, // Nome do usuário compartilhado
      account_owner_id, // ID da conta principal
    } = body;

    console.log("=== VARIÁVEIS EXTRAÍDAS ===");
    console.log("tipo:", tipo);
    console.log("descricao:", descricao);
    console.log("valor (original):", valor);
    console.log("valor (tipo):", typeof valor);
    console.log("valor (parseFloat):", parseFloat(valor));
    console.log("data:", data);
    console.log("categoria_nome:", categoria_nome);
    console.log("shared_user_name:", shared_user_name);
    console.log("account_owner_id:", account_owner_id);
    console.log("============================");

    // Validar campos obrigatórios
    if (!tipo || !descricao || !valor || !data || !account_owner_id) {
      console.log("Campos faltando:", {
        tipo,
        descricao,
        valor,
        data,
        account_owner_id,
      });
      return new Response(
        JSON.stringify({
          error:
            "Campos obrigatórios: tipo, descricao, valor, data, account_owner_id",
          received: { tipo, descricao, valor, data, account_owner_id },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se o tipo é válido
    if (!["receita", "despesa"].includes(tipo)) {
      return new Response(
        JSON.stringify({ error: 'Tipo deve ser "receita" ou "despesa"' }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buscar categoria por nome (se fornecida)
    let categoria_id = null;
    if (categoria_nome) {
      const { data: categoria, error: categoriaError } = await supabase
        .from("categorias")
        .select("id")
        .eq("nome", categoria_nome)
        .eq("user_id", account_owner_id)
        .eq("tipo", tipo)
        .single();

      if (!categoriaError && categoria) {
        categoria_id = categoria.id;
      }
    }

    // Buscar shared_user por nome (se fornecido)
    let created_by_shared_user_id = null;
    if (shared_user_name) {
      console.log("Buscando shared user por nome:", shared_user_name);

      const { data: sharedUser, error: sharedUserError } = await supabase
        .from("shared_users")
        .select("id, name")
        .eq("owner_user_id", account_owner_id)
        .eq("active", true)
        .ilike("name", `%${shared_user_name.trim()}%`); // Busca mais flexível

      console.log("Resultado da busca de shared user:", {
        sharedUser,
        sharedUserError,
      });

      if (!sharedUserError && sharedUser && sharedUser.length > 0) {
        // Se encontrou múltiplos, pega o primeiro match exato, senão o primeiro
        const exactMatch = sharedUser.find(
          (u) =>
            u.name.toLowerCase().trim() ===
            shared_user_name.toLowerCase().trim()
        );
        created_by_shared_user_id = exactMatch
          ? exactMatch.id
          : sharedUser[0].id;
        console.log("Shared user encontrado:", exactMatch || sharedUser[0]);
      } else {
        console.log(
          "Nenhum shared user encontrado para o nome:",
          shared_user_name
        );
      }
    }

    // Determinar a tabela correta
    const tabela = tipo === "receita" ? "receitas" : "despesas";

    // Inserir o registro
    console.log("=== TENTANDO INSERIR NO BANCO ===");
    console.log("Tabela:", tabela);
    console.log("Dados para inserir:", {
      user_id: account_owner_id,
      categoria_id,
      created_by_shared_user_id,
      descricao,
      valor: parseFloat(valor),
      data,
    });

    const { data: novoRegistro, error: insertError } = await supabase
      .from(tabela)
      .insert([
        {
          user_id: account_owner_id,
          categoria_id,
          created_by_shared_user_id,
          descricao,
          valor: parseFloat(valor),
          data,
        },
      ])
      .select(
        `
        *,
        categorias (nome, cor, icone)
      `
      )
      .single();

    console.log("Resultado da inserção:", { novoRegistro, insertError });
    console.log("===============================");

    if (insertError) {
      console.error("Erro ao inserir registro:", insertError);
      return new Response(
        JSON.stringify({
          error: "Erro ao criar registro",
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`${tipo} criada via API externa:`, novoRegistro);

    return new Response(
      JSON.stringify({
        success: true,
        data: novoRegistro,
        message: `${tipo} criada com sucesso`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função external-transaction:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
