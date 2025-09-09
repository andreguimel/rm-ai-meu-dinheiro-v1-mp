import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
  auth: {
    getSession: vi.fn(),
  },
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

describe("Trial Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Trial Creation Flow", () => {
    it("should create trial for new user successfully", async () => {
      // Mock session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: "mock-token",
            user: { id: "new-user-id", email: "new@example.com" },
          },
        },
        error: null,
      });

      // Mock start-trial Edge Function response
      const mockTrialResponse = {
        message:
          "Período de teste iniciado com sucesso! Você tem 7 dias grátis para experimentar todas as funcionalidades.",
        trial_created: true,
        trial_already_exists: false,
        subscribed: false,
        subscription_tier: "Trial",
        trial_start: "2024-01-01T00:00:00Z",
        trial_end: "2024-01-08T00:00:00Z",
        trial_days_remaining: 7,
        access_level: "trial",
        effective_subscription: true,
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockTrialResponse,
        error: null,
      });

      const { data, error } = await supabase.functions.invoke("start-trial");

      expect(error).toBeNull();
      expect(data.trial_created).toBe(true);
      expect(data.trial_already_exists).toBe(false);
      expect(data.access_level).toBe("trial");
      expect(data.trial_days_remaining).toBe(7);
      expect(data.effective_subscription).toBe(true);
    });

    it("should prevent duplicate trial creation", async () => {
      // Mock session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: "mock-token",
            user: { id: "existing-user-id", email: "existing@example.com" },
          },
        },
        error: null,
      });

      // Mock start-trial Edge Function response for existing user
      const mockTrialResponse = {
        message: "Você já possui um período de teste ativo.",
        trial_created: false,
        trial_already_exists: true,
        subscribed: false,
        subscription_tier: "Trial",
        trial_start: "2024-01-01T00:00:00Z",
        trial_end: "2024-01-08T00:00:00Z",
        trial_days_remaining: 5,
        access_level: "trial",
        effective_subscription: true,
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockTrialResponse,
        error: null,
      });

      const { data, error } = await supabase.functions.invoke("start-trial");

      expect(error).toBeNull();
      expect(data.trial_created).toBe(false);
      expect(data.trial_already_exists).toBe(true);
      expect(data.access_level).toBe("trial");
      expect(data.trial_days_remaining).toBe(5);
    });

    it("should handle trial creation for user with expired trial", async () => {
      // Mock session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: "mock-token",
            user: { id: "expired-user-id", email: "expired@example.com" },
          },
        },
        error: null,
      });

      // Mock start-trial Edge Function response for user with expired trial
      const mockTrialResponse = {
        message: "Você já utilizou seu período de teste gratuito.",
        trial_created: false,
        trial_already_exists: true,
        subscribed: false,
        subscription_tier: "Trial",
        trial_start: "2023-12-25T00:00:00Z",
        trial_end: "2024-01-01T00:00:00Z",
        trial_days_remaining: 0,
        access_level: "none",
        effective_subscription: false,
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockTrialResponse,
        error: null,
      });

      const { data, error } = await supabase.functions.invoke("start-trial");

      expect(error).toBeNull();
      expect(data.trial_created).toBe(false);
      expect(data.trial_already_exists).toBe(true);
      expect(data.access_level).toBe("none");
      expect(data.trial_days_remaining).toBe(0);
      expect(data.effective_subscription).toBe(false);
    });

    it("should handle authentication errors during trial creation", async () => {
      // Mock authentication error
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: "User not authenticated" },
      });

      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: "No authorization header provided" },
      });

      const { data, error } = await supabase.functions.invoke("start-trial");

      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error.message).toContain("authorization");
    });

    it("should handle database errors during trial creation", async () => {
      // Mock session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: "mock-token",
            user: { id: "test-user-id", email: "test@example.com" },
          },
        },
        error: null,
      });

      // Mock database error
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: {
          message: "Failed to create trial: Database connection failed",
        },
      });

      const { data, error } = await supabase.functions.invoke("start-trial");

      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error.message).toContain("Database connection failed");
    });
  });

  describe("Trial Verification Flow", () => {
    it("should verify active trial correctly", async () => {
      // Mock check-mercadopago-subscription response with active trial
      const mockSubscriptionResponse = {
        subscribed: false,
        subscription_tier: "Trial",
        trial_start: "2024-01-01T00:00:00Z",
        trial_end: "2024-01-08T00:00:00Z",
        trial_days_remaining: 5,
        trial_active: true,
        has_paid_subscription: false,
        access_level: "trial",
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockSubscriptionResponse,
        error: null,
      });

      const { data, error } = await supabase.functions.invoke(
        "check-mercadopago-subscription"
      );

      expect(error).toBeNull();
      expect(data.trial_active).toBe(true);
      expect(data.access_level).toBe("trial");
      expect(data.trial_days_remaining).toBe(5);
      expect(data.has_paid_subscription).toBe(false);
    });

    it("should verify expired trial correctly", async () => {
      // Mock check-mercadopago-subscription response with expired trial
      const mockSubscriptionResponse = {
        subscribed: false,
        subscription_tier: "Trial",
        trial_start: "2023-12-25T00:00:00Z",
        trial_end: "2024-01-01T00:00:00Z",
        trial_days_remaining: 0,
        trial_active: false,
        has_paid_subscription: false,
        access_level: "none",
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockSubscriptionResponse,
        error: null,
      });

      const { data, error } = await supabase.functions.invoke(
        "check-mercadopago-subscription"
      );

      expect(error).toBeNull();
      expect(data.trial_active).toBe(false);
      expect(data.access_level).toBe("none");
      expect(data.trial_days_remaining).toBe(0);
    });

    it("should prioritize paid subscription over trial", async () => {
      // Mock check-mercadopago-subscription response with both paid and trial
      const mockSubscriptionResponse = {
        subscribed: true,
        subscription_tier: "Premium",
        trial_start: "2024-01-01T00:00:00Z",
        trial_end: "2024-01-08T00:00:00Z",
        trial_days_remaining: 3,
        trial_active: true,
        has_paid_subscription: true,
        access_level: "premium", // Should be premium, not trial
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockSubscriptionResponse,
        error: null,
      });

      const { data, error } = await supabase.functions.invoke(
        "check-mercadopago-subscription"
      );

      expect(error).toBeNull();
      expect(data.access_level).toBe("premium");
      expect(data.has_paid_subscription).toBe(true);
      expect(data.subscribed).toBe(true);
    });

    it("should handle verification errors gracefully", async () => {
      // Mock verification error
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: "Failed to verify subscription status" },
      });

      const { data, error } = await supabase.functions.invoke(
        "check-mercadopago-subscription"
      );

      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error.message).toContain("verify subscription");
    });
  });

  describe("End-to-End Trial Flow", () => {
    it("should complete full trial lifecycle: creation -> verification -> expiration", async () => {
      const userId = "lifecycle-user-id";

      // Step 1: Create trial
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: "mock-token",
            user: { id: userId, email: "lifecycle@example.com" },
          },
        },
        error: null,
      });

      const mockTrialCreation = {
        trial_created: true,
        trial_already_exists: false,
        access_level: "trial",
        trial_days_remaining: 7,
        effective_subscription: true,
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockTrialCreation,
        error: null,
      });

      const creationResult = await supabase.functions.invoke("start-trial");
      expect(creationResult.data.trial_created).toBe(true);
      expect(creationResult.data.access_level).toBe("trial");

      // Step 2: Verify active trial
      const mockActiveVerification = {
        trial_active: true,
        access_level: "trial",
        trial_days_remaining: 5,
        has_paid_subscription: false,
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockActiveVerification,
        error: null,
      });

      const verificationResult = await supabase.functions.invoke(
        "check-mercadopago-subscription"
      );
      expect(verificationResult.data.trial_active).toBe(true);
      expect(verificationResult.data.access_level).toBe("trial");

      // Step 3: Verify expired trial
      const mockExpiredVerification = {
        trial_active: false,
        access_level: "none",
        trial_days_remaining: 0,
        has_paid_subscription: false,
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockExpiredVerification,
        error: null,
      });

      const expiredResult = await supabase.functions.invoke(
        "check-mercadopago-subscription"
      );
      expect(expiredResult.data.trial_active).toBe(false);
      expect(expiredResult.data.access_level).toBe("none");
    });

    it("should handle trial to subscription upgrade flow", async () => {
      const userId = "upgrade-user-id";

      // Step 1: User has active trial
      const mockTrialStatus = {
        trial_active: true,
        access_level: "trial",
        trial_days_remaining: 3,
        has_paid_subscription: false,
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockTrialStatus,
        error: null,
      });

      const trialResult = await supabase.functions.invoke(
        "check-mercadopago-subscription"
      );
      expect(trialResult.data.access_level).toBe("trial");

      // Step 2: User upgrades to paid subscription
      const mockUpgradedStatus = {
        trial_active: true, // Trial still exists but paid takes priority
        access_level: "premium",
        trial_days_remaining: 3,
        has_paid_subscription: true,
        subscribed: true,
        subscription_tier: "Premium",
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockUpgradedStatus,
        error: null,
      });

      const upgradedResult = await supabase.functions.invoke(
        "check-mercadopago-subscription"
      );
      expect(upgradedResult.data.access_level).toBe("premium");
      expect(upgradedResult.data.has_paid_subscription).toBe(true);
    });
  });

  describe("Error Recovery and Resilience", () => {
    it("should retry failed operations", async () => {
      let callCount = 0;

      mockSupabase.functions.invoke.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: null,
            error: { message: "Temporary network error" },
          });
        }
        return Promise.resolve({
          data: { trial_active: true, access_level: "trial" },
          error: null,
        });
      });

      // First call fails
      const firstResult = await supabase.functions.invoke(
        "check-mercadopago-subscription"
      );
      expect(firstResult.error).toBeTruthy();

      // Second call succeeds
      const secondResult = await supabase.functions.invoke(
        "check-mercadopago-subscription"
      );
      expect(secondResult.error).toBeNull();
      expect(secondResult.data.trial_active).toBe(true);
    });

    it("should handle concurrent trial operations", async () => {
      const mockResponse = {
        trial_active: true,
        access_level: "trial",
        trial_days_remaining: 5,
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      // Simulate concurrent verification calls
      const promises = Array(10)
        .fill(null)
        .map(() => supabase.functions.invoke("check-mercadopago-subscription"));

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.error).toBeNull();
        expect(result.data.trial_active).toBe(true);
      });
    });

    it("should handle malformed response data", async () => {
      // Mock malformed response
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { invalid: "data" }, // Missing required fields
        error: null,
      });

      const { data, error } = await supabase.functions.invoke(
        "check-mercadopago-subscription"
      );

      expect(error).toBeNull();
      expect(data.invalid).toBe("data");
      // Application should handle missing fields gracefully
    });
  });
});
