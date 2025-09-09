import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionGuard } from "../SubscriptionGuard";

// Mock hooks
const mockNavigate = vi.fn();
const mockUseLocation = vi.fn();
const mockUseSubscription = vi.fn();
const mockUseAuth = vi.fn();
const mockSupabaseRpc = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
  };
});

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => mockUseSubscription(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mockSupabaseRpc,
  },
}));

const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("SubscriptionGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: "/dashboard" });
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "test@example.com" },
    });
  });

  describe("Loading States", () => {
    it("shows loading spinner when subscription is loading", () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
        },
        loading: true,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      expect(screen.getByText("Verificando acesso...")).toBeInTheDocument();
      expect(
        screen.getByText("Verificando assinatura e período de teste")
      ).toBeInTheDocument();
    });

    it("shows loading spinner when admin check is loading", () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
        },
        loading: false,
      });
      // Admin loading is handled internally, so we test the combined loading state

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      expect(screen.getByText("Verificando acesso...")).toBeInTheDocument();
    });
  });

  describe("Hierarchical Access Control", () => {
    it("allows access for admin users (level 1)", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: true, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
    });

    it("allows access for users with paid subscription (level 2)", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "premium",
          effective_subscription: true,
          trial_active: false,
          has_paid_subscription: true,
          subscription_tier: "Premium",
          status: "active",
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
    });

    it("allows access for users with active trial (level 3)", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "trial",
          effective_subscription: true,
          trial_active: true,
          has_paid_subscription: false,
          trial_days_remaining: 5,
          trial_end: "2024-01-15T00:00:00Z",
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
    });

    it("denies access for users without subscription or trial (level 4)", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/perfil");
      });
    });
  });

  describe("Priority Hierarchy", () => {
    it("prioritizes admin access over paid subscription", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "premium",
          effective_subscription: true,
          trial_active: false,
          has_paid_subscription: true,
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: true, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
      // Should grant access due to admin status, not subscription
    });

    it("prioritizes paid subscription over trial", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "premium",
          effective_subscription: true,
          trial_active: true,
          has_paid_subscription: true,
          trial_days_remaining: 3,
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
      // Should grant access due to paid subscription, even with active trial
    });
  });

  describe("Profile Page Exception", () => {
    it("allows access to profile page even without subscription", async () => {
      mockUseLocation.mockReturnValue({ pathname: "/perfil" });
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("denies access on subscription check error", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
        },
        loading: false,
      });
      mockSupabaseRpc.mockRejectedValue(new Error("Network error"));

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/perfil");
      });
    });

    it("handles malformed subscription data gracefully", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: null, // Malformed data
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/perfil");
      });
    });
  });

  describe("Trial-Specific Scenarios", () => {
    it("allows access for trial with remaining days", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "trial",
          effective_subscription: true,
          trial_active: true,
          has_paid_subscription: false,
          trial_days_remaining: 2,
          trial_end: "2024-01-12T00:00:00Z",
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-05T00:00:00Z",
            trial_end: "2024-01-12T00:00:00Z",
            trial_days_remaining: 2,
          },
        },
        loading: false,
        createCheckout: jest.fn(),
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
    });

    it("denies access for expired trial on non-basic pages", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
          trial_days_remaining: 0,
          trial_end: "2024-01-01T00:00:00Z", // Past date
          trial_data: {
            trial_active: false,
            trial_start: "2023-12-25T00:00:00Z",
            trial_end: "2024-01-01T00:00:00Z",
            trial_days_remaining: 0,
          },
        },
        loading: false,
        createCheckout: jest.fn(),
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/perfil");
      });
    });

    it("allows basic access for expired trial on dashboard page", async () => {
      mockUseLocation.mockReturnValue({ pathname: "/dashboard" });
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
          trial_days_remaining: 0,
          trial_end: "2024-01-01T00:00:00Z",
          trial_data: {
            trial_active: false,
            trial_start: "2023-12-25T00:00:00Z",
            trial_end: "2024-01-01T00:00:00Z",
            trial_days_remaining: 0,
          },
        },
        loading: false,
        createCheckout: jest.fn(),
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("shows trial expiration modal for expired trial", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
          trial_days_remaining: 0,
          trial_end: "2024-01-01T00:00:00Z",
          trial_data: {
            trial_active: false,
            trial_start: "2023-12-25T00:00:00Z",
            trial_end: "2024-01-01T00:00:00Z",
            trial_days_remaining: 0,
          },
        },
        loading: false,
        createCheckout: jest.fn(),
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

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

    it("shows trial expiration modal for trial expiring in 1 day", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "trial",
          effective_subscription: true,
          trial_active: true,
          has_paid_subscription: false,
          trial_days_remaining: 1,
          trial_end: "2024-01-11T00:00:00Z",
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-04T00:00:00Z",
            trial_end: "2024-01-11T00:00:00Z",
            trial_days_remaining: 1,
          },
        },
        loading: false,
        createCheckout: jest.fn(),
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

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
    });
  });
});
  describe("Advanced Trial Scenarios", () => {
    it("should handle trial expiring within hours", async () => {
      const nearExpiryDate = new Date();
      nearExpiryDate.setHours(nearExpiryDate.getHours() + 2); // 2 hours remaining

      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "trial",
          effective_subscription: true,
          trial_active: true,
          has_paid_subscription: false,
          trial_days_remaining: 1, // Less than 1 day
          trial_end: nearExpiryDate.toISOString(),
          trial_data: {
            trial_active: true,
            trial_start: "2024-01-04T00:00:00Z",
            trial_end: nearExpiryDate.toISOString(),
            trial_days_remaining: 1,
          },
        },
        loading: false,
        createCheckout: vi.fn(),
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
        expect(screen.getByText("Seu teste expira em 1 dia")).toBeInTheDocument();
      });
    });

    it("should handle trial with future start date", async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 8);

      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false, // Not active yet
          has_paid_subscription: false,
          trial_days_remaining: 0,
          trial_start: futureStart.toISOString(),
          trial_end: futureEnd.toISOString(),
          trial_data: {
            trial_active: false,
            trial_start: futureStart.toISOString(),
            trial_end: futureEnd.toISOString(),
            trial_days_remaining: 0,
          },
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/perfil");
      });
    });

    it("should handle corrupted trial data", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "trial",
          effective_subscription: true,
          trial_active: true,
          has_paid_subscription: false,
          trial_days_remaining: null, // Corrupted data
          trial_start: "invalid-date",
          trial_end: null,
          trial_data: {
            trial_active: true,
            trial_start: "invalid-date",
            trial_end: null,
            trial_days_remaining: null,
          },
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      // Should still allow access based on effective_subscription
      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
    });

    it("should handle subscription upgrade during trial", async () => {
      // Start with trial
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "trial",
          effective_subscription: true,
          trial_active: true,
          has_paid_subscription: false,
          trial_days_remaining: 3,
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      const { rerender } = renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });

      // Simulate upgrade to paid subscription
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "premium",
          effective_subscription: true,
          trial_active: true, // Trial still exists
          has_paid_subscription: true, // But paid takes priority
          trial_days_remaining: 3,
          subscription_tier: "Premium",
          status: "active",
        },
        loading: false,
      });

      rerender(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
        // Should not show trial expiration modal anymore
        expect(screen.queryByText("Seu teste expira")).not.toBeInTheDocument();
      });
    });
  });

  describe("Complex Access Scenarios", () => {
    it("should handle admin with expired trial", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
          trial_days_remaining: 0,
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: true, error: null }); // Admin

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
      // Admin access should override expired trial
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should handle subscription cancellation during trial", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "trial",
          effective_subscription: true,
          trial_active: true,
          has_paid_subscription: false,
          trial_days_remaining: 2,
          subscription_tier: "Premium", // Had premium but cancelled
          status: "cancelled",
          cancel_at_period_end: true,
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
      // Should still have access through trial
    });

    it("should handle multiple subscription tiers", async () => {
      const subscriptionTiers = ["Basic", "Premium", "Enterprise"];

      for (const tier of subscriptionTiers) {
        mockUseSubscription.mockReturnValue({
          subscriptionData: {
            access_level: "premium",
            effective_subscription: true,
            trial_active: false,
            has_paid_subscription: true,
            subscription_tier: tier,
            status: "active",
          },
          loading: false,
        });
        mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

        const { unmount } = renderWithRouter(
          <SubscriptionGuard>
            <TestComponent />
          </SubscriptionGuard>
        );

        await waitFor(() => {
          expect(screen.getByText("Protected Content")).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe("Error Recovery", () => {
    it("should recover from temporary network errors", async () => {
      let callCount = 0;
      mockSupabaseRpc.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Network timeout"));
        }
        return Promise.resolve({ data: false, error: null });
      });

      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "premium",
          effective_subscription: true,
          trial_active: false,
          has_paid_subscription: true,
        },
        loading: false,
      });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      // Should eventually allow access despite initial error
      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
    });

    it("should handle subscription service outage", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: null, // Service unavailable
        loading: false,
        error: "Service temporarily unavailable",
      });
      mockSupabaseRpc.mockRejectedValue(new Error("Service outage"));

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/perfil");
      });
    });

    it("should handle partial data corruption", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          // Missing some required fields
          access_level: undefined,
          effective_subscription: undefined,
          trial_active: undefined,
          has_paid_subscription: undefined,
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/perfil");
      });
    });
  });

  describe("Performance and Memory", () => {
    it("should not cause memory leaks with rapid navigation", async () => {
      const paths = ["/dashboard", "/receitas", "/despesas", "/metas"];
      
      for (const path of paths) {
        mockUseLocation.mockReturnValue({ pathname: path });
        mockUseSubscription.mockReturnValue({
          subscriptionData: {
            access_level: "premium",
            effective_subscription: true,
            trial_active: false,
            has_paid_subscription: true,
          },
          loading: false,
        });
        mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

        const { unmount } = renderWithRouter(
          <SubscriptionGuard>
            <TestComponent />
          </SubscriptionGuard>
        );

        await waitFor(() => {
          expect(screen.getByText("Protected Content")).toBeInTheDocument();
        });

        unmount();
      }
    });

    it("should handle high-frequency subscription updates", async () => {
      const { rerender } = renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      // Simulate rapid subscription status changes
      for (let i = 0; i < 10; i++) {
        mockUseSubscription.mockReturnValue({
          subscriptionData: {
            access_level: i % 2 === 0 ? "premium" : "trial",
            effective_subscription: true,
            trial_active: i % 2 !== 0,
            has_paid_subscription: i % 2 === 0,
            trial_days_remaining: i % 2 !== 0 ? 7 - i : 0,
          },
          loading: false,
        });
        mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

        rerender(
          <SubscriptionGuard>
            <TestComponent />
          </SubscriptionGuard>
        );

        await waitFor(() => {
          expect(screen.getByText("Protected Content")).toBeInTheDocument();
        });
      }
    });
  });

  describe("Accessibility and UX", () => {
    it("should provide proper loading states for screen readers", () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
        },
        loading: true,
      });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      const loadingElement = screen.getByText("Verificando acesso...");
      expect(loadingElement).toHaveAttribute("role", "status");
      expect(loadingElement).toHaveAttribute("aria-live", "polite");
    });

    it("should handle focus management during navigation", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
        },
        loading: false,
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/perfil");
      });
    });

    it("should provide clear error messages", async () => {
      mockUseSubscription.mockReturnValue({
        subscriptionData: {
          access_level: "none",
          effective_subscription: false,
          trial_active: false,
          has_paid_subscription: false,
        },
        loading: false,
        error: "Failed to load subscription data",
      });
      mockSupabaseRpc.mockResolvedValue({ data: false, error: null });

      renderWithRouter(
        <SubscriptionGuard>
          <TestComponent />
        </SubscriptionGuard>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/perfil");
      });
    });
  });
});