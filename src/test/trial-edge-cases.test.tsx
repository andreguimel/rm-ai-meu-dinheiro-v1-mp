import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { TrialStatusBanner } from "@/components/TrialStatusBanner";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

// Mock dependencies
vi.mock("@/hooks/useSubscription");
vi.mock("@/hooks/useAuth");
vi.mock("@/integrations/supabase/client");

const mockUseSubscription = useSubscription as vi.MockedFunction<
  typeof useSubscription
>;
const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;

const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Trial Edge Cases and Subscription Upgrades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: "test-user", email: "test@example.com" },
      session: { access_token: "token" },
      loading: false,
      signOut: vi.fn(),
    });
  });

  describe("Trial Expiration Edge Cases", () => {
    it("should handle trial expiring in less than 24 hours", () => {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 12); // 12 hours remaining

      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false,
          subscription_tier: "Trial",
          trial_active: true,
          trial_days_remaining: 1, // Less than 1 day
          trial_end: expiryDate.toISOString(),
          has_paid_subscription: false,
          access_level: "trial",
          effective_subscription: true,
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-01T00:00:00Z",
            trial_end: expiryDate.toISOString(),
            trial_days_remaining: 1,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: vi.fn(),
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: true,
        hasActiveTrial: true,
        hasPaidSubscription: false,
        accessLevel: "trial",
        trialDaysRemaining: 1,
        isTrialExpiring: true,
        isTrialExpired: false,
        canStartTrial: false,
      });

      render(<TrialStatusBanner />);

      expect(screen.getByText("Último dia!")).toBeInTheDocument();
      expect(screen.getByText("Assinar Agora")).toBeInTheDocument();

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-red-200", "bg-red-50", "text-red-900");
    });

    it("should handle trial expiring in minutes", () => {
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + 30); // 30 minutes remaining

      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false,
          subscription_tier: "Trial",
          trial_active: true,
          trial_days_remaining: 0, // Rounds to 0 days
          trial_end: expiryDate.toISOString(),
          has_paid_subscription: false,
          access_level: "trial",
          effective_subscription: true,
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-01T00:00:00Z",
            trial_end: expiryDate.toISOString(),
            trial_days_remaining: 0,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: vi.fn(),
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: true,
        hasActiveTrial: true,
        hasPaidSubscription: false,
        accessLevel: "trial",
        trialDaysRemaining: 0,
        isTrialExpiring: true,
        isTrialExpired: false,
        canStartTrial: false,
      });

      render(<TrialStatusBanner />);

      expect(screen.getByText("Último dia!")).toBeInTheDocument();
    });

    it("should handle trial that just expired (within last hour)", async () => {
      const expiredDate = new Date();
      expiredDate.setMinutes(expiredDate.getMinutes() - 30); // Expired 30 minutes ago

      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false,
          subscription_tier: "Trial",
          trial_active: false,
          trial_days_remaining: 0,
          trial_end: expiredDate.toISOString(),
          has_paid_subscription: false,
          access_level: "none",
          effective_subscription: false,
          trial_data: {
            trial_active: false,
            trial_start: "2024-01-01T00:00:00Z",
            trial_end: expiredDate.toISOString(),
            trial_days_remaining: 0,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: vi.fn(),
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: false,
        hasActiveTrial: false,
        hasPaidSubscription: false,
        accessLevel: "none",
        trialDaysRemaining: 0,
        isTrialExpiring: false,
        isTrialExpired: true,
        canStartTrial: false,
      });

      const mockNavigate = vi.fn();
      vi.mock("react-router-dom", async () => {
        const actual = await vi.importActual("react-router-dom");
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useLocation: () => ({ pathname: "/dashboard" }),
        };
      });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(
          screen.getByText("Período de teste expirado")
        ).toBeInTheDocument();
      });
    });

    it("should handle timezone differences in trial expiration", () => {
      // Test with different timezone
      const utcExpiryDate = new Date("2024-01-08T00:00:00Z");
      const localExpiryDate = new Date(
        utcExpiryDate.getTime() - 5 * 60 * 60 * 1000
      ); // UTC-5

      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false,
          subscription_tier: "Trial",
          trial_active: true,
          trial_days_remaining: 1,
          trial_end: utcExpiryDate.toISOString(),
          has_paid_subscription: false,
          access_level: "trial",
          effective_subscription: true,
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-01T00:00:00Z",
            trial_end: utcExpiryDate.toISOString(),
            trial_days_remaining: 1,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: vi.fn(),
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: true,
        hasActiveTrial: true,
        hasPaidSubscription: false,
        accessLevel: "trial",
        trialDaysRemaining: 1,
        isTrialExpiring: true,
        isTrialExpired: false,
        canStartTrial: false,
      });

      render(<TrialStatusBanner />);

      // Should display the date in local timezone
      const formattedDate = utcExpiryDate.toLocaleDateString("pt-BR");
      expect(screen.getByText(new RegExp(formattedDate))).toBeInTheDocument();
    });
  });

  describe("Subscription Upgrade Scenarios", () => {
    it("should handle upgrade from trial to paid subscription", async () => {
      const mockCreateCheckout = vi.fn().mockResolvedValue({
        checkout_url: "https://checkout.example.com",
      });

      // Start with trial
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false,
          subscription_tier: "Trial",
          trial_active: true,
          trial_days_remaining: 3,
          has_paid_subscription: false,
          access_level: "trial",
          effective_subscription: true,
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-01T00:00:00Z",
            trial_end: "2024-01-08T00:00:00Z",
            trial_days_remaining: 3,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: mockCreateCheckout,
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: true,
        hasActiveTrial: true,
        hasPaidSubscription: false,
        accessLevel: "trial",
        trialDaysRemaining: 3,
        isTrialExpiring: false,
        isTrialExpired: false,
        canStartTrial: false,
      });

      render(<TrialStatusBanner />);

      const upgradeButton = screen.getByText("Fazer Upgrade");
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(mockCreateCheckout).toHaveBeenCalledTimes(1);
      });
    });

    it("should handle user with both active trial and paid subscription", () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: true,
          subscription_tier: "Premium",
          trial_active: true, // Still has trial but paid takes priority
          trial_days_remaining: 2,
          has_paid_subscription: true,
          access_level: "premium", // Premium access level
          effective_subscription: true,
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-01T00:00:00Z",
            trial_end: "2024-01-08T00:00:00Z",
            trial_days_remaining: 2,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: vi.fn(),
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: true,
        hasActiveTrial: true,
        hasPaidSubscription: true,
        accessLevel: "premium",
        trialDaysRemaining: 2,
        isTrialExpiring: false,
        isTrialExpired: false,
        canStartTrial: false,
      });

      const { container } = render(<TrialStatusBanner />);

      // Should not render banner for paid users
      expect(container.firstChild).toBeNull();
    });

    it("should handle subscription cancellation during trial", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false, // Subscription cancelled
          subscription_tier: "Premium",
          trial_active: true, // But trial still active
          trial_days_remaining: 4,
          has_paid_subscription: false,
          access_level: "trial", // Falls back to trial
          effective_subscription: true,
          cancel_at_period_end: true,
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-01T00:00:00Z",
            trial_end: "2024-01-08T00:00:00Z",
            trial_days_remaining: 4,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: vi.fn(),
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: true,
        hasActiveTrial: true,
        hasPaidSubscription: false,
        accessLevel: "trial",
        trialDaysRemaining: 4,
        isTrialExpiring: false,
        isTrialExpired: false,
        canStartTrial: false,
      });

      const mockNavigate = vi.fn();
      const mockSupabaseRpc = vi
        .fn()
        .mockResolvedValue({ data: false, error: null });

      vi.mock("react-router-dom", async () => {
        const actual = await vi.importActual("react-router-dom");
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useLocation: () => ({ pathname: "/dashboard" }),
        };
      });

      vi.mock("@/integrations/supabase/client", () => ({
        supabase: {
          rpc: mockSupabaseRpc,
        },
      }));

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });

      // Should still have access through trial
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle upgrade during trial expiration warning", async () => {
      const mockCreateCheckout = vi.fn().mockResolvedValue({
        checkout_url: "https://checkout.example.com",
      });

      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false,
          subscription_tier: "Trial",
          trial_active: true,
          trial_days_remaining: 1, // Expiring soon
          has_paid_subscription: false,
          access_level: "trial",
          effective_subscription: true,
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-01T00:00:00Z",
            trial_end: "2024-01-08T00:00:00Z",
            trial_days_remaining: 1,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: mockCreateCheckout,
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: true,
        hasActiveTrial: true,
        hasPaidSubscription: false,
        accessLevel: "trial",
        trialDaysRemaining: 1,
        isTrialExpiring: true,
        isTrialExpired: false,
        canStartTrial: false,
      });

      const mockNavigate = vi.fn();
      const mockSupabaseRpc = vi
        .fn()
        .mockResolvedValue({ data: false, error: null });

      vi.mock("react-router-dom", async () => {
        const actual = await vi.importActual("react-router-dom");
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useLocation: () => ({ pathname: "/dashboard" }),
        };
      });

      vi.mock("@/integrations/supabase/client", () => ({
        supabase: {
          rpc: mockSupabaseRpc,
        },
      }));

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(
          screen.getByText("Seu teste expira em 1 dia")
        ).toBeInTheDocument();
      });

      const upgradeButton = screen.getByText("Fazer Upgrade Agora");
      fireEvent.click(upgradeButton);

      expect(mockCreateCheckout).toHaveBeenCalledTimes(1);
    });
  });

  describe("Complex Trial States", () => {
    it("should handle trial with invalid dates", () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false,
          subscription_tier: "Trial",
          trial_active: false, // Marked as inactive due to invalid dates
          trial_days_remaining: 0,
          trial_start: "invalid-date",
          trial_end: "invalid-date",
          has_paid_subscription: false,
          access_level: "none",
          effective_subscription: false,
          trial_data: {
            trial_active: false,
            trial_start: "invalid-date",
            trial_end: "invalid-date",
            trial_days_remaining: 0,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: vi.fn(),
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: false,
        hasActiveTrial: false,
        hasPaidSubscription: false,
        accessLevel: "none",
        trialDaysRemaining: 0,
        isTrialExpiring: false,
        isTrialExpired: false,
        canStartTrial: true,
      });

      const { container } = render(<TrialStatusBanner />);
      expect(container.firstChild).toBeNull();
    });

    it("should handle trial with future start date", () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 8);

      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false,
          subscription_tier: "Trial",
          trial_active: false, // Not active yet
          trial_days_remaining: 0,
          trial_start: futureStart.toISOString(),
          trial_end: futureEnd.toISOString(),
          has_paid_subscription: false,
          access_level: "none",
          effective_subscription: false,
          trial_data: {
            trial_active: false,
            trial_start: futureStart.toISOString(),
            trial_end: futureEnd.toISOString(),
            trial_days_remaining: 0,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: vi.fn(),
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: false,
        hasActiveTrial: false,
        hasPaidSubscription: false,
        accessLevel: "none",
        trialDaysRemaining: 0,
        isTrialExpiring: false,
        isTrialExpired: false,
        canStartTrial: true,
      });

      const { container } = render(<TrialStatusBanner />);
      expect(container.firstChild).toBeNull();
    });

    it("should handle trial with very long duration", () => {
      const longTrialEnd = new Date();
      longTrialEnd.setDate(longTrialEnd.getDate() + 365); // 1 year trial

      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false,
          subscription_tier: "Trial",
          trial_active: true,
          trial_days_remaining: 365,
          trial_end: longTrialEnd.toISOString(),
          has_paid_subscription: false,
          access_level: "trial",
          effective_subscription: true,
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-01T00:00:00Z",
            trial_end: longTrialEnd.toISOString(),
            trial_days_remaining: 365,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: vi.fn(),
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: true,
        hasActiveTrial: true,
        hasPaidSubscription: false,
        accessLevel: "trial",
        trialDaysRemaining: 365,
        isTrialExpiring: false,
        isTrialExpired: false,
        canStartTrial: false,
      });

      render(<TrialStatusBanner />);

      expect(screen.getByText("365 dias restantes")).toBeInTheDocument();
      // Should still use green styling for long trials
      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass(
        "border-green-200",
        "bg-green-50",
        "text-green-900"
      );
    });

    it("should handle negative trial days (system clock issues)", () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false,
          subscription_tier: "Trial",
          trial_active: false,
          trial_days_remaining: -5, // Negative days
          trial_end: "2023-12-01T00:00:00Z", // Far in the past
          has_paid_subscription: false,
          access_level: "none",
          effective_subscription: false,
          trial_data: {
            trial_active: false,
            trial_start: "2023-11-24T00:00:00Z",
            trial_end: "2023-12-01T00:00:00Z",
            trial_days_remaining: -5,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: vi.fn(),
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: false,
        hasActiveTrial: false,
        hasPaidSubscription: false,
        accessLevel: "none",
        trialDaysRemaining: -5,
        isTrialExpiring: false,
        isTrialExpired: true,
        canStartTrial: false,
      });

      const { container } = render(<TrialStatusBanner />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle user switching between devices during trial", async () => {
      // Simulate different device with slightly different time
      const deviceTimeOffset = 2 * 60 * 1000; // 2 minutes difference
      const trialEnd = new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000 + deviceTimeOffset
      );

      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false,
          subscription_tier: "Trial",
          trial_active: true,
          trial_days_remaining: 2,
          trial_end: trialEnd.toISOString(),
          has_paid_subscription: false,
          access_level: "trial",
          effective_subscription: true,
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-01T00:00:00Z",
            trial_end: trialEnd.toISOString(),
            trial_days_remaining: 2,
          },
        },
        loading: false,
        error: null,
        checkSubscription: vi.fn(),
        createCheckout: vi.fn(),
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: true,
        hasActiveTrial: true,
        hasPaidSubscription: false,
        accessLevel: "trial",
        trialDaysRemaining: 2,
        isTrialExpiring: false,
        isTrialExpired: false,
        canStartTrial: false,
      });

      render(<TrialStatusBanner />);

      expect(screen.getByText("2 dias restantes")).toBeInTheDocument();
    });

    it("should handle trial during system maintenance", async () => {
      const mockCheckSubscription = vi
        .fn()
        .mockRejectedValue(new Error("Service unavailable"));

      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          subscribed: false,
          subscription_tier: "Trial",
          trial_active: true,
          trial_days_remaining: 3,
          has_paid_subscription: false,
          access_level: "trial",
          effective_subscription: true,
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-01T00:00:00Z",
            trial_end: "2024-01-08T00:00:00Z",
            trial_days_remaining: 3,
          },
        },
        loading: false,
        error: "Service temporarily unavailable",
        checkSubscription: mockCheckSubscription,
        createCheckout: vi.fn(),
        forceRefreshSubscription: vi.fn(),
        cancelSubscription: vi.fn(),
        startTrial: vi.fn(),
        hasActiveSubscription: true,
        hasActiveTrial: true,
        hasPaidSubscription: false,
        accessLevel: "trial",
        trialDaysRemaining: 3,
        isTrialExpiring: false,
        isTrialExpired: false,
        canStartTrial: false,
      });

      render(<TrialStatusBanner />);

      // Should still show trial status based on cached data
      expect(screen.getByText("3 dias restantes")).toBeInTheDocument();
    });
  });
});
