import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TrialEventType =
  | "trial_created"
  | "trial_accessed"
  | "trial_expired"
  | "trial_converted"
  | "trial_error";

interface TrialAnalyticsEvent {
  event_type: TrialEventType;
  event_data?: Record<string, any>;
}

interface TrialAnalyticsResponse {
  success: boolean;
  event_id?: string;
  message?: string;
  error?: string;
}

/**
 * Hook for logging trial analytics events
 * Provides methods to track trial usage, conversion, and errors
 */
export const useTrialAnalytics = () => {
  const logTrialEvent = useCallback(
    async (
      eventType: TrialEventType,
      eventData?: Record<string, any>
    ): Promise<TrialAnalyticsResponse> => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          console.warn("No session available for trial analytics logging");
          return { success: false, error: "No authentication session" };
        }

        const response = await fetch("/api/log-trial-analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            event_type: eventType,
            event_data: eventData || {},
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to log trial analytics");
        }

        const result: TrialAnalyticsResponse = await response.json();
        return result;
      } catch (error) {
        console.error("Error logging trial analytics:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  // Convenience methods for specific events
  const logTrialCreated = useCallback(
    (data?: Record<string, any>) => logTrialEvent("trial_created", data),
    [logTrialEvent]
  );

  const logTrialAccessed = useCallback(
    (data?: Record<string, any>) => logTrialEvent("trial_accessed", data),
    [logTrialEvent]
  );

  const logTrialExpired = useCallback(
    (data?: Record<string, any>) => logTrialEvent("trial_expired", data),
    [logTrialEvent]
  );

  const logTrialConverted = useCallback(
    (data?: Record<string, any>) => logTrialEvent("trial_converted", data),
    [logTrialEvent]
  );

  const logTrialError = useCallback(
    (data?: Record<string, any>) => logTrialEvent("trial_error", data),
    [logTrialEvent]
  );

  return {
    logTrialEvent,
    logTrialCreated,
    logTrialAccessed,
    logTrialExpired,
    logTrialConverted,
    logTrialError,
  };
};

/**
 * Hook for fetching trial analytics data (admin only)
 */
export const useTrialAnalyticsData = () => {
  const getTrialAnalytics = useCallback(
    async (startDate?: string, endDate?: string) => {
      try {
        const { data, error } = await supabase.rpc("get_trial_analytics", {
          start_date:
            startDate ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          end_date: endDate || new Date().toISOString().split("T")[0],
        });

        if (error) {
          throw error;
        }

        return { success: true, data };
      } catch (error) {
        console.error("Error fetching trial analytics:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  const getTrialConversionFunnel = useCallback(
    async (startDate?: string, endDate?: string) => {
      try {
        const { data, error } = await supabase.rpc(
          "get_trial_conversion_funnel",
          {
            start_date:
              startDate ||
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            end_date: endDate || new Date().toISOString().split("T")[0],
          }
        );

        if (error) {
          throw error;
        }

        return { success: true, data: data?.[0] };
      } catch (error) {
        console.error("Error fetching trial conversion funnel:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  const getUserTrialJourney = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("get_user_trial_journey", {
        p_user_id: userId,
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error fetching user trial journey:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, []);

  return {
    getTrialAnalytics,
    getTrialConversionFunnel,
    getUserTrialJourney,
  };
};
