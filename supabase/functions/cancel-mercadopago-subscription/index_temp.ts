import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    console.log("🔄 Iniciando cancelamento...");

    // Por enquanto, retornar uma mensagem informativa
    console.log("ℹ️ Cancelamento temporariamente indisponível");

    return new Response(
      JSON.stringify({
        success: false,
        message:
          "Cancelamento temporariamente indisponível. Entre em contato conosco pelo WhatsApp para cancelar sua assinatura.",
        contact: "WhatsApp: +55 11 99999-9999",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erro geral:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Erro ao processar cancelamento",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
