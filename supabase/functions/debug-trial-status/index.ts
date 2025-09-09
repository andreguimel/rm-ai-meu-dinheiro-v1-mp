import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    console.log("🔍 Debug Trial Status - Function started");

    // Authentication validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);

    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }

    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    console.log("✅ User authenticated:", user.id, user.email);

    // 1. Test get_user_access_status function
    console.log("🔍 Testing get_user_access_status function...");
    const { data: accessStatusData, error: accessStatusError } =
      await supabaseClient.rpc("get_user_access_status", {
        check_user_id: user.id,
      });

    console.log("📊 Access Status Result:", {
      data: accessStatusData,
      error: accessStatusError,
    });

    // 2. Check subscribers table directly
    console.log("🔍 Checking subscribers table directly...");
    const { data: subscriberData, error: subscriberError } =
      await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("user_id", user.id);

    console.log("📊 Subscriber Data:", {
      data: subscriberData,
      error: subscriberError,
    });

    // 3. Test ensure_user_has_trial function
    console.log("🔍 Testing ensure_user_has_trial function...");
    const { data: trialCreationResult, error: trialCreationError } =
      await supabaseClient.rpc("ensure_user_has_trial", {
        check_user_id: user.id,
      });

    console.log("📊 Trial Creation Result:", {
      data: trialCreationResult,
      error: trialCreationError,
    });

    // 4. Check access status again after trial creation
    console.log("🔍 Checking access status after trial creation...");
    const { data: finalAccessStatus, error: finalAccessError } =
      await supabaseClient.rpc("get_user_access_status", {
        check_user_id: user.id,
      });

    console.log("📊 Final Access Status:", {
      data: finalAccessStatus,
      error: finalAccessError,
    });

    // 5. Check final subscriber data
    const { data: finalSubscriberData, error: finalSubscriberError } =
      await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("user_id", user.id);

    console.log("📊 Final Subscriber Data:", {
      data: finalSubscriberData,
      error: finalSubscriberError,
    });

    // Return comprehensive debug information
    const debugInfo = {
      user: {
        id: user.id,
        email: user.email,
        confirmed: user.email_confirmed_at !== null,
      },
      accessStatus: {
        data: accessStatusData,
        error: accessStatusError,
      },
      subscriberData: {
        data: subscriberData,
        error: subscriberError,
      },
      trialCreation: {
        data: trialCreationResult,
        error: trialCreationError,
      },
      finalAccessStatus: {
        data: finalAccessStatus,
        error: finalAccessError,
      },
      finalSubscriberData: {
        data: finalSubscriberData,
        error: finalSubscriberError,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(debugInfo, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error in debug-trial-status:", errorMessage);

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
