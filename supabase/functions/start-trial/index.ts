import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Enhanced logging function with structured logging
const logStep = (
  step: string,
  details?: any,
  level: "info" | "warn" | "error" = "info"
) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  const logMessage = `[START-TRIAL] [${level.toUpperCase()}] ${timestamp} - ${step}${detailsStr}`;

  if (level === "error") {
    console.error(logMessage);
  } else if (level === "warn") {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }
};

// Interface for trial creation response
interface TrialCreationResponse {
  message: string;
  trial_created: boolean;
  trial_already_exists: boolean;
  subscribed: boolean;
  subscription_tier: string;
  trial_start: string | null;
  trial_end: string | null;
  trial_days_remaining: number;
  access_level: string;
  effective_subscription: boolean;
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
    logStep("Function started", { method: req.method, url: req.url });

    // Authentication validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("Missing authorization header", {}, "error");
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");

    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);

    if (userError) {
      logStep("Authentication failed", { error: userError.message }, "error");
      throw new Error(`Authentication error: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      logStep(
        "User not authenticated or email not available",
        { userId: user?.id },
        "error"
      );
      throw new Error("User not authenticated or email not available");
    }

    logStep("User authenticated successfully", {
      userId: user.id,
      email: user.email,
      emailConfirmed: user.email_confirmed_at ? true : false,
    });

    // First-time user detection: Check current access status using enhanced function
    logStep("Checking user's current access status");

    const { data: accessStatus, error: accessError } = await supabaseClient.rpc(
      "get_user_access_status",
      { check_user_id: user.id }
    );

    if (accessError) {
      logStep(
        "Error checking user access status",
        { error: accessError },
        "error"
      );
      throw new Error(`Failed to check user status: ${accessError.message}`);
    }

    const userStatus = accessStatus?.[0];
    logStep("Current user access status", userStatus);

    // Prevent duplicate trials for existing users (Requirements 5.2, 5.3)
    if (userStatus) {
      // Check if user already has or had a trial
      if (userStatus.trial_start) {
        logStep(
          "User already has trial history",
          {
            trialActive: userStatus.trial_active,
            hasPaidSubscription: userStatus.has_paid_subscription,
            accessLevel: userStatus.access_level,
          },
          "warn"
        );

        const response: TrialCreationResponse = {
          message: userStatus.trial_active
            ? "Você já possui um período de teste ativo."
            : "Você já utilizou seu período de teste gratuito.",
          trial_created: false,
          trial_already_exists: true,
          subscribed: userStatus.has_paid_subscription,
          subscription_tier: userStatus.subscription_tier || "Trial",
          trial_start: userStatus.trial_start,
          trial_end: userStatus.trial_end,
          trial_days_remaining: userStatus.trial_days_remaining || 0,
          access_level: userStatus.access_level,
          effective_subscription: userStatus.effective_subscription,
        };

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // User has paid subscription but no trial history - they're eligible for trial
      if (userStatus.has_paid_subscription) {
        logStep(
          "User has paid subscription but no trial history - allowing trial creation"
        );
      }
    }

    // Create new trial for first-time user (Requirements 1.1, 1.2)
    logStep("Creating new trial for first-time user", {
      userId: user.id,
      email: user.email,
    });

    // Use the database function to ensure trial creation
    const { data: trialResult, error: trialError } = await supabaseClient.rpc(
      "ensure_user_has_trial",
      { check_user_id: user.id }
    );

    if (trialError) {
      logStep(
        "Error creating trial using database function",
        { error: trialError },
        "error"
      );

      // Log trial creation error for analytics
      await supabaseClient.rpc("log_trial_event", {
        p_user_id: user.id,
        p_event_type: "trial_error",
        p_event_data: {
          error_type: "creation_failed",
          error_message: trialError.message,
          user_email: user.email,
        },
      });

      throw new Error(`Failed to create trial: ${trialError.message}`);
    }

    if (!trialResult) {
      logStep(
        "Trial creation returned false - user may not be confirmed",
        {},
        "warn"
      );

      // Log trial creation error for analytics
      await supabaseClient.rpc("log_trial_event", {
        p_user_id: user.id,
        p_event_type: "trial_error",
        p_event_data: {
          error_type: "user_not_confirmed",
          user_email: user.email,
        },
      });

      throw new Error(
        "Unable to create trial. Please ensure your email is confirmed."
      );
    }

    // Get the newly created trial status
    const { data: newAccessStatus, error: newAccessError } =
      await supabaseClient.rpc("get_user_access_status", {
        check_user_id: user.id,
      });

    if (newAccessError) {
      logStep(
        "Error fetching new trial status",
        { error: newAccessError },
        "error"
      );
      throw new Error(
        `Failed to fetch new trial status: ${newAccessError.message}`
      );
    }

    const newStatus = newAccessStatus?.[0];
    if (!newStatus) {
      logStep("No trial status found after creation", {}, "error");
      throw new Error("Trial was created but status could not be retrieved");
    }

    logStep("Trial created successfully", {
      userId: user.id,
      trialDaysRemaining: newStatus.trial_days_remaining,
      accessLevel: newStatus.access_level,
    });

    // Log successful trial creation for analytics
    await supabaseClient.rpc("log_trial_event", {
      p_user_id: user.id,
      p_event_type: "trial_created",
      p_event_data: {
        user_email: user.email,
        trial_start: newStatus.trial_start,
        trial_end: newStatus.trial_end,
        trial_days_remaining: newStatus.trial_days_remaining,
        access_level: newStatus.access_level,
      },
    });

    const response: TrialCreationResponse = {
      message:
        "Período de teste iniciado com sucesso! Você tem 7 dias grátis para experimentar todas as funcionalidades.",
      trial_created: true,
      trial_already_exists: false,
      subscribed: newStatus.has_paid_subscription,
      subscription_tier: newStatus.subscription_tier || "Trial",
      trial_start: newStatus.trial_start,
      trial_end: newStatus.trial_end,
      trial_days_remaining: newStatus.trial_days_remaining || 7,
      access_level: newStatus.access_level,
      effective_subscription: newStatus.effective_subscription,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
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

    logStep("ERROR in start-trial function", errorDetails, "error");

    // Try to log error for analytics if we have user context
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData.user) {
          await supabaseClient.rpc("log_trial_event", {
            p_user_id: userData.user.id,
            p_event_type: "trial_error",
            p_event_data: {
              error_type: "function_error",
              error_message: errorMessage,
              error_details: errorDetails,
            },
          });
        }
      }
    } catch (analyticsError) {
      logStep("Failed to log error analytics", { analyticsError }, "warn");
    }

    // Return structured error response
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
        trial_created: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
