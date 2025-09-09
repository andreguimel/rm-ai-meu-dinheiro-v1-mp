import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SubscriptionGuard } from "../SubscriptionGuard";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

// Mock the hooks
vi.mock("@/hooks/useSubscription");
vi.mock("@/hooks/useAuth");
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

const mockUseSubscription = useSubscription as vi.MockedFunction<
  typeof useSubscription
>;
const mockUseAuth = useAuth as vi.MockedFunction<typeof useAuth>;

describe("Trial Expiration Flow", () => {
  const mockCreateCheckout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: "test-user", email: "test@example.com" },
      session: { access_token: "test-token" },
    } as any);
  });

  it("should show trial expiration modal when trial is expired", async () => {
    mockUseSubscription.mockReturnValue({
      subscriptionData: {
        subscribed: false,
        trial_active: false,
        has_paid_subscription: false,
        access_level: "none",
        effective_subscription: false,
        trial_data: {
          trial_active: false,
          trial_start: "2024-01-01T00:00:00Z",
          trial_end: "2024-01-08T00:00:00Z",
          trial_days_remaining: 0,
        },
        trial_days_remaining: 0,
      },
      loading: false,
      createCheckout: mockCreateCheckout,
    } as any);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SubscriptionGuard>
          <div>Dashboard Content</div>
        </SubscriptionGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Período de teste expirado")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Continuar com acesso limitado")
    ).toBeInTheDocument();
    expect(screen.getByText("Assinar por R$ 9,90/mês")).toBeInTheDocument();
  });

  it("should show trial expiring modal when trial expires in 1 day", async () => {
    mockUseSubscription.mockReturnValue({
      subscriptionData: {
        subscribed: false,
        trial_active: true,
        has_paid_subscription: false,
        access_level: "trial",
        effective_subscription: true,
        trial_data: {
          trial_active: true,
          trial_start: "2024-01-01T00:00:00Z",
          trial_end: "2024-01-08T00:00:00Z",
          trial_days_remaining: 1,
        },
        trial_days_remaining: 1,
      },
      loading: false,
      createCheckout: mockCreateCheckout,
    } as any);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SubscriptionGuard>
          <div>Dashboard Content</div>
        </SubscriptionGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Seu teste expira em 1 dia")).toBeInTheDocument();
    });

    expect(screen.getByText("Lembrar mais tarde")).toBeInTheDocument();
    expect(screen.getByText("Assinar por R$ 9,90/mês")).toBeInTheDocument();
  });

  it("should provide basic access for expired trial users on allowed pages", async () => {
    mockUseSubscription.mockReturnValue({
      subscriptionData: {
        subscribed: false,
        trial_active: false,
        has_paid_subscription: false,
        access_level: "none",
        effective_subscription: false,
        trial_data: {
          trial_active: false,
          trial_start: "2024-01-01T00:00:00Z",
          trial_end: "2024-01-08T00:00:00Z",
          trial_days_remaining: 0,
        },
        trial_days_remaining: 0,
      },
      loading: false,
      createCheckout: mockCreateCheckout,
    } as any);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SubscriptionGuard>
          <div>Dashboard Content</div>
        </SubscriptionGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    });

    // Should show basic access banner
    expect(screen.getByText(/Modo de visualização/)).toBeInTheDocument();
    expect(
      screen.getByText(/Seu período de teste expirou/)
    ).toBeInTheDocument();
  });

  it("should call createCheckout when upgrade button is clicked", async () => {
    mockUseSubscription.mockReturnValue({
      subscriptionData: {
        subscribed: false,
        trial_active: false,
        has_paid_subscription: false,
        access_level: "none",
        effective_subscription: false,
        trial_data: {
          trial_active: false,
          trial_start: "2024-01-01T00:00:00Z",
          trial_end: "2024-01-08T00:00:00Z",
          trial_days_remaining: 0,
        },
        trial_days_remaining: 0,
      },
      loading: false,
      createCheckout: mockCreateCheckout,
    } as any);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SubscriptionGuard>
          <div>Dashboard Content</div>
        </SubscriptionGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Período de teste expirado")).toBeInTheDocument();
    });

    const upgradeButton = screen.getByText("Assinar por R$ 9,90/mês");
    fireEvent.click(upgradeButton);

    expect(mockCreateCheckout).toHaveBeenCalledTimes(1);
  });

  it("should not show modal for users with active paid subscription", async () => {
    mockUseSubscription.mockReturnValue({
      subscriptionData: {
        subscribed: true,
        trial_active: false,
        has_paid_subscription: true,
        access_level: "premium",
        effective_subscription: true,
        trial_data: {
          trial_active: false,
          trial_start: "2024-01-01T00:00:00Z",
          trial_end: "2024-01-08T00:00:00Z",
          trial_days_remaining: 0,
        },
        trial_days_remaining: 0,
      },
      loading: false,
      createCheckout: mockCreateCheckout,
    } as any);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SubscriptionGuard>
          <div>Dashboard Content</div>
        </SubscriptionGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    });

    // Should not show trial expiration modal
    expect(
      screen.queryByText("Período de teste expirado")
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Seu teste expira/)).not.toBeInTheDocument();
  });
});
