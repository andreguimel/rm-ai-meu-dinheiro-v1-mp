import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const envVars = {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL") ? "SET" : "NOT SET",
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "SET" : "NOT SET",
      SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") ? "SET" : "NOT SET",
      MERCADOPAGO_ACCESS_TOKEN: Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ? "SET" : "NOT SET",
    };

    console.log("Environment variables status:", envVars);

    return new Response(
      JSON.stringify({
        message: "Environment variables check",
        variables: envVars,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error checking environment variables:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
