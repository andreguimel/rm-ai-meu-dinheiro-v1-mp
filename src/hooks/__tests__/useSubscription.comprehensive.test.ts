import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSubscription } from "../useSubscription";
import { useAuth } from "../useAuth";
import { useToast } from "../use-toast";
import { supabase } from "@/integrations/supabase/client";

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

// Mock dependencies
vi.mock("../useAuth");
vi.mock("../use-toast");
vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;
const mockUseToast = useToast as vi.MockedFunction<typeof useToast>;

describe("useSubscription - Comprehensive Tests", () => {
  const mockToast = vi.fn();
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
  };
  const mockSession = {
    access_token: "mock-token",
    user: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ toast: mockToast });
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: mockSession,
      loading: false,
      signOut: vi.fn(),
    });
  });

  describe("Trial Data Management", () => {
    it("should handle active trial data correctly", async () => {
      const mockTrialData = {
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
        data: mockTrialData,
        error: null,
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscriptionData.trial_active).toBe(true);
      expect(result.current.subscriptionData.trial_days_remaining).toBe(5);
      expect(result.current.subscriptionData.access_level).toBe("trial");
      expect(result.current.subscriptionData.effective_subscription).toBe(true);
      expect(result.current.hasActiveTrial).toBe(true);
      expect(result.current.hasPaidSubscription).toBe(false);
      expect(result.current.accessLevel).toBe("trial");
    });

    it("should handle expired trial data correctly", async () => {
      const mockExpiredTrialData = {
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
        data: mockExpiredTrialData,
        error: null,
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscriptionData.trial_active).toBe(false);
      expect(result.current.subscriptionData.trial_days_remaining).toBe(0);
      expect(result.current.subscriptionData.access_level).toBe("none");
      expect(result.current.subscriptionData.effective_subscription).toBe(
        false
      );
      expect(result.current.hasActiveTrial).toBe(false);
      expect(result.current.accessLevel).toBe("none");
    });

    it("should prioritize paid subscription over trial", async () => {
      const mockPaidWithTrialData = {
        subscribed: true,
        subscription_tier: "Premium",
        trial_start: "2024-01-01T00:00:00Z",
        trial_end: "2024-01-08T00:00:00Z",
        trial_days_remaining: 3,
        trial_active: true,
        has_paid_subscription: true,
        access_level: "premium",
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockPaidWithTrialData,
        error: null,
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscriptionData.access_level).toBe("premium");
      expect(result.current.subscriptionData.has_paid_subscription).toBe(true);
      expect(result.current.hasPaidSubscription).toBe(true);
      expect(result.current.hasActiveTrial).toBe(true); // Still has trial
      expect(result.current.accessLevel).toBe("premium"); // But premium takes priority
    });

    it("should calculate trial expiration status correctly", async () => {
      const testCases = [
        { days: 7, isExpiring: false, isExpired: false },
        { days: 3, isExpiring: false, isExpired: false },
        { days: 1, isExpiring: true, isExpired: false },
        { days: 0, isExpiring: false, isExpired: true },
      ];

      for (const testCase of testCases) {
        const mockTrialData = {
          subscribed: false,
          subscription_tier: "Trial",
          trial_days_remaining: testCase.days,
          trial_active: testCase.days > 0,
          has_paid_subscription: false,
          access_level: testCase.days > 0 ? "trial" : "none",
        };

        mockSupabase.functions.invoke.mockResolvedValue({
          data: mockTrialData,
          error: null,
        });

        const { result } = renderHook(() => useSubscription());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.isTrialExpiring).toBe(testCase.isExpiring);
        expect(result.current.isTrialExpired).toBe(testCase.isExpired);
        expect(result.current.trialDaysRemaining).toBe(testCase.days);
      }
    });
  });

  describe("Trial Creation", () => {
    it("should create trial successfully", async () => {
      const mockTrialCreationResponse = {
        message: "Período de teste iniciado com sucesso!",
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

      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: mockTrialCreationResponse,
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            trial_active: true,
            access_level: "trial",
            trial_days_remaining: 7,
          },
          error: null,
        });

      const { result } = renderHook(() => useSubscription());

      await act(async () => {
        await result.current.startTrial();
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith("start-trial");
      expect(mockToast).toHaveBeenCalledWith({
        title: "Período de teste iniciado!",
        description:
          "Você tem 7 dias grátis para experimentar todas as funcionalidades.",
      });
    });

    it("should handle trial creation for existing user", async () => {
      const mockExistingTrialResponse = {
        message: "Você já possui um período de teste ativo.",
        trial_created: false,
        trial_already_exists: true,
        subscribed: false,
        subscription_tier: "Trial",
        trial_days_remaining: 5,
        access_level: "trial",
        effective_subscription: true,
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockExistingTrialResponse,
        error: null,
      });

      const { result } = renderHook(() => useSubscription());

      await act(async () => {
        await result.current.startTrial();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Período de teste já ativo",
        description: "Você já possui um período de teste ativo.",
      });
    });

    it("should handle trial creation errors", async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: "Failed to create trial" },
      });

      const { result } = renderHook(() => useSubscription());

      await act(async () => {
        await result.current.startTrial();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Erro ao iniciar período de teste",
        description:
          "Não foi possível iniciar o período de teste. Tente novamente.",
        variant: "destructive",
      });
    });

    it("should handle network errors during trial creation", async () => {
      mockSupabase.functions.invoke.mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() => useSubscription());

      await act(async () => {
        await result.current.startTrial();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Erro ao iniciar período de teste",
        description:
          "Não foi possível iniciar o período de teste. Tente novamente.",
        variant: "destructive",
      });
    });
  });

  describe("Subscription Verification", () => {
    it("should verify subscription with trial data", async () => {
      const mockVerificationData = {
        subscribed: false,
        subscription_tier: "Trial",
        trial_active: true,
        trial_days_remaining: 4,
        has_paid_subscription: false,
        access_level: "trial",
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockVerificationData,
        error: null,
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.checkSubscription();
      });

      expect(result.current.subscriptionData.trial_active).toBe(true);
      expect(result.current.subscriptionData.access_level).toBe("trial");
    });

    it("should handle verification with caching", async () => {
      const mockCachedData = {
        subscribed: true,
        subscription_tier: "Premium",
        trial_active: false,
        has_paid_subscription: true,
        access_level: "premium",
        cached: true,
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockCachedData,
        error: null,
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Multiple calls should use cache
      await act(async () => {
        await result.current.checkSubscription();
        await result.current.checkSubscription();
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(2); // Initial + one manual check
    });

    it("should force refresh subscription data", async () => {
      const mockInitialData = {
        subscribed: false,
        trial_active: true,
        access_level: "trial",
      };

      const mockRefreshedData = {
        subscribed: true,
        trial_active: false,
        access_level: "premium",
      };

      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: mockInitialData,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockRefreshedData,
          error: null,
        });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscriptionData.access_level).toBe("trial");

      await act(async () => {
        await result.current.forceRefreshSubscription();
      });

      expect(result.current.subscriptionData.access_level).toBe("premium");
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle malformed subscription data", async () => {
      const mockMalformedData = {
        // Missing required fields
        invalid_field: "test",
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockMalformedData,
        error: null,
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should use default values for missing fields
      expect(result.current.subscriptionData.subscribed).toBe(false);
      expect(result.current.subscriptionData.trial_active).toBe(false);
      expect(result.current.subscriptionData.access_level).toBe("none");
    });

    it("should handle null/undefined subscription data", async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.subscriptionData.subscribed).toBe(false);
      expect(result.current.subscriptionData.effective_subscription).toBe(
        false
      );
      expect(result.current.accessLevel).toBe("none");
    });

    it("should handle authentication errors", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        loading: false,
        signOut: vi.fn(),
      });

      const { result } = renderHook(() => useSubscription());

      expect(result.current.subscriptionData.subscribed).toBe(false);
      expect(result.current.subscriptionData.access_level).toBe("none");
      expect(result.current.loading).toBe(false);
    });

    it("should handle concurrent subscription checks", async () => {
      const mockData = {
        subscribed: true,
        access_level: "premium",
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger multiple concurrent checks
      await act(async () => {
        const promises = Array(5)
          .fill(null)
          .map(() => result.current.checkSubscription());
        await Promise.all(promises);
      });

      expect(result.current.subscriptionData.access_level).toBe("premium");
    });

    it("should handle subscription service timeouts", async () => {
      mockSupabase.functions.invoke.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 100)
          )
      );

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.subscriptionData.access_level).toBe("none");
    });
  });

  describe("Performance and Memory Management", () => {
    it("should not cause memory leaks with rapid re-renders", async () => {
      const mockData = {
        subscribed: true,
        access_level: "premium",
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const { result, rerender } = renderHook(() => useSubscription());

      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender();
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });
      }

      expect(result.current.subscriptionData.access_level).toBe("premium");
    });

    it("should debounce rapid subscription checks", async () => {
      const mockData = {
        subscribed: true,
        access_level: "premium",
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger rapid checks
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          result.current.checkSubscription();
        }
      });

      // Should not make excessive API calls
      expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(2); // Initial + debounced
    });
  });

  describe("Integration with Other Features", () => {
    it("should work with checkout creation", async () => {
      const mockCheckoutData = {
        checkout_url: "https://checkout.example.com",
        checkout_id: "checkout-123",
      };

      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: { access_level: "trial" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockCheckoutData,
          error: null,
        });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.createCheckout();
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        "create-mercadopago-subscription"
      );
    });

    it("should work with subscription cancellation", async () => {
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: { access_level: "premium", subscribed: true },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { success: true },
          error: null,
        });

      const { result } = renderHook(() => useSubscription());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.cancelSubscription();
      });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        "manage-mercadopago-subscription",
        { action: "cancel" }
      );
    });
  });
});
