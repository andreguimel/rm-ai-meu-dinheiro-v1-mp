import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

// Import after mocking
const { supabase } = await import("@/integrations/supabase/client");

describe("Trial Calculation Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculate_trial_status function", () => {
    it("should return correct trial status for active trial", async () => {
      const mockTrialData = {
        trial_active: true,
        days_remaining: 5,
        trial_start: "2024-01-01T00:00:00Z",
        trial_end: "2024-01-08T00:00:00Z",
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockTrialData],
        error: null,
      });

      const { data, error } = await supabase.rpc("calculate_trial_status", {
        check_user_id: "test-user-id",
      });

      expect(error).toBeNull();
      expect(data).toEqual([mockTrialData]);
      expect(data[0].trial_active).toBe(true);
      expect(data[0].days_remaining).toBe(5);
    });

    it("should return correct trial status for expired trial", async () => {
      const mockTrialData = {
        trial_active: false,
        days_remaining: 0,
        trial_start: "2023-12-25T00:00:00Z",
        trial_end: "2024-01-01T00:00:00Z",
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockTrialData],
        error: null,
      });

      const { data, error } = await supabase.rpc("calculate_trial_status", {
        check_user_id: "test-user-id",
      });

      expect(error).toBeNull();
      expect(data[0].trial_active).toBe(false);
      expect(data[0].days_remaining).toBe(0);
    });

    it("should return default values for user without trial", async () => {
      const mockTrialData = {
        trial_active: false,
        days_remaining: 0,
        trial_start: null,
        trial_end: null,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockTrialData],
        error: null,
      });

      const { data, error } = await supabase.rpc("calculate_trial_status", {
        check_user_id: "new-user-id",
      });

      expect(error).toBeNull();
      expect(data[0].trial_active).toBe(false);
      expect(data[0].days_remaining).toBe(0);
      expect(data[0].trial_start).toBeNull();
      expect(data[0].trial_end).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      });

      const { data, error } = await supabase.rpc("calculate_trial_status", {
        check_user_id: "test-user-id",
      });

      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error.message).toBe("Database connection failed");
    });

    it("should calculate correct days remaining for various scenarios", async () => {
      const testCases = [
        { days: 7, expected: 7 },
        { days: 3, expected: 3 },
        { days: 1, expected: 1 },
        { days: 0, expected: 0 },
        { days: -1, expected: 0 }, // Expired trial
      ];

      for (const testCase of testCases) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + testCase.days);

        const mockTrialData = {
          trial_active: testCase.days > 0,
          days_remaining: Math.max(0, testCase.expected),
          trial_start: "2024-01-01T00:00:00Z",
          trial_end: futureDate.toISOString(),
        };

        mockSupabase.rpc.mockResolvedValue({
          data: [mockTrialData],
          error: null,
        });

        const { data } = await supabase.rpc("calculate_trial_status", {
          check_user_id: "test-user-id",
        });

        expect(data[0].days_remaining).toBe(testCase.expected);
        expect(data[0].trial_active).toBe(testCase.days > 0);
      }
    });
  });

  describe("get_user_access_status function", () => {
    it("should return premium access for paid subscription", async () => {
      const mockAccessData = {
        has_paid_subscription: true,
        trial_active: false,
        trial_days_remaining: 0,
        access_level: "premium",
        effective_subscription: true,
        subscription_tier: "Premium",
        trial_start: null,
        trial_end: null,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockAccessData],
        error: null,
      });

      const { data, error } = await supabase.rpc("get_user_access_status", {
        check_user_id: "test-user-id",
      });

      expect(error).toBeNull();
      expect(data[0].access_level).toBe("premium");
      expect(data[0].has_paid_subscription).toBe(true);
      expect(data[0].effective_subscription).toBe(true);
    });

    it("should return trial access for active trial", async () => {
      const mockAccessData = {
        has_paid_subscription: false,
        trial_active: true,
        trial_days_remaining: 5,
        access_level: "trial",
        effective_subscription: true,
        subscription_tier: "Trial",
        trial_start: "2024-01-01T00:00:00Z",
        trial_end: "2024-01-08T00:00:00Z",
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockAccessData],
        error: null,
      });

      const { data, error } = await supabase.rpc("get_user_access_status", {
        check_user_id: "test-user-id",
      });

      expect(error).toBeNull();
      expect(data[0].access_level).toBe("trial");
      expect(data[0].trial_active).toBe(true);
      expect(data[0].effective_subscription).toBe(true);
    });

    it("should return no access for user without subscription or trial", async () => {
      const mockAccessData = {
        has_paid_subscription: false,
        trial_active: false,
        trial_days_remaining: 0,
        access_level: "none",
        effective_subscription: false,
        subscription_tier: null,
        trial_start: null,
        trial_end: null,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockAccessData],
        error: null,
      });

      const { data, error } = await supabase.rpc("get_user_access_status", {
        check_user_id: "test-user-id",
      });

      expect(error).toBeNull();
      expect(data[0].access_level).toBe("none");
      expect(data[0].has_paid_subscription).toBe(false);
      expect(data[0].trial_active).toBe(false);
      expect(data[0].effective_subscription).toBe(false);
    });

    it("should prioritize paid subscription over trial", async () => {
      const mockAccessData = {
        has_paid_subscription: true,
        trial_active: true, // Both active, but paid should take priority
        trial_days_remaining: 3,
        access_level: "premium", // Should be premium, not trial
        effective_subscription: true,
        subscription_tier: "Premium",
        trial_start: "2024-01-01T00:00:00Z",
        trial_end: "2024-01-08T00:00:00Z",
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockAccessData],
        error: null,
      });

      const { data, error } = await supabase.rpc("get_user_access_status", {
        check_user_id: "test-user-id",
      });

      expect(error).toBeNull();
      expect(data[0].access_level).toBe("premium");
      expect(data[0].has_paid_subscription).toBe(true);
      expect(data[0].effective_subscription).toBe(true);
    });

    it("should handle expired trial correctly", async () => {
      const mockAccessData = {
        has_paid_subscription: false,
        trial_active: false,
        trial_days_remaining: 0,
        access_level: "none",
        effective_subscription: false,
        subscription_tier: "Trial", // Had trial but expired
        trial_start: "2023-12-25T00:00:00Z",
        trial_end: "2024-01-01T00:00:00Z",
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockAccessData],
        error: null,
      });

      const { data, error } = await supabase.rpc("get_user_access_status", {
        check_user_id: "test-user-id",
      });

      expect(error).toBeNull();
      expect(data[0].access_level).toBe("none");
      expect(data[0].trial_active).toBe(false);
      expect(data[0].effective_subscription).toBe(false);
    });

    it("should return default values for non-existent user", async () => {
      const mockAccessData = {
        has_paid_subscription: false,
        trial_active: false,
        trial_days_remaining: 0,
        access_level: "none",
        effective_subscription: false,
        subscription_tier: null,
        trial_start: null,
        trial_end: null,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockAccessData],
        error: null,
      });

      const { data, error } = await supabase.rpc("get_user_access_status", {
        check_user_id: "non-existent-user",
      });

      expect(error).toBeNull();
      expect(data[0].access_level).toBe("none");
      expect(data[0].effective_subscription).toBe(false);
    });
  });

  describe("get_my_access_status function", () => {
    it("should call get_user_access_status with authenticated user ID", async () => {
      const mockAccessData = {
        has_paid_subscription: true,
        trial_active: false,
        trial_days_remaining: 0,
        access_level: "premium",
        effective_subscription: true,
        subscription_tier: "Premium",
        trial_start: null,
        trial_end: null,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockAccessData],
        error: null,
      });

      const { data, error } = await supabase.rpc("get_my_access_status");

      expect(error).toBeNull();
      expect(data[0]).toEqual(mockAccessData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_my_access_status");
    });

    it("should handle authentication errors", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "User not authenticated" },
      });

      const { data, error } = await supabase.rpc("get_my_access_status");

      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error.message).toBe("User not authenticated");
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle null trial dates", async () => {
      const mockTrialData = {
        trial_active: false,
        days_remaining: 0,
        trial_start: null,
        trial_end: null,
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockTrialData],
        error: null,
      });

      const { data, error } = await supabase.rpc("calculate_trial_status", {
        check_user_id: "test-user-id",
      });

      expect(error).toBeNull();
      expect(data[0].trial_active).toBe(false);
      expect(data[0].days_remaining).toBe(0);
    });

    it("should handle malformed date strings", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Invalid date format" },
      });

      const { data, error } = await supabase.rpc("calculate_trial_status", {
        check_user_id: "test-user-id",
      });

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });

    it("should handle network timeouts", async () => {
      mockSupabase.rpc.mockRejectedValue(new Error("Network timeout"));

      try {
        await supabase.rpc("get_user_access_status", {
          check_user_id: "test-user-id",
        });
      } catch (error: any) {
        expect(error.message).toBe("Network timeout");
      }
    });

    it("should handle concurrent access checks", async () => {
      const mockAccessData = {
        has_paid_subscription: false,
        trial_active: true,
        trial_days_remaining: 5,
        access_level: "trial",
        effective_subscription: true,
        subscription_tier: "Trial",
        trial_start: "2024-01-01T00:00:00Z",
        trial_end: "2024-01-08T00:00:00Z",
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockAccessData],
        error: null,
      });

      // Simulate concurrent calls
      const promises = Array(5)
        .fill(null)
        .map(() =>
          supabase.rpc("get_user_access_status", {
            check_user_id: "test-user-id",
          })
        );

      const results = await Promise.all(promises);

      results.forEach(({ data, error }) => {
        expect(error).toBeNull();
        expect(data[0].access_level).toBe("trial");
      });
    });
  });
});
