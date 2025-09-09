import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTrialAnalytics, useTrialAnalyticsData } from "../useTrialAnalytics";
import { supabase } from "@/integrations/supabase/client";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useTrialAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: "mock-token",
          user: { id: "user-123" },
        },
      },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("logTrialEvent", () => {
    it("should log trial event successfully", async () => {
      const { result } = renderHook(() => useTrialAnalytics());

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          event_id: "event-123",
          message: "Event logged successfully",
        }),
      });

      let response;
      await act(async () => {
        response = await result.current.logTrialEvent("trial_created", {
          user_email: "test@example.com",
          trial_days_remaining: 7,
        });
      });

      expect(response).toEqual({
        success: true,
        event_id: "event-123",
        message: "Event logged successfully",
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/log-trial-analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
        body: JSON.stringify({
          event_type: "trial_created",
          event_data: {
            user_email: "test@example.com",
            trial_days_remaining: 7,
          },
        }),
      });
    });

    it("should handle missing session gracefully", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useTrialAnalytics());

      let response;
      await act(async () => {
        response = await result.current.logTrialEvent("trial_created");
      });

      expect(response).toEqual({
        success: false,
        error: "No authentication session",
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should handle API errors", async () => {
      const { result } = renderHook(() => useTrialAnalytics());

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: "API Error",
        }),
      });

      let response;
      await act(async () => {
        response = await result.current.logTrialEvent("trial_error");
      });

      expect(response).toEqual({
        success: false,
        error: "API Error",
      });
    });

    it("should handle network errors", async () => {
      const { result } = renderHook(() => useTrialAnalytics());

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      let response;
      await act(async () => {
        response = await result.current.logTrialEvent("trial_accessed");
      });

      expect(response).toEqual({
        success: false,
        error: "Network error",
      });
    });
  });

  describe("convenience methods", () => {
    it("should call logTrialEvent with correct event types", async () => {
      const { result } = renderHook(() => useTrialAnalytics());

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await act(async () => {
        await result.current.logTrialCreated({ test: "data" });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/log-trial-analytics",
        expect.objectContaining({
          body: JSON.stringify({
            event_type: "trial_created",
            event_data: { test: "data" },
          }),
        })
      );

      await act(async () => {
        await result.current.logTrialAccessed();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/log-trial-analytics",
        expect.objectContaining({
          body: JSON.stringify({
            event_type: "trial_accessed",
            event_data: {},
          }),
        })
      );

      await act(async () => {
        await result.current.logTrialExpired();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/log-trial-analytics",
        expect.objectContaining({
          body: JSON.stringify({
            event_type: "trial_expired",
            event_data: {},
          }),
        })
      );

      await act(async () => {
        await result.current.logTrialConverted();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/log-trial-analytics",
        expect.objectContaining({
          body: JSON.stringify({
            event_type: "trial_converted",
            event_data: {},
          }),
        })
      );

      await act(async () => {
        await result.current.logTrialError();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/log-trial-analytics",
        expect.objectContaining({
          body: JSON.stringify({
            event_type: "trial_error",
            event_data: {},
          }),
        })
      );
    });
  });
});

describe("useTrialAnalyticsData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTrialAnalytics", () => {
    it("should fetch trial analytics successfully", async () => {
      const mockData = [
        {
          date: "2024-01-01",
          trials_created: 5,
          trials_accessed: 4,
          trials_expired: 1,
          trials_converted: 2,
          trial_errors: 0,
          conversion_rate: 40,
        },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const { result } = renderHook(() => useTrialAnalyticsData());

      let response;
      await act(async () => {
        response = await result.current.getTrialAnalytics(
          "2024-01-01",
          "2024-01-31"
        );
      });

      expect(response).toEqual({
        success: true,
        data: mockData,
      });

      expect(supabase.rpc).toHaveBeenCalledWith("get_trial_analytics", {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      });
    });

    it("should use default date range when not provided", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useTrialAnalyticsData());

      await act(async () => {
        await result.current.getTrialAnalytics();
      });

      expect(supabase.rpc).toHaveBeenCalledWith("get_trial_analytics", {
        start_date: expect.any(String),
        end_date: expect.any(String),
      });
    });

    it("should handle RPC errors", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: "RPC Error" },
      });

      const { result } = renderHook(() => useTrialAnalyticsData());

      let response;
      await act(async () => {
        response = await result.current.getTrialAnalytics();
      });

      expect(response).toEqual({
        success: false,
        error: "Unknown error",
      });
    });
  });

  describe("getTrialConversionFunnel", () => {
    it("should fetch conversion funnel data successfully", async () => {
      const mockData = [
        {
          total_trials_created: 100,
          total_trials_accessed: 80,
          total_trials_converted: 20,
          access_rate: 80,
          conversion_rate: 20,
        },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const { result } = renderHook(() => useTrialAnalyticsData());

      let response;
      await act(async () => {
        response = await result.current.getTrialConversionFunnel();
      });

      expect(response).toEqual({
        success: true,
        data: mockData[0],
      });

      expect(supabase.rpc).toHaveBeenCalledWith("get_trial_conversion_funnel", {
        start_date: expect.any(String),
        end_date: expect.any(String),
      });
    });
  });

  describe("getUserTrialJourney", () => {
    it("should fetch user trial journey successfully", async () => {
      const mockData = [
        {
          event_type: "trial_created",
          event_data: { user_email: "test@example.com" },
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          event_type: "trial_accessed",
          event_data: { trial_days_remaining: 6 },
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const { result } = renderHook(() => useTrialAnalyticsData());

      let response;
      await act(async () => {
        response = await result.current.getUserTrialJourney("user-123");
      });

      expect(response).toEqual({
        success: true,
        data: mockData,
      });

      expect(supabase.rpc).toHaveBeenCalledWith("get_user_trial_journey", {
        p_user_id: "user-123",
      });
    });
  });
});
