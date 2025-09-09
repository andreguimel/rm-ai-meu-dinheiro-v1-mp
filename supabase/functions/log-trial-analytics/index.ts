import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Enhanced logging function
const logStep = (
  step: string,
  details?: any,
  level: "info" | "warn" | "error" = "info"
) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  const logMessage = `[LOG-TRIAL-ANALYTICS] [${level.toUpperCase()}] ${timestamp} - ${step}${detailsStr}`;

  if (level === "error") {
    console.error(logMessage);
  } else if (level === "warn") {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }
};

interface AnalyticsRequest {
  event_type:
    | "trial_created"
    | "trial_accessed"
    | "trial_expired"
    | "trial_converted"
    | "trial_error";
  event_data?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Analytics logging function started", { method: req.method });

    // Authentication validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("Missing authorization header", {}, "error");
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);

    if (userError) {
      logStep("Authentication failed", { error: userError.message }, "error");
      throw new Error(`Authentication error: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      logStep("User not authenticated", { userId: user?.id }, "error");
      throw new Error("User not authenticated or email not available");
    }

    logStep("User authenticated successfully", {
      userId: user.id,
      email: user.email,
    });

    // Parse request body
    const requestBody: AnalyticsRequest = await req.json();

    if (!requestBody.event_type) {
      throw new Error("event_type is required");
    }

    logStep("Logging trial analytics event", {
      userId: user.id,
      eventType: requestBody.event_type,
      eventData: requestBody.event_data,
    });

    // Log the trial event
    const { data: eventId, error: logError } = await supabaseClient.rpc(
      "log_trial_event",
      {
        p_user_id: user.id,
        p_event_type: requestBody.event_type,
        p_event_data: requestBody.event_data || {},
      }
    );

    if (logError) {
      logStep("Error logging trial event", { error: logError }, "error");
      throw new Error(`Failed to log trial event: ${logError.message}`);
    }

    logStep("Trial analytics event logged successfully", {
      eventId,
      userId: user.id,
      eventType: requestBody.event_type,
    });

    return new Response(
      JSON.stringify({
        success: true,
        event_id: eventId,
        message: "Trial analytics event logged successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : { message: String(error) };

    logStep("ERROR in log-trial-analytics function", errorDetails, "error");

    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
